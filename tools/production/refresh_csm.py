import json
import os
import sys
from pathlib import Path

# Add root to path
sys.path.append(os.getcwd())
from src.data.csm_provider import CSMProvider

def refresh_csm():
    try:
        cp = CSMProvider()
        csm_data = cp.fetch_live_from_source()

        CACHE_FILE = Path("data/prediction_cache.json")
        if CACHE_FILE.exists():
            with open(CACHE_FILE, "r") as f:
                data = json.load(f)
            
            if "market_context" not in data:
                data["market_context"] = {}
                
            data["market_context"]["csm"] = csm_data
            data["generated_at_csm"] = data.get("generated_at")
            
            with open(CACHE_FILE, "w") as f:
                json.dump(data, f, indent=4)
            
            print(json.dumps(csm_data))
        else:
            print(json.dumps({"error": "Cache not found"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    refresh_csm()
