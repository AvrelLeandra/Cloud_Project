# Azure Cloud Economics & Scalability Report

## Executive Summary

This report presents a cost estimation and scalability analysis for scaling the **Smart Fleet Telemetry & Predictive Maintenance Platform** from **100** to **10,000** vehicles emitting live telemetry at 3-second intervals (20 messages per vehicle per minute).

---

## Assumptions & Workload Sizing

- **Telemetry Frequency**: 1 record per vehicle every 3 seconds = 20 messages/min = 28,800 messages/vehicle/day.
- **Payload Size**: ~500 bytes per telemetry JSON document.

| Fleet Size | Messages / Day | Data Volume / Day | Data Volume / Month |
| :--- | :--- | :--- | :--- |
| **100 Vehicles** | 2.88 Million | 1.44 GB | 43.2 GB |
| **1,000 Vehicles** | 28.8 Million | 14.4 GB | 432 GB |
| **10,000 Vehicles** | 288 Million | 144 GB | 4.32 TB |

---

## Azure Service Breakdown & Monthly Cost Matrix (USD)

### 1. Azure IoT Hub
- **100 Vehicles**: 1 Unit IoT Hub **S1** (up to 400,000 msgs/day standard SKU or S1 multi-unit) ~ **$25 / month**.
- **1,000 Vehicles**: 7 Units IoT Hub **S1** or 1 Unit **S2** (up to 6M msgs/day) ~ **$250 / month**.
- **10,000 Vehicles**: 5 Units IoT Hub **S2** ~ **$1,250 / month**.

### 2. Azure Data Lake Storage Gen2 (Raw Data Archival)
- **Hot Tier Blob Storage** ($0.018 per GB/month + write operations).
- **100 Vehicles** (43 GB): ~$1.50 / month.
- **1,000 Vehicles** (432 GB): ~$12.00 / month.
- **10,000 Vehicles** (4.3 TB): ~$110.00 / month.

### 3. Azure Cosmos DB (NoSQL Serverless vs Provisioned Autoscale)
- **100 Vehicles**: Serverless mode (~15 million Request Units) ~ **$35 / month**.
- **1,000 Vehicles**: Autoscale (400 - 4,000 RU/s) ~ **$220 / month**.
- **10,000 Vehicles**: Autoscale (4,000 - 40,000 RU/s) ~ **$1,800 / month**.

### 4. Azure Machine Learning (Online Inference Endpoint)
- **100 Vehicles**: 1 node `Standard_DS2_v2` (2 vCPU, 7 GB RAM) ~ **$85 / month**.
- **1,000 Vehicles**: 2 nodes `Standard_DS3_v2` (4 vCPU, 14 GB RAM) ~ **$340 / month**.
- **10,000 Vehicles**: 6 nodes `Standard_DS4_v2` with Auto-scaling ~ **$1,800 / month**.

### 5. Azure Functions (Serverless Compute)
- Execution pricing: $0.20 per million executions + execution time.
- **100 Vehicles**: ~$8.00 / month.
- **1,000 Vehicles**: ~$65.00 / month.
- **10,000 Vehicles**: ~$520.00 / month.

### 6. Azure OpenAI Service (Natural Language Query Layer)
- Based on `gpt-4o-mini` ($0.15 / 1M input tokens, $0.60 / 1M output tokens).
- Estimated 5,000 queries/month across fleet operators ~ **$15.00 / month**.

---

## Total Estimated Monthly Azure Investment

| Architecture Tier | 100 Vehicles | 1,000 Vehicles | 10,000 Vehicles |
| :--- | :--- | :--- | :--- |
| **IoT Hub** | $25.00 | $250.00 | $1,250.00 |
| **ADLS Gen2 Storage** | $1.50 | $12.00 | $110.00 |
| **Cosmos DB** | $35.00 | $220.00 | $1,800.00 |
| **Azure ML Endpoint** | $85.00 | $340.00 | $1,800.00 |
| **Azure Functions** | $8.00 | $65.00 | $520.00 |
| **Azure OpenAI & Logic Apps** | $15.00 | $30.00 | $100.00 |
| **TOTAL ESTIMATED MONTHLY** | **~$169.50 / mo** | **~$917.00 / mo** | **~$5,580.00 / mo** |
| **Per Vehicle Cost** | **$1.70 / vehicle** | **$0.92 / vehicle** | **$0.56 / vehicle** |

> [!TIP]
> **Cloud Economics Insight**: Economies of scale reduce per-vehicle cloud operational costs by **67%** as fleet size increases from 100 to 10,000 vehicles due to shared ML compute nodes and IoT Hub capacity utilization.
