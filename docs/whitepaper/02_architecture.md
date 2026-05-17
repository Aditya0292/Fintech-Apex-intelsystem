# 🏗️ 02: System Architecture
*Full-Stack Blueprint: Institutional Intelligence OS*

---

## 🏗️ The Full-Stack Blueprint
**APEX Trade AI** is engineered as a decoupled, multi-tier system that provides **high-availability signals** and a **low-latency dashboard**. The architecture is divided into three primary layers:

### 1. The Python Intelligence Engine (The Backend)
The core analytical engine is built with a modular Python 3.12+ stack, encompassing:
- **`src.data`**: The high-fidelity ingestion layer (MT5, News Sentiments).
- **`src.features`**: Algorithmic SMC heuristics and Market Structure state.
- **`src.models`**: The Neural Confluence ensemble (XGBoost, LSTM).
- **`src.risk`**: The Kelly Criterion and position sizing engine.

### 2. The Next.js Institutional Command Terminal (The Frontend)
The user interface is a high-performance **Next.js 15+ App Router** dashboard, featuring:
- **WebGL Visualization**: Hardware-accelerated charting for tick-level prices.
- **Institutional Styling**: A custom "Liquid Glass" theme with neon accents and vibrant data overlays.
- **Health API**: A dedicated endpoint (`/api/pipeline_health`) that polls the backend's status JSON in real-time.

### 3. The NSSM Service Layer (The Persistence)
To ensure **24/7 autonomous operation**, the Python pipeline runs as a Windows Service managed by **NSSM (Non-Sucking Service Manager)**.
- **Auto-Restart**: Recovers the pipeline from crashes within 10 seconds.
- **Delayed-Auto Start**: Ensures the system only boots after Windows and the MT5 terminal are stabilized.
- **Logging Persistence**: Redirects all `stdout`/`stderr` to `logs/service_out.log` for auditing.

---

## 🔄 Data Orchestration & Shared State
The frontend and backend communicate primarily through **Synchronized JSON Artifacts** located in the `data/` and `outputs/` directories. This ensures:
1.  **Low Latency**: The dashboard reads static files from the filesystem while the backend updates them asynchronously.
2.  **Robustness**: If the backend process crashes, the dashboard continues to display the "Last Valid Signal" rather than an error screen—a key institutional requirement.

---

## 🛠️ The Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Language** | Python 3.12, TypeScript 5.0 |
| **Data** | MetaTrader 5 API, Pandas, PyArrow (Parquet) |
| **ML Engine** | XGBoost, TensorFlow/Keras, Scikit-learn |
| **Frontend** | Next.js 15, Tailwind CSS, Lucide React |
| **Persistence** | NSSM, File-based JSON/CSV, Rotating Log Handlers |
| **Blockchain** | Web3.py, Polygon Amoy Testnet |

---
*Created by Aditya | APEX Intelligence Engine v2.5.0 Elite*
