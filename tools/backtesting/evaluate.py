"""
APEX TRADE AI - Evaluation & Confidence Analysis
================================================
Goal: Verify if Precision >= 80% at Confidence >= 65%
"""

import numpy as np
import pandas as pd
import pickle
import json
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import precision_score, accuracy_score, confusion_matrix, brier_score_loss
from sklearn.calibration import calibration_curve

import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow.keras.models import load_model
from src.models.model_factory import PositionalEncoding

# ============================================================================
# CONFIGURATION
# ============================================================================

import os
import sys
sys.path.append(os.getcwd())

class Config:
    X_PATH = "data/X.npy"
    Y_PATH = "data/y_class.npy"
    MODEL_DIR = Path("saved_models")
    OUTPUT_DIR = Path("images")
    THRESHOLDS = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90]

config = Config()
from src.utils.logger import get_logger
logger = get_logger()

# ============================================================================
# UTILS
# ============================================================================

def load_data(suffix="", asset=None, tf=None):
    if suffix:
        suffix_clean = "_" + suffix.lstrip("_")
    else:
        suffix_clean = ""
        
    x_path = f"data/X{suffix_clean}.npy"
    y_path = f"data/y_class{suffix_clean}.npy"
    
    if not os.path.exists(x_path):
        if not suffix:
             x_path = config.X_PATH
             y_path = config.Y_PATH
        else:
             raise FileNotFoundError(f"{x_path} not found")

    X = np.load(x_path)
    y = np.load(y_path)
    
    # Try to find specific masks for this asset/tf
    mask_suffix = ""
    if asset and tf:
        mask_suffix = f"_{asset}_{tf}"
    elif suffix:
        mask_suffix = suffix_clean
        
    seq_mask_path = config.MODEL_DIR / f"seq_feature_mask{mask_suffix}.npy"
    tree_mask_path = config.MODEL_DIR / f"tree_feature_mask{mask_suffix}.npy"
    
    # 1. Prepare TREE features from RAW data
    X_last_raw = X[:, -1, :]
    X_mean_raw = np.mean(X, axis=1)
    X_std_raw = np.std(X, axis=1)
    X_tree = np.hstack([X_last_raw, X_mean_raw, X_std_raw])
    
    # Apply Tree Mask if exists
    if tree_mask_path.exists():
        t_mask = np.load(tree_mask_path)
        if len(t_mask) <= X_tree.shape[1]:
            X_tree = X_tree[:, t_mask.astype(bool)]
        else:
            logger.warning(f"Tree mask mismatch ({len(t_mask)} vs {X_tree.shape[1]}). Slicing to 261 fallback.")
            X_tree = X_tree[:, :261]
    else:
        # Fallback to a common size if no mask
        if X_tree.shape[1] > 252:
            X_tree = X_tree[:, :252]
            
    # 2. Prepare SEQUENCE features for Neural Models
    if seq_mask_path.exists():
        mask = np.load(seq_mask_path)
        if len(mask) <= X.shape[2]:
            X = X[:, :, mask.astype(bool)]
        else:
            X = X[:, :, :84]
    else:
        if X.shape[2] > 84:
            X = X[:, :, :84]
    
    return X, y, X_tree

import tensorflow.keras.backend as K

