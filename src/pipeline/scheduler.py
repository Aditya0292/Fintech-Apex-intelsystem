
"""
Session-aware pipeline scheduler.
Fully config-driven from config.yaml.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import (
    EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_MISSED
)
import pytz
import logging
from datetime import datetime, timezone

from src.pipeline.executor  import PipelineExecutor
from src.pipeline.health    import PipelineHealthMonitor
from src.utils.config_loader import config

logger = logging.getLogger(__name__)

UTC = pytz.utc

class ApexScheduler:
    """
    Master scheduler for APEX pipeline.
    """

    def __init__(self):
        self.config   = config
        self.executor = PipelineExecutor()
        self.monitor  = PipelineHealthMonitor()
        
        # Load pipeline config
        p_cfg = self.config.get('pipeline', {})
        self.full_times      = p_cfg.get('full_pipeline_times_utc', [])
        self.session_cfg     = p_cfg.get('session_schedule', {})
        self.retry_limit     = p_cfg.get('retry', {}).get('max_attempts', 3)
        
        self.scheduler = BackgroundScheduler(
            timezone=UTC,
            job_defaults={
                'coalesce':    True,
                'max_instances': 1,
                'misfire_grace_time': 120,
            }
        )

    def start(self):
        # Listen for job events
        self.scheduler.add_listener(
            self._on_job_event,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR | EVENT_JOB_MISSED
        )

        # 1. Full pipeline at session boundaries (Config Driven)
        for time_str in self.full_times:
            try:
                hour, minute = map(int, time_str.split(':'))
                self.scheduler.add_job(
                    self.executor.run_full_pipeline,
                    trigger='cron',
                    hour=hour, minute=minute,
                    id=f'full_{time_str.replace(":", "")}',
                    name=f'Full Pipeline {time_str} UTC',
                )
            except Exception as e:
                logger.error(f"Failed to schedule full pipeline job for {time_str}: {e}")

        # 2. Hot loop — adapts interval based on dynamic session schedule
        self.scheduler.add_job(
            self._run_hot_aware,
            trigger='interval',
            minutes=2,   # Check every 2 min for session transition
            id='hot_loop',
            name='Hot Loop (session-aware)',
        )

        # 3. Health check every 5 minutes
        self.scheduler.add_job(
            self.monitor.check,
            trigger='interval',
            minutes=5,
            id='health_check',
            name='Pipeline Health Monitor',
        )

        self.scheduler.start()
        logger.info("ApexScheduler started with session-aware config.")

    def _run_hot_aware(self):
        """Run hot pipeline at session-appropriate frequency."""
        now_utc = datetime.now(timezone.utc)
        
        # Dynamic check against session_schedule in config.yaml
        interval = self._get_session_interval(now_utc.hour)
        
        last_hot = self.monitor.last_hot_run_time
        if last_hot is not None:
            elapsed = (now_utc - last_hot).total_seconds() / 60
            if elapsed < interval:
                return
        
        self.executor.run_hot_pipeline()

    def _get_session_interval(self, hour_utc: int) -> int:
        """Looks up the interval for the current hour from config."""
        for session_name, data in self.session_cfg.items():
            if data['utc_start'] <= hour_utc < data['utc_end']:
                return data['hot_interval_min']
        return 15  # Default fallback

    def _on_job_event(self, event):
        if event.exception:
            self.monitor.record_failure(
                job_id=event.job_id,
                error=str(event.exception)
            )
        else:
            self.monitor.record_success(job_id=event.job_id)

    def stop(self):
        self.scheduler.shutdown(wait=False)
