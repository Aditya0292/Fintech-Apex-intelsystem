"""
APEX TRADE AI - Pre-Flight Health Check
========================================
Run this before every training run.
Catches data quality problems before they waste hours.
"""

import sys
import os
sys.path.append(os.getcwd())

import numpy as np
import pandas as pd
from collections import Counter


def pre_flight_check(suffix=""):
    """
    Comprehensive data quality validation before training.
    Returns True if all critical checks pass.
    """
    print(f"\n{'='*60}")
    print(f"PRE-FLIGHT CHECK (Suffix: {suffix})")
    print(f"{'='*60}")
    
    if suffix:
        suffix_clean = "_" + suffix.lstrip("_")
    else:
        suffix_clean = ""
    
    x_path = f"data/X{suffix_clean}.npy"
    y_path = f"data/y_class{suffix_clean}.npy"
    
    issues = []
    
    # ---- 1. File existence ----
    if not os.path.exists(x_path):
        issues.append(f"FAIL: {x_path} not found")
        print(f"  FAIL: {x_path} not found")
        return False
    if not os.path.exists(y_path):
        issues.append(f"FAIL: {y_path} not found")
        print(f"  FAIL: {y_path} not found")
        return False
        
    X = np.load(x_path)
    y = np.load(y_path)
    
    print(f"  Data: X={X.shape}, y={y.shape}")
    
    # ---- 2. Sample size check (Timeframe Specific) ----
    n_samples = len(X)
    
    # Determine timeframe from suffix to enforce minimums
    tf = "unknown"
    if "1h" in suffix_clean.lower(): tf = "1h"
    elif "4h" in suffix_clean.lower(): tf = "4h"
    elif "1d" in suffix_clean.lower() or "daily" in suffix_clean.lower(): tf = "1d"
    
    # Enforce minimums
    if tf == "1h" and n_samples < 8000:
        raise ValueError(f"CRITICAL: Only {n_samples} samples for 1H. 8000+ required. Do not train on insufficient data.")
    elif tf == "4h" and n_samples < 3000:
        raise ValueError(f"CRITICAL: Only {n_samples} samples for 4H. 3000+ required. Do not train on insufficient data.")
    elif tf == "1d" and n_samples < 2000:
        raise ValueError(f"CRITICAL: Only {n_samples} samples for 1D. 2000+ required. Do not train on insufficient data.")
    elif n_samples < 500:
        issues.append(f"FAIL: Only {n_samples} samples. Need 500+ for meaningful CV splits")
    else:
        print(f"  OK: {n_samples} samples (sufficient for {tf})")
    
    # ---- 3. Shape consistency ----
    if len(X) != len(y):
        issues.append(f"FAIL: X ({len(X)}) and y ({len(y)}) length mismatch")
    
    # ---- 4. NaN check ----
    nan_count = np.isnan(X).sum()
    if nan_count > 0:
        pct = nan_count / X.size * 100
        issues.append(f"FAIL: {nan_count} NaN values in X ({pct:.2f}%)")
    else:
        print(f"  OK: No NaN values")
    
    # ---- 5. Inf check ----
    inf_count = np.isinf(X).sum()
    if inf_count > 0:
        issues.append(f"FAIL: {inf_count} Inf values in X")
    else:
        print(f"  OK: No Inf values")
    
    # ---- 6. Class distribution check ----
    dist = Counter(y)
    total = len(y)
    print(f"  Class distribution:")
    for cls, count in sorted(dist.items()):
        pct = count / total
        status = "WARN" if pct < 0.10 else "OK"
        if pct < 0.10:
            issues.append(f"WARN: Class {cls} only {pct:.1%} of data ({count} samples)")
        print(f"    Class {cls}: {count} ({pct:.1%}) [{status}]")
    
    # ---- 7. Feature variance analysis ----
    n_features = X.shape[2]
    last_step = X[:, -1, :]  # Use last timestep for variance analysis
    feat_std = np.std(last_step, axis=0)
    
    near_zero = (feat_std < 0.001).sum()
    print(f"  Features: {n_features} total, {near_zero} near-zero variance")
    if near_zero > n_features * 0.5:
        issues.append(f"FAIL: {near_zero}/{n_features} features have near-zero variance (>50%)")
    elif near_zero > n_features * 0.3:
        issues.append(f"WARN: {near_zero}/{n_features} features have near-zero variance")
    
    # ---- 8. Feature range check (detect unscaled/leaking features) ----
    feat_max = np.abs(last_step).max(axis=0)
    extreme_features = (feat_max > 100).sum()
    if extreme_features > 0:
        issues.append(f"WARN: {extreme_features} features have values >100 (possible scaling issue)")
        # Find the specific features
        extreme_idx = np.where(feat_max > 100)[0]
        print(f"    Extreme feature indices: {extreme_idx[:10]}...")
    
    # ---- 9. Fold size estimation ----
    n_splits = 5
    min_fold_train = n_samples // (n_splits + 1)
    gap = 100
    min_fold_test = min_fold_train
    
    print(f"  Estimated fold sizes: train~{min_fold_train}, test~{min_fold_test}, gap={gap}")
    if min_fold_train < 200:
        issues.append(f"WARN: Fold 1 will only have ~{min_fold_train} training samples. Consider reducing n_splits or getting more data")
    
    # ---- 10. Temporal monotonicity (labels shouldn't be shuffled) ----
    # Check if there are suspiciously long runs of same label (would indicate bad labeling)
    max_run = 1
    current_run = 1
    for i in range(1, len(y)):
        if y[i] == y[i-1]:
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 1
    
    if max_run > 50:
        issues.append(f"WARN: Longest run of same label: {max_run} (possible labeling issue)")
    
    # ---- REPORT ----
    print(f"\n{'='*60}")
    fails = [i for i in issues if i.startswith("FAIL")]
    warns = [i for i in issues if i.startswith("WARN")]
    
    if fails:
        for issue in issues:
            marker = "[FAIL]" if issue.startswith("FAIL") else "[WARN]"
            print(f"  {marker} {issue}")
        print(f"\nPRE-FLIGHT FAILED — {len(fails)} critical issue(s). Fix before training.")
        return False
    elif warns:
        for issue in warns:
            print(f"  [WARN] {issue}")
        print(f"\nPRE-FLIGHT PASSED WITH {len(warns)} WARNING(S)")
        return True
    else:
        print(f"\n[OK] PRE-FLIGHT: ALL CHECKS PASSED")
        return True


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--suffix", type=str, default="")
    args = parser.parse_args()
    
    success = pre_flight_check(args.suffix)
    if not success:
        sys.exit(1)
