
import json
import time
import logging
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from collections import deque
from typing import Optional
import requests as req

logger = logging.getLogger(__name__)

# Ensure data directory exists
DATA_DIR = Path('data')
DATA_DIR.mkdir(exist_ok=True)
HEALTH_PATH = DATA_DIR / 'pipeline_health.json'

MAX_CONSECUTIVE_FAILURES = 3
ALERT_THRESHOLD_MIN = 90  # alert if no successful run in 90 min

class PipelineHealthMonitor:

    def __init__(self):
        self.recent_runs: deque = deque(maxlen=50)
        self.last_hot_run_time: Optional[datetime] = None
        self.last_full_run_time: Optional[datetime] = None
        self.last_valid_signal_time: Optional[datetime] = None
        self.status_message: str = "Initializing..."
        self.consecutive_failures: int = 0
        self.webhook_url = os.getenv('APEX_ALERT_WEBHOOK', '')
        self._load_state()

    def _send_alert(self, message: str):
        """Send alert to Slack or Teams webhook."""
        if not self.webhook_url:
            return
        try:
            # Standard Slack/Teams-compatible payload
            payload = {"text": f"[{datetime.now().strftime('%H:%M:%S')}] {message}"}
            req.post(self.webhook_url, json=payload, timeout=5)
        except Exception as e:
            logger.error(f"Alert failed: {e}")

    def record_success(self, job_id: str):
        now = datetime.now(timezone.utc)
        
        # Recovery Alert Logic
        if self.consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
            self._send_alert(f"✅ APEX Pipeline RECOVERED after {self.consecutive_failures} failures.")
            
        self.consecutive_failures = 0
        self.status_message = "HEALTHY"
        self.last_valid_signal_time = now
        
        if 'hot' in job_id.lower():
            self.last_hot_run_time = now
        elif 'full' in job_id.lower():
            self.last_full_run_time = now
            
        self.recent_runs.append({
            'status': 'ok', 'job': job_id,
            'time': now.isoformat()
        })
        self._save_state()

    def record_failure(self, job_id: str, error: str):
        self.consecutive_failures += 1
        
        # Determine status message
        if "mt5" in error.lower() or "meta" in error.lower():
            self.status_message = "DEGRADED (MT5 Disconnected)"
        else:
            self.status_message = f"DEGRADED ({job_id})"

        self.recent_runs.append({
            'status': 'fail', 'job': job_id,
            'error': error[:200],
            'time': datetime.now(timezone.utc).isoformat()
        })
        
        # Threshold Alerting
        if self.consecutive_failures == MAX_CONSECUTIVE_FAILURES:
            self.status_message = "ERROR (Persistent Failure)"
            msg = (
                f"🚨 APEX Pipeline CRITICAL: {self.consecutive_failures} consecutive failures.\n"
                f"Job: `{job_id}`\n"
                f"Last error: `{error[:200]}`"
            )
            logger.critical(msg)
            self._send_alert(msg)
            
        self._save_state()

    def check(self):
        """Called every 5 minutes by scheduler."""
        now = datetime.now(timezone.utc)
        if self.last_hot_run_time is not None:
            age_min = (now - self.last_hot_run_time).total_seconds() / 60
            if age_min > ALERT_THRESHOLD_MIN:
                logger.warning(f"No successful pipeline run in {age_min:.0f} minutes")

    def get_health_report(self) -> dict:
        now = datetime.now(timezone.utc)
        def age_min(dt):
            if dt is None: return None
            return round((now - dt).total_seconds() / 60, 1)
        
        return {
            'last_hot_run_min_ago':  age_min(self.last_hot_run_time),
            'last_full_run_min_ago': age_min(self.last_full_run_time),
            'last_valid_signal_min_ago': age_min(self.last_valid_signal_time),
            'consecutive_failures':  self.consecutive_failures,
            'alert':                 (self.consecutive_failures >= MAX_CONSECUTIVE_FAILURES),
            'recent_runs':           list(self.recent_runs)[-10:],
            'status':                self.status_message.lower(),
            'status_label':          self.status_message
        }

    def _save_state(self):
        try:
            state = {
                'last_hot':  self.last_hot_run_time.isoformat() if self.last_hot_run_time else None,
                'last_full': self.last_full_run_time.isoformat() if self.last_full_run_time else None,
                'last_valid': self.last_valid_signal_time.isoformat() if self.last_valid_signal_time else None,
                'consec_fail': self.consecutive_failures,
                'status_msg': self.status_message,
            }
            with open(HEALTH_PATH, 'w') as f:
                json.dump(state, f)
        except Exception as e:
            logger.error(f"Failed to save health state: {e}")

    def _load_state(self):
        try:
            if HEALTH_PATH.exists():
                with open(HEALTH_PATH) as f:
                    state = json.load(f)
                if state.get('last_hot'): self.last_hot_run_time = datetime.fromisoformat(state['last_hot'])
                if state.get('last_full'): self.last_full_run_time = datetime.fromisoformat(state['last_full'])
                if state.get('last_valid'): self.last_valid_signal_time = datetime.fromisoformat(state['last_valid'])
                self.consecutive_failures = state.get('consec_fail', 0)
                self.status_message = state.get('status_msg', 'HEALTHY')
        except Exception as e:
            logger.error(f"Failed to load health state: {e}")

if __name__ == '__main__':
    # --test-alert CLI Flag Implementation
    if '--test-alert' in sys.argv:
        print("--- APEX Alert Test ---")
        monitor = PipelineHealthMonitor()
        if not monitor.webhook_url:
            print("ERROR: APEX_ALERT_WEBHOOK env var NOT found.")
            sys.exit(1)
        print(f"Sending test alert to: {monitor.webhook_url[:20]}...")
        monitor._send_alert("🔔 APEX Pipeline: Webhook Test Signal")
        print("Success: Test signal sent.")
        sys.exit(0)
