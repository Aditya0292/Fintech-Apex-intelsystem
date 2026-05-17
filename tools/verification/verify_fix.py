"""Quick verification of V8 SMC feature pipeline fix."""
import pandas as pd
import numpy as np
import json

schema = json.load(open('src/config/feature_schema_v2.json'))
required = schema['features']
print(f"Schema: v{schema['version']} with {len(required)} features")

for suffix in ['_1d', '_4h', '_1h']:
    path = f'data/features_enhanced{suffix}.csv'
    try:
        df = pd.read_csv(path)
        found = [c for c in required if c in df.columns]
        missing = [c for c in required if c not in df.columns]
        
        # Check key V8 SMC features
        smc_keys = ['ob_bullish_present', 'fvg_bullish_active', 'sweep_detected', 
                     'smc_confluence_net', 'smc_conflict', 'structure_state']
        smc_present = {k: k in df.columns for k in smc_keys}
        
        print(f"\n--- {path} ---")
        print(f"  Total cols: {len(df.columns)}, Schema match: {len(found)}/{len(required)}")
        print(f"  SMC features: {smc_present}")
        if missing:
            print(f"  Missing: {missing[:5]}...")
        
        # Signal health check
        if 'ob_bullish_present' in df.columns:
            ob_rate = df['ob_bullish_present'].mean()
            print(f"  OB signal rate: {ob_rate:.3f} (healthy: 0.05-0.30)")
    except Exception as e:
        print(f"\n--- {path} --- ERROR: {e}")

# Check npy shapes
print("\n--- NPY Dataset Shapes ---")
for suffix in ['_XAUUSD_1d', '_XAUUSD_4h', '_XAUUSD_1h']:
    try:
        X = np.load(f'data/X{suffix}.npy')
        y = np.load(f'data/y_class{suffix}.npy')
        print(f"  X{suffix}: {X.shape}, y: {y.shape}, features={X.shape[2]}")
    except Exception as e:
        print(f"  X{suffix}: ERROR - {e}")
