
"""
Entry point for the APEX pipeline process.
Validated for Production-Grade Resilience.
"""

import logging
import signal
import sys
import time
import os
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.pipeline.scheduler import ApexScheduler
from src.utils.config_loader import config as cfg

# Ensure logs directory exists
Path('logs').mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('logs/pipeline.log'),
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger('apex.pipeline')

def validate_config(cfg):
    """Strict validation for session-aware schedule at startup."""
    p_cfg = cfg.get('pipeline')
    if not p_cfg:
        logger.error("Config MISSING [pipeline] section.")
        sys.exit(1)
        
    required_keys = ['session_schedule', 'full_pipeline_times_utc', 'retry', 'alerts']
    for key in required_keys:
        if key not in p_cfg:
            logger.error(f"Config MISSING required pipeline key: {key}")
            sys.exit(1)
            
    # Validate session times
    for s_name, s_data in p_cfg['session_schedule'].items():
        if 'utc_start' not in s_data or 'utc_end' not in s_data or 'hot_interval_min' not in s_data:
            logger.error(f"Config INVALID session data for {s_name}.")
            sys.exit(1)
            
    # Validate full pipeline times format (HH:MM)
    for t_str in p_cfg['full_pipeline_times_utc']:
        if ':' not in t_str or len(t_str.split(':')) != 2:
            logger.error(f"Config INVALID full_pipeline_time format: {t_str}")
            sys.exit(1)

def main():
    # 1. Load & Validate (Already loaded as 'cfg' in import)
    validate_config(cfg)
    
    # 2. Initialize
    scheduler = ApexScheduler()
    stopped = False
    
    def shutdown(sig, frame):
        nonlocal stopped
        if not stopped:
            logger.info("Shutting down APEX pipeline...")
            scheduler.stop()
            stopped = True
        sys.exit(0)
    
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    
    logger.info("APEX Pipeline starting...")
    
    # Run full pipeline immediately on startup
    logger.info("Running initial full pipeline on startup...")
    try:
        scheduler.executor.run_full_pipeline()
    except Exception as e:
        logger.error(f"Initial full pipeline failed: {e}")
    
    scheduler.start()
    
    logger.info("APEX Pipeline running. Monitoring session-aware cadence.")
    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        if not stopped:
            logger.info("Shutting down...")
            scheduler.stop()
            stopped = True

if __name__ == '__main__':
    main()
