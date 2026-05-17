# 📡 03: Data Ingestion & Integrity
*High-Fidelity Market Aggregation & Resilience*

---

## 📡 The Data Inflow
**APEX Trade AI** relies on three distinct data streams to generate its high-confluence tactical signals. The integrity and latency of these streams are critical to the system's alpha.

### 1. MetaTrader 5 (MT5) Tick Feed
The primary source of price action is the native **MetaTrader 5 Python API**.
- **Multi-Asset Monitoring**: The system defaults to **XAUUSD (Gold)** but is architected to scale across any instrument in the MT5 Market Watch.
- **Multi-Timeframe (MTF) Alignment**: Data is fetched across six timeframes simultaneously: **1d, 4h, 1h, 30m, 15m, and 5m**.
- **Efficiency**: Prices are stored in **Apache Parquet** format for sub-millisecond read access, ensuring the feature pipeline is never bottle-necked by I/O.

### 2. Tactical News Oracle
Beyond raw price action, the system integrates a real-time Macro-Intelligence layer.
- **Sentiment Extraction**: Scrapes financial news sources (ForexFactory RSS, etc.) to identify "High Impact" events (CPI, FOMC, NFP).
- **Sentiment Decay**: Implements a mathematical decay function ($e^{-\lambda t}$) where breaking news has 10x the weight of 24-hour-old data.

---

## 🛡️ Data Integrity & "Safe Mode"
Traditional trading bots often crash when a terminal disconnects. APEX implements an institutional-grade **Resilience Layer**:

### 1. Initialization Retries
If the MT5 terminal is closed, the `MTFCandleFetcher` enters a **10-attempt retry loop** with exponential backoff. This ensures the pipeline survives temporary terminal restarts or system reboots.

### 2. The "Safe Mode" Degradation
If critical data (Price Action) remains unavailable after retries:
- The system enters **`DEGRADED`** mode.
- It **locks the last valid signal** in the UI to prevent "Ghost Signals" based on zeroed data.
- It continues to run non-critical stages (News, Calendar) to maintain a partial situational report.

### 3. Freshness Guard
To prevent trading on stale information, every prediction cycle includes a **Freshness Check**. If the newest candle is >5 minutes old (configurable), the system aborts the prediction and alerts the user via the **"⚠️ Stale Data"** indicator in the dashboard.

---

## ⚡ Performance Metrics
| Metric | Target | Realized (v2.5) |
| :--- | :--- | :--- |
| **Ingestion Latency** | < 1s | ~450ms |
| **Recovery Window** | < 60s | ~15s (Auto-Restart) |
| **Data Throughput** | 10k Ticks/min | Supported |

---
*Created by Aditya | APEX Intelligence Engine v2.5.0 Elite*
