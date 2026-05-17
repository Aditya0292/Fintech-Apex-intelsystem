# ⚡ 07: Production Reliability
*Windows Service Persistence & Alert Intelligence*

---

## ⚡ Production Reliability & Persistence
**APEX Trade AI** is engineered to operate as an autonomous background process, independent of the user's GUI session. The reliability layer is the "24/7 Shield" for the institutional signal pipeline.

### 1. Windows Service (NSSM)
To achieve industrial-grade uptime, the entry-point (`python -m src.pipeline.main`) is registered as a **Windows Service** via the **Non-Sucking Service Manager (NSSM)**.
- **Fail-Safe Monitoring**: If the Python process crashes or is terminated, the SCM (Service Control Manager) restarts it within **10 seconds**.
- **Delayed Startup**: The service is configured for **Automatic (Delayed Start)**, ensuring that it only attempts to connect to MT5 after all network and GUI dependencies have initialized during a system boot.

### 2. Session-Aware Scheduling
A flat, interval-based scheduler is inefficient in global markets. APEX implements a **Dynamic Heartbeat** that scales based on the current UTC session.
- **Asian Session (00:00–08:00)**: Low volume; scales to a **15-minute** refresh to conserve system resources.
- **London/NY Overlap (13:00–17:00)**: Peak volatility; the pipeline accelerates to a **5-minute** refresh for maximum responsiveness.
- **Full Reconstruction**: At specific session boundaries (e.g., 08:00 UTC), a **Full Pipeline** run is triggered, involving deep model re-training and a complete data scrape.

---

## 🚨 Real-Time Observability & Alerting
The system provides a "Health-First" monitoring interface, ensuring the user is always aware of the pipeline's operational state.

### 1. Pipeline Health Monitoring
A dedicated `PipelineHealthMonitor` tracks the execution of every stage and persists its state to a shared JSON file.
- **🟢 HEALTHY**: All stages succeeded, and data is fresh.
- **🟡 DEGRADED**: Critical data (Price Action) failed to fetch after retries; "Safe Mode" is active.
- **🔴 ERROR**: Persistent failures (3+) have occurred; the system is in an "Alert State."

### 2. Real-Time Webhook Alerting (Slack/Teams)
APEX integrates an **Alerting Hook** designed to eliminate "Silent Failures" at 3:00 AM.
- **Threshold Alerting**: If the pipeline fails **3 consecutive times**, a high-priority alert is dispatched via a configured Slack or Teams Incoming Webhook.
- **Recovery Logic**: Once the pipeline heals itself and records a successful run, a **Recovery Notification** is sent, confirming the system is back in a `HEALTHY` state.
- **Verification**: The system includes a `--test-alert` CLI utility for instant webhook verification during deployment.

---

## 📊 Summary of Reliability (v2.5)
- **Auto-Healing**: 10s restart window.
- **Observability**: Real-time heartbeat tracking via the Institutional Dashboard.
- **Alerting**: Webhook-integrated fail-safe and recovery notifications.

---
*Created by Aditya | APEX Intelligence Engine v2.5.0 Elite*
