
import numpy as np
import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, Dense, LSTM, Bidirectional, Dropout, 
    LayerNormalization, MultiHeadAttention, 
    GlobalAveragePooling1D, Add, Layer
)
from tensorflow.keras.optimizers import Adam


# ============================================================================
# CUSTOM LAYERS
# ============================================================================

class PositionalEncoding(Layer):
    """
    Learnable positional encoding for Transformer.
    Critical for time-series: without this, self-attention treats all
    timesteps as unordered, losing the temporal structure entirely.
    """
    def __init__(self, max_len=512, d_model=64, **kwargs):
        super().__init__(**kwargs)
        self.max_len = max_len
        self.d_model = d_model

    def build(self, input_shape):
        self.pe = self.add_weight(
            name="positional_encoding",
            shape=(self.max_len, self.d_model),
            initializer="glorot_uniform",
            trainable=True
        )
        super().build(input_shape)

    def call(self, x):
        seq_len = tf.shape(x)[1]
        return x + self.pe[:seq_len, :]

    def get_config(self):
        config = super().get_config()
        config.update({"max_len": self.max_len, "d_model": self.d_model})
        return config


class ModelFactory:
    """
    Institutional-Grade Model Factory.
    
    Fixes applied vs original:
    1. XGBoost: Proper regularization, sample weight support
    2. LightGBM: min_gain_to_split, min_child_samples, verbose=-1
    3. BiLSTM: Correct attention key_dim, deeper architecture, lower LR
    4. Transformer: Positional encoding, 2 encoder blocks, warmup-friendly LR
    """
    
    @staticmethod
    def _get_gpu_device():
        """Detect if GPU is available for tree models"""
        try:
            # Check if any GPU is available via TF (since we use DirectML/CUDA)
            import tensorflow as tf
            gpus = tf.config.list_physical_devices('GPU')
            return 'cuda' if gpus else 'cpu'
        except:
            return 'cpu'

    @staticmethod
    def get_xgboost(input_dim, params: dict = None):
        """Returns properly regularized XGBoost Classifier"""
        device = ModelFactory._get_gpu_device()
        base_params = {
            "n_estimators": 300,
            "learning_rate": 0.03,
            "max_depth": 6,
            "subsample": 0.8,
            "colsample_bytree": 0.7,
            "min_child_weight": 5,
            "gamma": 0.1,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0,
            "objective": 'multi:softprob',
            "num_class": 3,
            "eval_metric": 'mlogloss',
            "n_jobs": -1,
            "random_state": 42,
            "tree_method": 'hist',
            "device": device,  # Use detected device
        }
        if params:
            base_params.update(params)
            
        return xgb.XGBClassifier(**base_params)
    
    @staticmethod
    def get_lightgbm(input_dim, params: dict = None):
        """
        Returns properly constrained LightGBM Classifier.
        """
        device = 'gpu' if ModelFactory._get_gpu_device() == 'cuda' else 'cpu'
        base_params = {
            "n_estimators": 300,
            "learning_rate": 0.05,
            "num_leaves": 31,
            "max_depth": 6,
            "min_child_samples": 50,
            "min_gain_to_split": 0.01,
            "subsample": 0.8,
            "colsample_bytree": 0.7,
            "reg_alpha": 0.1,
            "reg_lambda": 0.1,
            "objective": 'multiclass',
            "num_class": 3,
            "class_weight": 'balanced',
            "random_state": 42,
            "n_jobs": -1,
            "verbose": -1,
            "device_type": device,
        }
        if params:
            base_params.update(params)
            
        return lgb.LGBMClassifier(**base_params)
        
    @staticmethod
    def get_bilstm_attention(input_shape, learning_rate=0.0005):
        """
        Bidirectional LSTM with properly configured Self-Attention.
        
        Fixes:
        1. key_dim set to LSTM hidden dim (64), NOT input feature count
        2. Two LSTM layers for deeper temporal representation
        3. Lower learning rate (0.0005) for stable convergence
        4. Proper residual connection dimensions
        5. L2 kernel regularization to reduce overfitting
        """
        from tensorflow.keras.regularizers import l2
        
        inputs = Input(shape=input_shape, name="bilstm_input")
        
        # First BiLSTM Layer - extract temporal patterns
        lstm_1 = Bidirectional(
            LSTM(64, return_sequences=True, 
                 kernel_regularizer=l2(1e-4),
                 recurrent_regularizer=l2(1e-4)),
            name="bilstm_1"
        )(inputs)
        lstm_1 = LayerNormalization(name="ln_lstm1")(lstm_1)
        lstm_1 = Dropout(0.2, name="drop_lstm1")(lstm_1)
        
        # Second BiLSTM Layer - refine temporal features
        lstm_2 = Bidirectional(
            LSTM(64, return_sequences=True,
                 kernel_regularizer=l2(1e-4),
                 recurrent_regularizer=l2(1e-4)),
            name="bilstm_2"
        )(lstm_1)
        lstm_2 = LayerNormalization(name="ln_lstm2")(lstm_2)
        lstm_2 = Dropout(0.2, name="drop_lstm2")(lstm_2)
        
        # Self-Attention (key_dim = LSTM output dim per direction = 64, NOT input features)
        # BiLSTM output is 128 (64*2), attention uses key_dim=32 for efficiency
        attn_out = MultiHeadAttention(
            num_heads=4, key_dim=32, dropout=0.1, name="self_attention"
        )(lstm_2, lstm_2)
        attn_out = LayerNormalization(name="ln_attn")(Add(name="residual_attn")([lstm_2, attn_out]))
        
        # Pooling
        gap = GlobalAveragePooling1D(name="gap")(attn_out)
        
        # Classification Head with gradual dimensionality reduction
        x = Dense(64, activation='relu', kernel_regularizer=l2(1e-4), name="dense_1")(gap)
        x = Dropout(0.3, name="drop_head1")(x)
        x = Dense(32, activation='relu', kernel_regularizer=l2(1e-4), name="dense_2")(x)
        x = Dropout(0.2, name="drop_head2")(x)
        outputs = Dense(3, activation='softmax', name="output")(x)
        
        model = Model(inputs=inputs, outputs=outputs, name="BiLSTM_Attention_v2")
        model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        return model
        
    @staticmethod
    def get_transformer(input_shape, learning_rate=0.0005):
        """
        Transformer Encoder with Positional Encoding.
        
        Fixes:
        1. Added learnable positional encoding (CRITICAL for time series)
        2. Two encoder blocks for sufficient representational capacity
        3. Proper dropout in attention layers
        4. Lower learning rate for stable training
        5. L2 regularization
        """
        from tensorflow.keras.regularizers import l2
        
        d_model = 64
        inputs = Input(shape=input_shape, name="transformer_input")
        
        # Project features to d_model dimension
        x = Dense(d_model, name="input_projection")(inputs)
        
        # Positional Encoding — without this, attention is permutation-invariant
        # and completely ignores temporal order
        x = PositionalEncoding(max_len=input_shape[0], d_model=d_model, name="pos_enc")(x)
        x = Dropout(0.1, name="drop_pos")(x)
        
        # ---- Encoder Block 1 ----
        attn_1 = MultiHeadAttention(
            num_heads=4, key_dim=d_model // 4, dropout=0.1, name="mha_1"
        )(x, x)
        x = LayerNormalization(name="ln_attn1")(Add(name="res_attn1")([x, attn_1]))
        
        ffn_1 = Dense(d_model * 2, activation='gelu', kernel_regularizer=l2(1e-4), name="ffn1_up")(x)
        ffn_1 = Dropout(0.1, name="drop_ffn1")(ffn_1)
        ffn_1 = Dense(d_model, kernel_regularizer=l2(1e-4), name="ffn1_down")(ffn_1)
        x = LayerNormalization(name="ln_ffn1")(Add(name="res_ffn1")([x, ffn_1]))
        
        # ---- Encoder Block 2 ----
        attn_2 = MultiHeadAttention(
            num_heads=4, key_dim=d_model // 4, dropout=0.1, name="mha_2"
        )(x, x)
        x = LayerNormalization(name="ln_attn2")(Add(name="res_attn2")([x, attn_2]))
        
        ffn_2 = Dense(d_model * 2, activation='gelu', kernel_regularizer=l2(1e-4), name="ffn2_up")(x)
        ffn_2 = Dropout(0.1, name="drop_ffn2")(ffn_2)
        ffn_2 = Dense(d_model, kernel_regularizer=l2(1e-4), name="ffn2_down")(ffn_2)
        x = LayerNormalization(name="ln_ffn2")(Add(name="res_ffn2")([x, ffn_2]))
        
        # Global Pooling
        x = GlobalAveragePooling1D(name="gap")(x)
        x = Dropout(0.3, name="drop_gap")(x)
        
        # Classification Head
        x = Dense(32, activation='relu', kernel_regularizer=l2(1e-4), name="head_dense")(x)
        x = Dropout(0.2, name="drop_head")(x)
        outputs = Dense(3, activation='softmax', name="output")(x)
        
        model = Model(inputs=inputs, outputs=outputs, name="Transformer_Encoder_v2")
        model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        return model
