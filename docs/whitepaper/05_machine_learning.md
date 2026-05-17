# 🧠 05: Machine Learning Ensemble
*The Neural Confluence Stack: Predictive Alpha*

---

## 🧠 The Neural Confluence Stack
While SMC heuristics identify "where" liquidity resides, the **Machine Learning Ensemble** determines "if" a move is statistically probable. APEX utilizes a dual-model synthesis to achieve **Predictive Alpha**.

### 1. XGBoost: The Structural Classifier
We use the **eXtreme Gradient Boosting (XGBoost)** algorithm as our primary structural classifier.
- **Feature Set**: Ingests 147+ features including RSI-divergence, ATR-volatility, and encoded SMC states (OB mitigation status, FVG distance).
- **Objective**: Minimizes Log-Loss to classify the forward 5-candle window as Bullish, Bearish, or Neutral.
- **Selectivity**: The model is tuned for **High Precision**. A "Strong Buy" is only issued if the probability score exceeds **0.82**.

### 2. LSTM: The Sequential Context
To capture the time-series dependencies often missed by gradient boosting, APEX integrates a **Long Short-Term Memory (LSTM)** neural network.
- **Sequence Modeling**: Analyzes the last 50 candles (OHLCV) to identify "Fractional Trends" and mean-reversion exhaustion.
- **Regime Filtering**: Acts as a secondary gate. If the LSTM detects a "Ranging Regime," it can veto an XGBoost trend-following signal.

---

## 🧬 Confluence Synthesis (The Blended Score)
The final signal probability ($P_{final}$) is a weighted ensemble of both models, fused with the SMC Confluence Score ($C_s$):

$$P_{final} = (\alpha \cdot P_{xgboost} + \beta \cdot P_{lstm} + \gamma \cdot C_s)$$

*Where:*
- **$\alpha, \beta, \gamma$**: Dynamically adjusted weights (Optimized via Cross-Validation).
- **Mandate**: $P_{final}$ must be $\ge 0.80$ to appear on the Institutional Dashboard.

---

## 🔬 Model Training & Validation
- **Rolling Window Cross-Validation**: Models are re-trained on a rolling 500-candle window to prevent "Concept Drift" in non-stationary markets.
- **Regularization**: Strict $L_1$ and $L_2$ penalties are applied to the XGBoost trees to prevent overfitting on market noise.
- **Out-of-Sample Testing**: Every model generation is validated against a 20% hold-out set, requiring a minimum **85% precision** before deployment.

---
*Created by Aditya | APEX Intelligence Engine v2.5.0 Elite*
