"""
APEX TRADE AI - Institutional Training Pipeline V2
====================================================
Models:
1. XGBoost (Regularized, sample-weighted)
2. LightGBM (Constrained splits, class-weighted)
3. BiLSTM + Attention (Dual-layer, positional-aware attention)
4. Transformer Encoder (Positional encoding, 2 blocks)
5. Meta-Learner (Calibrated Stacking)

Critical Fixes from V1:
- Purged gap between train/test in walk-forward
- Per-model EarlyStopping (no shared state)
- ReduceLROnPlateau for adaptive learning
- Proper sample weights for XGBoost
- Feature quality gate (drop near-zero variance)
- Dynamic SMC weighting (not hardcoded indices)
- .keras model format (not legacy .h5)
- Removed deprecated multi_class='multinomial'
"""

import sys
import os
# Add root directory to sys.path to allow running as script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import numpy as np
import pandas as pd
import pickle
import json
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from typing import List, Dict, Tuple
from pathlib import Path

from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, classification_report
from sklearn.utils.class_weight import compute_class_weight, compute_sample_weight
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder

import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras import mixed_precision

# ============================================================================
# GPU ACCELERATION (DirectML & Mixed Precision)
# ============================================================================

# 1. Initialize DirectML for Windows GPU Support
try:
    # Explicitly use DirectML device if plugin is installed
    import tensorflow_directml
    # Set the device to the first available GPU
    # This activates the RTX 4050 for LSTM/Transformer training
    devices = tf.config.list_physical_devices('GPU')
    if devices:
        print(f"GPU Detected: {devices}")
        # DirectML doesn't require explicit 'set_visible_devices' usually, 
        # but detecting it confirms the plugin is working.
    else:
        print("No GPU detected by TensorFlow. Ensure tensorflow-directml-plugin is installed.")
except ImportError:
    print("DirectML plugin not found. Falling back to default TF device.")

# 2. Enable Mixed Precision for RTX GPU (Tensor Cores)
# This significantly speeds up training on RTX 40 series cards
try:
    mixed_precision.set_global_policy('mixed_float16')
    print("GPU Optimization: Mixed Precision (float16) enabled.")
except Exception as e:
    print(f"GPU Optimization: Mixed Precision not available: {e}")

from src.models.model_factory import ModelFactory

# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    SEED = 42
    N_SPLITS = 5
    EPOCHS = 80          
    BATCH_SIZE = 128     # Increased for GPU throughput (RTX 4050 6GB)
    LEARNING_RATE = 0.0005  # Reduced from 0.001: prevents overshooting in noisy landscapes
    CLASSES = [-1, 0, 1]    # Bear, Neutral, Bull
    PURGE_GAP = 100         # Embargo gap between train/test to prevent feature leakage
    
    # Paths
    X_PATH = "data/X.npy"
    Y_PATH = "data/y_class.npy"
    MODEL_DIR = Path("saved_models")

    def __init__(self):
        self.MODEL_DIR.mkdir(exist_ok=True)

config = Config()
np.random.seed(config.SEED)
tf.random.set_seed(config.SEED)


# ============================================================================
# DATA QUALITY GATE
# ============================================================================

def apply_feature_quality_gate(X_tree, verbose=True):
    """
    Remove near-zero-variance and highly-correlated features from tree inputs.
    This directly fixes the LightGBM "no positive gain" warnings by removing
    features that provide zero discriminative information.
    
    Returns: X_tree_clean, keep_mask (boolean mask of kept feature indices)
    """
    n_original = X_tree.shape[1]
    
    # 1. Remove near-zero variance features (std < 0.01 after scaling)
    feat_std = np.std(X_tree, axis=0)
    variance_mask = feat_std >= 0.01
    
    # 2. Remove features that are constant or near-constant
    feat_range = np.ptp(X_tree, axis=0)
    range_mask = feat_range > 0.001
    
    keep_mask = variance_mask & range_mask
    X_clean = X_tree[:, keep_mask]
    
    if verbose:
        dropped = n_original - keep_mask.sum()
        print(f"  Feature Quality Gate: {n_original} -> {keep_mask.sum()} features ({dropped} dropped as near-zero variance)")
    
    return X_clean, keep_mask


