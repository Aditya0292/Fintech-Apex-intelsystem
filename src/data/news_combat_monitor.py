
import time
import requests
import json
import os
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from src.utils.logger import get_logger
from src.utils.config_loader import config
from src.data.news_manager import NewsManager

logger = get_logger()

class NewsCombatMonitor:
    """
    High-Frequency News Monitor for Institutional Windows.
    Activates 10m before Red Folder events and polls every 5s for the 'Actual' release.
    """
    
    def __init__(self):
        self.news_manager = NewsManager()
        self.active_windows = []
        self.is_monitoring = False
        self.combat_mode = False
        self.active_event = None
        self.last_results = {} # { event_title: {actual, bias, time} }
        self._stop_event = threading.Event()
        self.status_file = "outputs/combat_status.json"
        
        # Ensure directory exists
        os.makedirs("outputs", exist_ok=True)

    def _save_status(self):
        """Saves current monitor status for the web dashboard."""
        status = {
            "is_monitoring": self.is_monitoring,
            "combat_mode": self.combat_mode,
            "active_event": self.active_event,
            "last_results": self.last_results,
            "updated_at": datetime.now().isoformat()
        }
        try:
            with open(self.status_file, "w") as f:
                json.dump(status, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to save status: {e}")

    def calculate_bias(self, event_name: str, actual_str: str, forecast_str: str) -> str:
        """
        Determines the institutional bias based on the news surprise.
        Rule: Stronger USD -> Bearish XAUUSD, Bullish USDJPY.
        """
        try:
            def clean(val):
                val = str(val).lower().replace('k','e3').replace('m','e6').replace('b','e9').replace('%','').replace(',','')
                return float(val)

            act = clean(actual_str)
            fcst = clean(forecast_str)
            deviation = act - fcst
            
            # Inverse logic for Unemployment/Claims
            is_inverse = "unemployment" in event_name.lower() or "claims" in event_name.lower()
            
            if is_inverse:
                # Higher Unemp -> Weak USD
                return "WEAK_USD" if deviation > 0 else "STRONG_USD"
            else:
                # Higher CPI/PPI/NFP -> Strong USD
                return "STRONG_USD" if deviation > 0 else "WEAK_USD"
        except:
            return "NEUTRAL"

    def start_sentinel(self):
        """
        Starts the background sentinel that waits for news windows.
        """
        logger.info("Starting News Combat Sentinel...")
        self.is_monitoring = True
        self._save_status()
        thread = threading.Thread(target=self._sentinel_loop, daemon=True)
        thread.start()

    def _sentinel_loop(self):
        while not self._stop_event.is_set():
            try:
                # 1. Update the calendar for the day
                assets = config.get('assets', {})
                all_currencies = set()
                for sym in assets:
                    currencies = assets[sym].get('csm_currencies', [])
                    if not currencies:
                        all_currencies.add(sym[:3])
                        all_currencies.add(sym[3:])
                    else:
                        for c in currencies: all_currencies.add(c)

                events = self._fetch_fast_calendar()
                
                today = datetime.now().strftime("%Y-%m-%d")
                combat_queue = []
                
                for event in events:
                    if event['impact'] in ['High', 'Medium'] and event['country'] in all_currencies:
                        if today in event['date']:
                            combat_queue.append(event)

                if combat_queue:
                    logger.info(f"Combat Sentinel: {len(combat_queue)} high-impact events identified for today.")
                    self._process_combat_queue(combat_queue)
                
                time.sleep(3600)
            except Exception as e:
                logger.error(f"Combat Sentinel Error: {e}")
                time.sleep(60)

    def _fetch_fast_calendar(self) -> List[Dict]:
        try:
            url = "https://www.forexfactory.com/calendar.php"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            rows = soup.find_all('tr', class_='calendar__row')
            
            events = []
            current_date = ""
            
            for row in rows:
                date_cell = row.find('td', class_='calendar__date')
                if date_cell and date_cell.text.strip():
                    date_text = date_cell.text.strip()
                    current_date = self.news_manager._parse_date(date_text)

                if not current_date: continue

                currency = row.find('td', class_='calendar__currency')
                if not currency or not currency.text.strip(): continue
                
                event_title = row.find('td', class_='calendar__event').text.strip()
                time_str = row.find('td', class_='calendar__time').text.strip()
                
                impact_cell = row.find('td', class_='calendar__impact')
                impact = "Low"
                if impact_cell:
                    span = impact_cell.find('span')
                    if span:
                        cls = span.get('class', [])
                        if 'red' in str(cls): impact = "High"
                        elif 'orange' in str(cls): impact = "Medium"

                events.append({
                    "title": event_title,
                    "country": currency.text.strip(),
                    "date": f"{current_date} {time_str}",
                    "impact": impact
                })
                
            return events
        except Exception as e:
            logger.error(f"Fast Calendar Fetch Failed: {e}")
            return []

    def _process_combat_queue(self, queue: List[Dict]):
        for event in queue:
            try:
                event_time = datetime.strptime(event['date'], "%Y-%m-%d %I:%M%p")
                start_time = event_time - timedelta(minutes=10)
                
                now = datetime.now()
                delay = (start_time - now).total_seconds()
                
                if delay > 0:
                    threading.Timer(delay, self._enter_combat_mode, args=[event]).start()
                elif now < event_time + timedelta(minutes=10):
                    self._enter_combat_mode(event)
            except:
                continue

    def _enter_combat_mode(self, event: Dict):
        logger.info(f"🚨 ENTERING NEWS COMBAT MODE: {event['title']} ({event['country']})")
        self.combat_mode = True
        self.active_event = event
        self._save_status()
        
        end_time = datetime.now() + timedelta(minutes=20)
        
        while datetime.now() < end_time and not self._stop_event.is_set():
            actual = self._poll_actual_value(event['title'], event['country'])
            
            if actual and actual != "":
                forecast = event.get('forecast', '0.0')
                bias = self.calculate_bias(event['title'], actual, forecast)
                
                logger.info(f"🎯 NEWS RELEASE DETECTED: {event['title']} = {actual} | BIAS: {bias}")
                
                self.last_results[event['title']] = {
                    "actual": actual,
                    "bias": bias,
                    "time": datetime.now().strftime("%H:%M:%S")
                }
                
                self.combat_mode = False
                self.active_event = None
                self._save_status()
                break
                
            time.sleep(5)
        
        self.combat_mode = False
        self.active_event = None
        self._save_status()
        logger.info(f"Combat Mode finished for {event['title']}")

    def _poll_actual_value(self, title: str, country: str) -> Optional[str]:
        try:
            url = "https://www.forexfactory.com/calendar.php"
            response = requests.get(url, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            rows = soup.find_all('tr', class_='calendar__row')
            for row in rows:
                row_title = row.find('td', class_='calendar__event')
                row_country = row.find('td', class_='calendar__currency')
                
                if row_title and title in row_title.text and row_country and country in row_country.text:
                    actual = row.find('td', class_='calendar__actual').text.strip()
                    return actual
            return None
        except:
            return None