def load_all_models(input_shape, suffix=""):
    """
    Load all models matching either 'ensemble_' or 'xgboost_model_' prefix.
    """
    try:
        K.clear_session()
    except:
        pass

    logger.info(f"Loading models (Suffix: {suffix})...")
    
    if suffix:
        suffix_clean = "_" + suffix.lstrip("_")
    else:
        suffix_clean = ""
        
    def get_path(pref, ext):
        # Try apex-style first
        p1 = config.MODEL_DIR / f"{pref}{suffix_clean}{ext}"
        if p1.exists(): return p1
        # Try generic ensemble-style
        p2 = config.MODEL_DIR / f"ensemble_{pref[:3]}{suffix_clean}{ext}"
        if p2.exists(): return p2
        # Try daily fallback
        p3 = config.MODEL_DIR / f"{pref}{ext}"
        return p3

    try:
        # 1. XGBoost
        xgb_path = get_path("xgboost_model", ".json")
        xgb_m = xgb.XGBClassifier()
        xgb_m.load_model(str(xgb_path))
        # Fix for legacy models missing n_classes_ in newer XGB versions
        if not hasattr(xgb_m, 'n_classes_'):
            xgb_m.n_classes_ = 3
        
        # 2. LightGBM
        lgb_path = get_path("lightgbm_model", ".txt")
        lgb_m = lgb.Booster(model_file=str(lgb_path))
        
        # 3. Keras Models
        with tf.keras.utils.custom_object_scope({'PositionalEncoding': PositionalEncoding}):
            lstm_path = get_path("bilstm_model", ".h5")
            lstm_m = load_model(str(lstm_path))
            
            trans_path = get_path("transformer_model", ".h5")
            trans_m = load_model(str(trans_path))
        
        # 4. Meta Learner
        meta_path = get_path("meta_learner", ".pkl")
        with open(str(meta_path), "rb") as f:
            meta_m = pickle.load(f)
            
        return xgb_m, lgb_m, lstm_m, trans_m, meta_m
    except Exception as e:
        logger.error(f"Error loading models for suffix '{suffix}': {e}")
        return None, None, None, None, None

def run_evaluation(X, y, X_tree, models):
    xgb_m, lgb_m, lstm_m, trans_m, meta_m = models
    p_xgb = xgb_m.predict_proba(X_tree)
    p_lgb = lgb_m.predict(X_tree)
    if len(p_lgb.shape) == 1:
        p_lgb = p_lgb.reshape(-1, 3)
    p_lstm = lstm_m.predict(X, verbose=0)
    p_trans = trans_m.predict(X, verbose=0)
    stacked = np.hstack([p_xgb, p_lgb, p_lstm, p_trans])
    final_probs = meta_m.predict_proba(stacked)
    return final_probs

def analyze_performance(probs, y_true):
    results = []
    for thresh in config.THRESHOLDS:
        conf = np.max(probs, axis=1)
        preds = np.argmax(probs, axis=1)
        mask = (conf >= thresh)
        if np.sum(mask) == 0:
            results.append({"Threshold": thresh, "Precision": 0, "Coverage": 0})
            continue
        y_filt = y_true[mask]
        p_filt = preds[mask]
        precision = precision_score(y_filt, p_filt, average='macro', zero_division=0)
        coverage = np.sum(mask) / len(y_true)
        results.append({
            "Threshold": thresh,
            "Precision": precision * 100,
            "Coverage": coverage * 100
        })
    return pd.DataFrame(results)

def plot_results(df, suffix=""):
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=df, x="Threshold", y="Precision", marker="o", label="Precision (%)")
    sns.lineplot(data=df, x="Threshold", y="Coverage", marker="s", label="Coverage (%)")
    plt.axhline(y=80, color='r', linestyle='--', label="Institutional Target (80%)")
    plt.title(f"Apex Trade AI Performance Baseline {suffix}")
    plt.ylabel("Percentage (%)")
    plt.grid(True, alpha=0.3)
    plt.legend()
    out_name = f"performance_baseline{suffix}.png"
    plt.savefig(config.OUTPUT_DIR / out_name)
    plt.close()

if __name__ == "__main__":
    import argparse
    from tabulate import tabulate
    parser = argparse.ArgumentParser()
    parser.add_argument("--suffix", type=str, default="", help="Suffix for data/models (e.g. _1h)")
    args = parser.parse_args()
    
    try:
        X, y, X_tree = load_data(args.suffix)
        input_shape = (X.shape[1], X.shape[2])
        models = load_all_models(input_shape, args.suffix)
        
        if all(m is not None for m in models):
            probs = run_evaluation(X, y, X_tree, models)
            df = analyze_performance(probs, y)
            print("\nPerformance Summary:")
            print(tabulate(df, headers='keys', tablefmt='psql', showindex=False))
            plot_results(df, args.suffix)
        else:
            print("Failed to load all models.")
    except Exception as e:
        print(f"Evaluation failed: {e}")
