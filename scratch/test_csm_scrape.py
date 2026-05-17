import os
import sys
from pathlib import Path

# Add root
sys.path.append(os.getcwd())
from src.data.csm_provider import CSMProvider

cp = CSMProvider()
data = cp.fetch_live_from_source()
print(data)
