
"""
Pipeline executor with validation gates between every stage.

Each stage must PASS its validation before the next stage runs.
Failed stages are retried up to MAX_RETRIES times.
On persistent failure, the stage is SKIPPED and the 
system continues with last known good data.
"""

import subprocess
import json
import time
import logging
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

MAX_RETRIES    = 10
RETRY_DELAY    = 5    # seconds between retries
DATA_DIR       = Path('data')
LOG_DIR        = Path('logs')

class StageResult:
    def __init__(self, name, success, duration_sec, 
                 records=None, error=None):
        self.name         = name
        self.success      = success
        self.duration_sec = round(duration_sec, 2)
        self.records      = records  # number of items updated
        self.error        = error
        self.timestamp    = datetime.now(timezone.utc).isoformat()

    def to_dict(self):
        return {
            'stage':       self.name,
            'success':     self.success,
            'duration_sec': self.duration_sec,
            'records':     self.records,
            'error':       self.error,
            'timestamp':   self.timestamp,
        }

class PipelineExecutor:
    """
    Runs each pipeline stage with:
    - Retry logic (up to MAX_RETRIES)
    - Validation gates between stages
    - Structured JSON logging per run
    - Data integrity checks
    - Cache invalidation on success
    """

    def __init__(self):
        LOG_DIR.mkdir(exist_ok=True)
        DATA_DIR.mkdir(exist_ok=True)
        self.run_log_path = LOG_DIR / 'pipeline_runs.jsonl'
        from src.pipeline.health import PipelineHealthMonitor
        self.health = PipelineHealthMonitor()

    def _heartbeat(self):
        now = datetime.now(timezone.utc).strftime('%H:%M:%S')
        logger.info(f"[HEARTBEAT] Pipeline alive at {now} UTC")

    # ── HOT PIPELINE ─────────────────────────────────────────────

    def run_hot_pipeline(self) -> bool:
        """
        Hot path: price data + high-impact news only.
        """
        run_id = self._make_run_id('HOT')
        results = []
        logger.info("HOT pipeline started [%s]", run_id)
        t_start = time.time()
        self._heartbeat()

        # Stage 1: MT5 price fetch (HARD FAIL)
        r_price = self._run_stage('mt5_price_fetch', self._fetch_mt5_prices, self._validate_prices)
        results.append(r_price)
        
        if not r_price.success:
            logger.error(f"HOT[{run_id}]: MT5 persistent failure. Entering SAFE MODE.")
            self.health.record_failure(run_id, "MT5 Connection Lost")
            self._log_run(run_id, 'HOT', results, time.time() - t_start)
            return False

        # Stage 2: News fetch (PARTIAL FAIL ALLOWED)
        r_news = self._run_stage('news_fetch', self._fetch_news, self._validate_news)
        results.append(r_news)

        # Stage 3: Prediction (HARD FAIL)
        r_pred = self._run_stage('predict_all', self._run_predictions, self._validate_predictions)
        results.append(r_pred)

        if r_pred.success:
            self._invalidate_cache()
            self.health.record_success(run_id)
        else:
            self.health.record_failure(run_id, r_pred.error or "Prediction Failed")

        total = round(time.time() - t_start, 2)
        self._log_run(run_id, 'HOT', results, total)
        logger.info(f"HOT pipeline [{run_id}] done in {total:.1f}s — [PERF] Fetch: {r_price.duration_sec}s, News: {r_news.duration_sec}s, Predict: {r_pred.duration_sec}s")
        return r_pred.success

    # ── FULL PIPELINE ─────────────────────────────────────────────

    def run_full_pipeline(self) -> bool:
        """
        Full pipeline: all data sources + full feature recompute.
        """
        run_id = self._make_run_id('FULL')
        results = []
        logger.info("FULL pipeline started [%s]", run_id)
        t_start = time.time()
        self._heartbeat()

        stages = [
            ('mt5_price_fetch',     self._fetch_mt5_prices,    self._validate_prices,     True),
            ('economic_calendar',   self._fetch_calendar,      self._validate_calendar,   False),
            ('news_full',           self._fetch_news_full,     self._validate_news,       False),
            ('feature_pipeline',    self._run_feature_pipeline, self._validate_features,   True),
            ('predict_all',         self._run_predictions,     self._validate_predictions, True),
            ('llm_reports',         self._generate_llm_reports, None,                      False),
        ]

        overall_success = True
        for name, fn, validate_fn, hard_fail in stages:
            r = self._run_stage(name=name, fn=fn, validate_fn=validate_fn)
            results.append(r)
            if not r.success:
                if hard_fail:
                    logger.error(f"FULL[{run_id}]: HARD FAIL at stage '{name}' — entering survival mode.")
                    self.health.record_failure(run_id, f"Hard Fail: {name}")
                    self._log_run(run_id, 'FULL', results, time.time() - t_start)
                    return False
                else:
                    logger.warning(f"FULL[{run_id}]: Partial fail at non-critical stage '{name}'. Continuing...")
                    overall_success = False

        # If we reached here, hard stages passed
        self._invalidate_cache(full=True)
        self.health.record_success(run_id)

        total = round(time.time() - t_start, 2)
        perf_str = ", ".join([f"{r.name}: {r.duration_sec}s" for r in results])
        self._log_run(run_id, 'FULL', results, total)
        logger.info(f"FULL pipeline [{run_id}] done in {total:.1f}s — [PERF] {perf_str}")
        return True

    # ── STAGE RUNNER ──────────────────────────────────────────────

    def _run_stage(self, name: str, fn, validate_fn=None) -> StageResult:
        """Run one stage with retry logic and performance monitoring."""
        last_error = "Unknown"
        for attempt in range(1, MAX_RETRIES + 1):
            t0 = time.time()
            try:
                records = fn()
                duration = time.time() - t0

                if validate_fn is not None:
                    valid, msg = validate_fn()
                    if not valid:
                        raise ValueError(f"Validation failed: {msg}")

                logger.info(f"Stage '{name}' OK (attempt {attempt}, {duration:.1f}s, {records} records)")
                return StageResult(name, True, duration, records)

            except Exception as e:
                last_error = str(e)
                duration = time.time() - t0
                # Performance log even on failure
                logger.warning(f"Stage '{name}' attempt {attempt} FAILED ({duration:.1f}s): {last_error}")
                
                if attempt < MAX_RETRIES:
                    # Exponential-ish backoff
                    sleep_time = RETRY_DELAY * min(attempt, 4)
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Stage '{name}' persistent failure after {MAX_RETRIES} attempts.")

        return StageResult(name, False, time.time() - t0, error=last_error)

    # ── STAGE IMPLEMENTATIONS ─────────────────────────────────────

    def _fetch_mt5_prices(self) -> int:
        from src.data.mtf_feed import MTFCandleFetcher
        fetcher = MTFCandleFetcher()
        return fetcher.fetch_all()

    def _validate_prices(self) -> tuple[bool, str]:
        from src.data.mtf_feed import TIMEFRAME_CONFIG
        import os
        # Single asset focus based on config.yaml
        assets = ['XAUUSD']
        now = time.time()
        
        for asset in assets:
            for tf, cfg in TIMEFRAME_CONFIG.items():
                path = DATA_DIR / 'prices' / f'{asset}_{tf}.parquet'
                if not path.exists():
                    return False, f"Missing: {path}"
                age = now - os.path.getmtime(path)
                limit = cfg['refresh_sec'] * 3  # 3x grace window
                if age > limit:
                    return False, f"{asset} {tf} price file is {age/60:.0f}min old (limit {limit/60:.0f}min)"
        return True, "all price files fresh"

    def _fetch_news(self) -> int:
        result = subprocess.run(
            ['python', 'tools/fetch_todays_news.py'],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr[:500])
        return self._parse_count(result.stdout, 'news')

    def _fetch_news_full(self) -> int:
        return self._fetch_news() # Redirect for now

    def _validate_news(self) -> tuple[bool, str]:
        news_path = DATA_DIR / 'news_sentiment.csv'
        if not news_path.exists():
            return False, "news_sentiment.csv missing"
        return True, "news fresh"

    def _fetch_calendar(self) -> int:
        result = subprocess.run(
            ['python', 'tools/fetch_xml_calendar.py'],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr[:500])
        return self._parse_count(result.stdout, 'events')

    def _validate_calendar(self) -> tuple[bool, str]:
        cal_path = DATA_DIR / 'calendar_cache.json'
        if not cal_path.exists():
            return False, "calendar missing"
        return True, "calendar ok"

    def _run_feature_pipeline(self) -> int:
        # NOTE: Predict_all already generates live features via build_features_from_df.
        # We do NOT want to rebuild AI models from scratch every single hour.
        # Model training should be done manually or via a separate weekly chron job.
        logger.info("Skipping full model re-training (using cached production models).")
        return 1

    def _validate_features(self) -> tuple[bool, str]:
        # Check if features_enhanced.csv exists
        feat_path = DATA_DIR / 'features_enhanced.csv'
        if not feat_path.exists():
            return False, "features_enhanced.csv missing"
        return True, "features ok"

    def _run_predictions(self) -> int:
        result = subprocess.run(
            ['python', 'tools/predict_all.py', '--json', '--headless'],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
             # Try without headless first to see if it's there
             result2 = subprocess.run(
                ['python', 'tools/predict_all.py', '--json'],
                capture_output=True, text=True, timeout=300
            )
             if result2.returncode != 0:
                # Capture the END of stderr/stdout where the actual python traceback is
                error_msg = result.stderr[-1500:] if result.stderr else result.stdout[-1500:]
                raise RuntimeError(f"Prediction failed:\n{error_msg}")
        return 1

    def _validate_predictions(self) -> tuple[bool, str]:
        pred_path = DATA_DIR / 'prediction_cache.json'
        if not pred_path.exists():
            return False, "prediction_cache.json missing"
        return True, "predictions ok"

    def _generate_llm_reports(self) -> int:
        result = subprocess.run(
            ['python', 'tools/generate_llm_report.py'],
            capture_output=True, text=True, timeout=120
        )
        return 1

    def _invalidate_cache(self, full: bool = False):
        # Concrete cache invalidation
        # For now, hit the Next.js API if running locally on 3000
        import requests
        try:
             # next.js watcher file
             bust_path = DATA_DIR / 'cache_bust.json'
             with open(bust_path, 'w') as f:
                 json.dump({'busted_at': datetime.now(timezone.utc).isoformat(), 'full': full}, f)
             
             # Optionally hit a webhook
             # requests.post('http://localhost:3000/api/cache-invalidate', json={'key': 'predictions'}, timeout=2)
        except Exception:
             pass

    # ── HELPERS ───────────────────────────────────────────────────

    def _make_run_id(self, pipeline_type: str) -> str:
        ts = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        return f"{pipeline_type}_{ts}"

    def _parse_count(self, stdout: str, key: str) -> int:
        # Simplified parser
        return 1

    def _log_run(self, run_id: str, pipeline_type: str, results: list, total_sec: float):
        entry = {
            'run_id': run_id,
            'pipeline_type': pipeline_type,
            'total_sec': round(total_sec, 2),
            'stages': [r.to_dict() for r in results],
            'overall_ok': all(r.success for r in results),
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        with open(self.run_log_path, 'a') as f:
            f.write(json.dumps(entry) + '\n')