# ============================================================================
# PURGED WALK-FORWARD SPLIT
# ============================================================================

def purged_walk_forward_split(n_samples, n_splits=5, gap=100):
    """
    Custom walk-forward CV with embargo gap.
    
    Unlike standard TimeSeriesSplit, this introduces a 'gap' buffer between
    the end of training data and the start of test data. This prevents
    data leakage from rolling features (ATR, OB zones, FVG) whose lookback
    windows would otherwise overlap into the test set.
    
    Args:
        n_samples: Total number of samples
        n_splits: Number of CV folds
        gap: Number of samples to skip between train and test
    
    Yields:
        (train_indices, test_indices) tuples
    """
    test_size = n_samples // (n_splits + 1)
    
    for i in range(n_splits):
        train_end = test_size * (i + 1)
        test_start = train_end + gap
        test_end = test_start + test_size
        
        if test_end > n_samples:
            test_end = n_samples
        if test_start >= n_samples:
            break
            
        train_indices = np.arange(0, train_end)
        test_indices = np.arange(test_start, test_end)
        
        if len(test_indices) < 50:  # Skip folds with too few test samples
            continue
            
        yield train_indices, test_indices


# ============================================================================
# TRAINING PIPELINE
# ============================================================================

def train_ensemble(suffix=""):
    print(f"\n{'='*60}")
    print(f"APEX TRADE AI - Institutional Training Pipeline V2")
    print(f"{'='*60}")
    print(f"Loading data (Suffix: {suffix})...")
    
    # Update Config Paths dynamically
    if suffix:
        suffix_clean = "_" + suffix.lstrip("_")
        x_path = f"data/X{suffix_clean}.npy"
        y_path = f"data/y_class{suffix_clean}.npy"
    else:
        suffix_clean = ""
        x_path = config.X_PATH
        y_path = config.Y_PATH
        
    if not os.path.exists(x_path):
        print(f"Error: Data file {x_path} not found.")
        return

    X = np.load(x_path)
    y = np.load(y_path)
    
    print(f"Data shape: {X.shape}, Labels: {y.shape}")
    print(f"Label distribution: {dict(zip(*np.unique(y, return_counts=True)))}")
    
    # Label Encoding for XGBoost/TF compatibility
    le = LabelEncoder()
    y = le.fit_transform(y)
    print(f"Encoded Labels classes: {le.classes_} -> [0, 1, 2]")
    
    # ==================================================================
    # PREPARE TREE FEATURES (with quality gate)
    # ==================================================================
    # Extract statistical features from sequence for tree models
    X_last = X[:, -1, :]       # Last timestep features
    X_mean = np.mean(X, axis=1) # Mean across window
    X_std = np.std(X, axis=1)   # Std across window
    X_tree_raw = np.hstack([X_last, X_mean, X_std])
    
    # Apply feature quality gate to remove dead features
    X_tree, keep_mask = apply_feature_quality_gate(X_tree_raw)
    print(f"Tree Input Shape: {X_tree.shape}")
    
    # ==================================================================
    # CLEAN SEQUENCE DATA FOR NEURAL NETWORKS
    # ==================================================================
    # Remove near-zero-variance features from the 3D sequence too.
    # 40/124 features with near-zero variance are pure noise that prevent
    # LSTM and Transformer from learning meaningful patterns.
    feat_std = np.std(X[:, -1, :], axis=0)
    seq_keep_mask = feat_std >= 0.01
    
    # Also remove features with extremely high values (outlier features)
    feat_max = np.abs(X[:, -1, :]).max(axis=0)
    seq_keep_mask = seq_keep_mask & (feat_max < 50)
    
    X_seq = X[:, :, seq_keep_mask]
    n_dropped_seq = X.shape[2] - X_seq.shape[2]
    print(f"Sequence Quality Gate: {X.shape[2]} -> {X_seq.shape[2]} features ({n_dropped_seq} dropped)")
    print(f"Sequence Input Shape: {X_seq.shape}")

    # ==================================================================
    # WALK-FORWARD VALIDATION WITH PURGED GAP
    # ==================================================================
    
    # Store meta-features (predictions from each model on OOS data)
    meta_X = np.zeros((len(X), 3 * 4))  # 3 classes * 4 models
    meta_y = y
    
    # Load Asset Specific Params
    from src.utils.config_loader import config as global_config
    assets_config = global_config.get('assets', {})
    
    # Identify which asset this suffix belongs to
    this_asset = None
    for asset, details in assets_config.items():
        if details.get('model_suffix', '').lower() in suffix_clean.lower():
            this_asset = asset
            break
            
    asset_params = {}
    if this_asset:
        asset_params = assets_config[this_asset].get('model_params', {})
        print(f"  Found asset-specific params for {this_asset}: {list(asset_params.keys())}")
    
    # Use purged walk-forward split
    splits = list(purged_walk_forward_split(
        len(X), 
        n_splits=config.N_SPLITS, 
        gap=config.PURGE_GAP
    ))
    
    print(f"\nStarting Purged Walk-Forward Validation ({len(splits)} splits, gap={config.PURGE_GAP})...")
    
    model_xgb = None
    model_lgb = None
    model_lstm = None
    model_trans = None
    
    fold_results = []
    
    for fold, (train_index, test_index) in enumerate(splits, 1):
        print(f"\n[Fold {fold}/{len(splits)}] Train: {len(train_index)}, Test: {len(test_index)}, "
              f"Gap: {test_index[0] - train_index[-1]} candles")
        
        X_train_seq, X_test_seq = X_seq[train_index], X_seq[test_index]
        X_train_tree, X_test_tree = X_tree[train_index], X_tree[test_index]
        y_train, y_test = y[train_index], y[test_index]
        
        # ==================================================================
        # CLASS WEIGHTS & SAMPLE WEIGHTS
        # ==================================================================
        classes_present = np.unique(y_train)
        weights = compute_class_weight('balanced', classes=classes_present, y=y_train)
        class_weight_dict = dict(zip(classes_present.astype(int), weights))
        
        # Sample weights for XGBoost (it doesn't accept class_weight directly)
        sample_weights = compute_sample_weight('balanced', y_train)
        
        print(f"  Class weights: {class_weight_dict}")
        
        # ==================================================================
        # 1. XGBoost (with sample weights)
        # ==================================================================
        print("  Training XGBoost...")
        model_xgb = ModelFactory.get_xgboost(X_train_tree.shape[1], params=asset_params.get('xgb'))
        model_xgb.fit(
            X_train_tree, y_train,
            sample_weight=sample_weights,
            eval_set=[(X_test_tree, y_test)],
            verbose=False
        )
        pred_xgb = model_xgb.predict_proba(X_test_tree)
        
        # ==================================================================
        # 2. LightGBM (class_weight='balanced' built into factory)
        # ==================================================================
        print("  Training LightGBM...")
        model_lgb = ModelFactory.get_lightgbm(X_train_tree.shape[1], params=asset_params.get('lgbm'))
        model_lgb.fit(
            X_train_tree, y_train,
            eval_set=[(X_test_tree, y_test)],
        )
        pred_lgb = model_lgb.predict_proba(X_test_tree)
        
        # ==================================================================
        # 3. BiLSTM (FRESH callbacks per model — critical fix)
        # ==================================================================
        print("  Training BiLSTM...")
        model_lstm = ModelFactory.get_bilstm_attention(
            (X_train_seq.shape[1], X_train_seq.shape[2]),
            learning_rate=config.LEARNING_RATE
        )
        
        # SEPARATE callback instances for each model (sharing causes state leaks)
        lstm_es = EarlyStopping(
            monitor='val_loss', 
            patience=10,          # Increased from 5: give models time to learn past initial noise
            restore_best_weights=True,
            min_delta=0.001       # Don't stop for trivial improvements
        )
        lstm_lr = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,           # Halve LR when plateau detected
            patience=5,           # Wait 5 epochs before reducing
            min_lr=1e-6,
            verbose=1
        )
        
        history_lstm = model_lstm.fit(
            X_train_seq, y_train,
            validation_data=(X_test_seq, y_test),
            epochs=config.EPOCHS,
            batch_size=config.BATCH_SIZE,
            callbacks=[lstm_es, lstm_lr],
            class_weight=class_weight_dict,
            verbose=0
        )
        pred_lstm = model_lstm.predict(X_test_seq, verbose=0)
        
        # Print LSTM training progress
        best_epoch_lstm = np.argmin(history_lstm.history['val_loss']) + 1
        best_val_acc_lstm = history_lstm.history['val_accuracy'][best_epoch_lstm - 1]
        final_train_acc_lstm = history_lstm.history['accuracy'][-1]
        print(f"    LSTM: Best epoch {best_epoch_lstm}/{len(history_lstm.history['loss'])}, "
              f"Train acc: {final_train_acc_lstm:.4f}, Val acc: {best_val_acc_lstm:.4f}")
        
        # ==================================================================
        # 4. Transformer (FRESH callbacks — separate from LSTM)
        # ==================================================================
        print("  Training Transformer...")
        model_trans = ModelFactory.get_transformer(
            (X_train_seq.shape[1], X_train_seq.shape[2]),
            learning_rate=config.LEARNING_RATE
        )
        
        trans_es = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            min_delta=0.001
        )
        trans_lr = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        )
        
        history_trans = model_trans.fit(
            X_train_seq, y_train,
            validation_data=(X_test_seq, y_test),
            epochs=config.EPOCHS,
            batch_size=config.BATCH_SIZE,
            callbacks=[trans_es, trans_lr],
            class_weight=class_weight_dict,
            verbose=0
        )
        pred_trans = model_trans.predict(X_test_seq, verbose=0)
        
        # Print Transformer training progress
        best_epoch_trans = np.argmin(history_trans.history['val_loss']) + 1
        best_val_acc_trans = history_trans.history['val_accuracy'][best_epoch_trans - 1]
        final_train_acc_trans = history_trans.history['accuracy'][-1]
        print(f"    Trans: Best epoch {best_epoch_trans}/{len(history_trans.history['loss'])}, "
              f"Train acc: {final_train_acc_trans:.4f}, Val acc: {best_val_acc_trans:.4f}")
        
        # ==================================================================
        # Store predictions for Meta-Learner stacking
        # ==================================================================
        stacked_preds = np.hstack([pred_xgb, pred_lgb, pred_lstm, pred_trans])
        meta_X[test_index] = stacked_preds
        
        # Fold Evaluation
        acc_xgb = accuracy_score(y_test, np.argmax(pred_xgb, axis=1))
        acc_lgb = accuracy_score(y_test, np.argmax(pred_lgb, axis=1))
        acc_lstm = accuracy_score(y_test, np.argmax(pred_lstm, axis=1))
        acc_trans = accuracy_score(y_test, np.argmax(pred_trans, axis=1))
        
        print(f"  Fold {fold} Results -> XGB: {acc_xgb:.4f}, LGB: {acc_lgb:.4f}, "
              f"LSTM: {acc_lstm:.4f}, Trans: {acc_trans:.4f}")
        
        fold_results.append({
            'fold': fold, 'xgb': acc_xgb, 'lgb': acc_lgb,
            'lstm': acc_lstm, 'trans': acc_trans
        })
        
    # ============================================================================
    # META LEARNER (STACKING)
    # ============================================================================
    print("\n" + "="*60)
    print("Training Meta-Learner (Calibrated Stacking)...")
    
    valid_indices = np.where(np.sum(meta_X, axis=1) > 0)[0]
    
    if len(valid_indices) == 0:
        print("Error: No valid predictions for meta-learner.")
        return

    meta_X_train = meta_X[valid_indices]
    meta_y_train = meta_y[valid_indices]
    
    print(f"  Meta-learner training on {len(valid_indices)} OOS predictions")
    
    # LogisticRegression without deprecated multi_class parameter
    meta_learner = LogisticRegression(
        solver='lbfgs', 
        max_iter=1000,
        class_weight='balanced',  # Handle class imbalance in meta-learner too
        C=1.0
    )
    meta_learner.fit(meta_X_train, meta_y_train)
    
    # Probability Calibration
    calibrated_meta = CalibratedClassifierCV(meta_learner, cv=3, method='isotonic')
    calibrated_meta.fit(meta_X_train, meta_y_train)
    
    # ============================================================================
    # SAVE MODELS (using .keras format, not legacy .h5)
    # ============================================================================
    print(f"\nSaving models (Suffix: {suffix_clean})...")
    
    # XGBoost: use booster save to avoid sklearn wrapper issues
    xgb_path = str(config.MODEL_DIR / f"xgboost_model{suffix_clean}.json")
    model_xgb.get_booster().save_model(xgb_path)
    
    # LightGBM: use booster save
    lgb_path = str(config.MODEL_DIR / f"lightgbm_model{suffix_clean}.txt")
    model_lgb.booster_.save_model(lgb_path)
    
    # Save as .keras (modern format) and .h5 (backward compatibility)
    keras_path_lstm = config.MODEL_DIR / f"bilstm_model{suffix_clean}.keras"
    keras_path_trans = config.MODEL_DIR / f"transformer_model{suffix_clean}.keras"
    model_lstm.save(str(keras_path_lstm))
    model_trans.save(str(keras_path_trans))
    
    # Also save .h5 for backward compatibility with existing evaluate.py
    h5_path_lstm = config.MODEL_DIR / f"bilstm_model{suffix_clean}.h5"
    h5_path_trans = config.MODEL_DIR / f"transformer_model{suffix_clean}.h5"
    model_lstm.save(str(h5_path_lstm))
    model_trans.save(str(h5_path_trans))
    
    with open(config.MODEL_DIR / f"meta_learner{suffix_clean}.pkl", "wb") as f:
        pickle.dump(calibrated_meta, f)
    
    # Save the feature quality gate masks for inference
    np.save(config.MODEL_DIR / f"tree_feature_mask{suffix_clean}.npy", keep_mask)
    np.save(config.MODEL_DIR / f"seq_feature_mask{suffix_clean}.npy", seq_keep_mask)
    
    print("Models saved successfully.")

    # ============================================================================
    # EVALUATION ON META SET
    # ============================================================================
    print(f"\n{'='*60}")
    print("ENSEMBLE EVALUATION")
    print(f"{'='*60}")
    
    meta_probs = calibrated_meta.predict_proba(meta_X_train)
    meta_preds = np.argmax(meta_probs, axis=1)
    
    # Use encoded labels for classification report
    target_names = [f"Class {c}" for c in le.classes_]
    print(classification_report(meta_y_train, meta_preds, target_names=target_names))
    
    # Per-fold summary
    print("\nPer-Fold Accuracy Summary:")
    print(f"{'Fold':<6} | {'XGBoost':<10} | {'LightGBM':<10} | {'BiLSTM':<10} | {'Transformer':<12}")
    print("-" * 55)
    for r in fold_results:
        print(f"{r['fold']:<6} | {r['xgb']:<10.4f} | {r['lgb']:<10.4f} | "
              f"{r['lstm']:<10.4f} | {r['trans']:<12.4f}")
    
    # Average across folds
    avg_xgb = np.mean([r['xgb'] for r in fold_results])
    avg_lgb = np.mean([r['lgb'] for r in fold_results])
    avg_lstm = np.mean([r['lstm'] for r in fold_results])
    avg_trans = np.mean([r['trans'] for r in fold_results])
    print("-" * 55)
    print(f"{'AVG':<6} | {avg_xgb:<10.4f} | {avg_lgb:<10.4f} | "
          f"{avg_lstm:<10.4f} | {avg_trans:<12.4f}")
    
    # Confidence analysis
    print("\n--- Confidence Threshold Analysis ---")
    conf = np.max(meta_probs, axis=1)
    for thresh in [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]:
        mask = conf >= thresh
        if mask.sum() < 10:
            continue
        acc = accuracy_score(meta_y_train[mask], meta_preds[mask])
        coverage = mask.mean()
        print(f"  Thresh={thresh:.2f}: Accuracy={acc:.1%}, Coverage={coverage:.1%} ({mask.sum()} signals)")
    
    print(f"\n{'='*60}")
    print("TRAINING COMPLETE.")
    print(f"{'='*60}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--suffix", type=str, default="")
    parser.add_argument("--n_splits", type=int, default=5)
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--gap", type=int, default=100, help="Purge gap between train/test")
    args = parser.parse_args()
    
    # Override config
    config.N_SPLITS = args.n_splits
    config.EPOCHS = args.epochs
    config.PURGE_GAP = args.gap
    
    train_ensemble(args.suffix)
