import feedparser
import time
from datetime import datetime
from typing import List, Dict
from src.utils.logger import get_logger

logger = get_logger()

class GeopoliticalNewsManager:
    """
    Fetches real-time geopolitical intelligence from global news agencies.
    Provides filtering for high-impact global conflict and diplomatic shifts.
    """
    
    def __init__(self):
        self.feeds = [
            "http://feeds.bbci.co.uk/news/world/rss.xml",
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://feeds.a.dj.com/rss/RSSWorldNews.xml" # Wall Street Journal World News
        ]
        
    def get_top_geopolitical_news(self, limit: int = 10) -> List[Dict]:
        """
        Fetches and aggregates news from multiple global feeds.
        """
        all_entries = []
        
        for feed_url in self.feeds:
            try:
                logger.info(f"Fetching geopolitical feed: {feed_url}")
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries:
                    # Basic extraction
                    title = entry.get('title', '')
                    summary = entry.get('summary', '') or entry.get('description', '')
                    published = entry.get('published', '')
                    
                    # Sentiment/Impact proxy logic (Looking for conflict keywords)
                    impact = "MODERATE"
                    keywords_high = ['war', 'conflict', 'strike', 'attack', 'nuclear', 'sanctions', 'crisis', 'invasion', 'missile', 'military']
                    
                    text_blob = (title + " " + summary).lower()
                    if any(k in text_blob for k in keywords_high):
                        impact = "HIGH"
                    
                    # Convert published time to relative format or keep string
                    all_entries.append({
                        "event": title,
                        "content": summary[:200] + "..." if len(summary) > 200 else summary,
                        "date": published,
                        "impact": impact,
                        "source": feed_url.split('/')[2],
                        "type": "GEO" if impact == "HIGH" else "INTEL"
                    })
                    
            except Exception as e:
                logger.error(f"Failed to fetch feed {feed_url}: {e}")
                
        # Sort by impact then date (assuming date string works or we just take first few from each)
        # For simplicity, we just return the first 'limit' entries after filtering for uniqueness
        unique_news = []
        seen_titles = set()
        
        # Sort so HIGH impact comes first
        all_entries.sort(key=lambda x: x['impact'] == "HIGH", reverse=True)
        
        for item in all_entries:
            if item['event'] not in seen_titles:
                unique_news.append(item)
                seen_titles.add(item['event'])
            if len(unique_news) >= limit:
                break
                
        return unique_news

if __name__ == "__main__":
    gnm = GeopoliticalNewsManager()
    news = gnm.get_top_geopolitical_news()
    for n in news:
        print(f"[{n['impact']}] {n['event']}")
