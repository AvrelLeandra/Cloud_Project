# 🚛 Smart Fleet Telemetry & Predictive Maintenance Platform — Project Documentation

Comprehensive documentation of the architecture, features, machine learning pipeline, cloud infrastructure, and deployment configurations implemented for the **Smart Fleet Telemetry & Predictive Maintenance Platform**.

---

## 📌 Executive Summary

The **Smart Fleet Telemetry Platform** is an enterprise-grade IoT logistics and predictive maintenance application built for commercial freight operations across India. It integrates real-time vehicle telemetry streaming, machine learning failure risk scoring, SHAP explainable AI, Azure Digital Twins graph modeling, automated emergency dispatch workflows, and an Azure OpenAI-powered natural language assistant.

---

## 🌟 Key Application Features

### 1. 📊 Interactive Fleet Telemetry Dashboard
* **Real-time KPI Metrics**: Active vehicles (15 streaming live), high-risk alerts count, fleet average speed ($km/h$), and fuel reserve percentage ($%$).
* **Pan-India GPS Map**: Interactive Leaflet map rendering all 15 registered freight trucks on major logistics corridors with dynamic risk-based color halos (Emerald Green = Healthy, Amber = Warning, Crimson Red = Critical).
* **Active Vehicle Filter & Search**: Instant filtering by vehicle status (`All`, `Critical`, `Healthy`) and search by vehicle ID or driver name.
* **Live Anomaly Simulator**: Trigger real-time telemetry faults (*Low Fuel Alert*, *Rash Driving Violation*, *Engine Overheat*) to test alert pipelines.
* **Telemetry Analytics Widgets**: SVG telemetry trend chart, driver safety score leaderboard, and recent alerts log.

### 2. 🗺️ Live Map & Highway Route Navigation View
* **15 National Highway (NH) Corridors**: Precise GPS route waypoints mapping routes across Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Jaipur, Surat, Pune, Ahmedabad, Udaipur, Hubballi, Nagpur, Bhopal, Vijayawada, and Visakhapatnam.
* **Green Pulsating Start Pointer Node**: `#10b981` glowing ring indicating shipment origin location.
* **Red Pulsating Finish Pointer Node**: `#ef4444` glowing ring indicating destination logistics hub.
* **Cyan Moving Vehicle Truck Node**: `#2dd4bf` truck marker (`🚛`) locked 100% on the highway route polyline.
* **Bottom Travel Banner**: Displays vehicle ID, driver name, speed, fuel reserve, origin, destination, and **`ESTIMATED TIME OF TRAVEL`**.

### 3. 🚨 Emergency Service Dispatch Center
* **Alert Vehicle Queue**: Displays vehicles requiring service (Low Fuel $< 15\%$, Thermal Overheat $> 95^\circ\text{C}$, Rash Driving $> 80 \text{ km/h}$, Battery Voltage Drop $< 11.5\text{V}$, Geofence Breach).
* **Realistic Timed Service Lifecycle (`ONGOING SERVICE` ➔ `COMPLETED`)**:
  * Clicking an action (e.g. `📍 Reroute to Nearest HPCL/BPCL Fuel Station`) initiates an **`ONGOING SERVICE 🚚`** status.
  * Simulates a 6-second travel/servicing delay (`Vehicle en route to station... Refueling upon arrival`).
  * Upon arrival, fuel rises to **100%**, risk drops to 12%, vehicle leaves the emergency queue, and the audit log updates to **`COMPLETED ✅`**.
* **Targeted Dispatch Actions**:
  * ⛽ **Low Fuel**: *Reroute to Nearest HPCL/BPCL Fuel Station*, *Dispatch Mobile Fuel Refueler Truck*
  * 🔥 **Overheat**: *Dispatch Emergency Coolant & Repair Team*, *Command Driver Emergency Pull-Over*
  * 🚨 **Rash Driving**: *Issue Immediate Voice Warning to Driver Cab*, *Remote Lock Speed Governor to 60 km/h*
  * ⚡ **Battery Drop**: *Dispatch Mobile Battery Replacement Unit*, *Schedule Alternator Repair at Depot*
  * 🌐 **Geofence Breach**: *Transmit GPS Route Recalibration Data*, *Contact Highway Corridor Control Center*

### 4. 🚚 Fleet Operations & Driver Safety
* **Vehicles Sub-tab**: Complete inventory list of all 15 vehicles with route details and ETA.
* **Driver Behavior Sub-tab**: Driver safety leaderboard with scores (out of 100), harsh braking counts, current speed, and **idle/coasting distance in kilometers (`idle_km`)**.
* **Predictive Maintenance Sub-tab**: Remaining Useful Life tracking (`days RUL`).

### 5. 📑 Analytics & Automated Diagnostic Reports
* **Telemetry Trends**: Fleet-wide average speed index and fuel efficiency tracking.
* **Active Alarm Log**: Comprehensive list of historical and active alerts.
* **Automated Report Generator**: Compiles telemetry status, driver performance, and anomaly records into downloadable diagnostic summaries (`/api/reports/generate`).

### 6. 🤖 Universal SmartFleet AI Assistant
* **Natural Language Query Parsing** (`/api/query/nl`): Responds to fleet prompts (*"Show fast moving vehicles"*, *"Show low fuel vehicles"*, *"Which trucks need service in India?"*).
* **Azure OpenAI Integration (`gpt-4o`)**: Connects to Azure OpenAI for general knowledge, cloud architecture, and technical guidance.

### 7. 🔷 Vehicle Inspection Modal & Azure Digital Twins (ADT)
* **Telemetry Inspection**: Detailed readouts for Engine Temp, Fuel Level, Speed, and ML Failure Risk.
* **Azure Digital Twins (ADT) Node Graph**: Renders virtual component nodes (`EngineNode`, `BatteryNode`, `CorridorNode`, `DriverNode`) with status and health percentages.
* **SHAP Explainable AI Breakdown**: Bar charts displaying feature attribution percentages (`engine_temp`, `battery_voltage`, `rpm`, `fuel_level`, etc.) driving failure risk scores.

---

## 🤖 Machine Learning Architecture (`ml/`)

The application trains and executes two Scikit-Learn Gradient Boosting models along with a SHAP Tree Explainer:

1. **Breakdown Risk Classifier (`GradientBoostingClassifier`)**:
   * Predicts failure probability ($0\%$ to $100\%$) based on 7 live telemetry features: `engine_temp`, `battery_voltage`, `rpm`, `fuel_level`, `speed`, `harsh_braking_count`, `idle_time`.
2. **Remaining Useful Life Regressor (`GradientBoostingRegressor`)**:
   * Predicts remaining operational days before maintenance is required (`predicted_days_to_failure`).
3. **SHAP Explainable AI Engine (`shap.TreeExplainer`)**:
   * Quantifies percentage contribution (`impact_pct`) of each sensor metric to the final risk score.

---

## ☁️ Cloud Architecture & Infrastructure as Code (`infra/`)

Defined via Azure Bicep templates ([`infra/main.bicep`](file:///c:/Users/Avrel/Desktop/Cloud/infra/main.bicep)) for deployment in region **`southindia`**:

* **Azure IoT Hub (`smartfleet-hub-dev`)**: Telemetry ingestion pipeline for registered IoT truck hardware.
* **Azure Cosmos DB (`smartfleet-cosmos-dev`)**: Distributed NoSQL data store for vehicle history.
* **Azure Functions (`smartfleet-func-dev`)**: Serverless stream processor (`TelemetryStreamProcessor`).
* **Azure Digital Twins (`smartfleet-adt-dev`)**: Engine, battery, driver, and corridor graph modeling.
* **Azure OpenAI Service (`smartfleet-oai-dev`)**: Generative AI language model service (`gpt-4o`).
* **Azure Storage Account (`smartfleetstdev`)** & **Key Vault (`smartfleet-kv-dev`)**.

---

## 🛠️ Project Structure & File Sitemap

```
Cloud/
├── api/
│   ├── main.py                  # FastAPI Backend API server, endpoints & React static route server
│   └── requirements.txt         # FastAPI dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # React Dashboard, Leaflet Map, Emergency Dispatch & AI Assistant
│   │   ├── main.jsx             # React entry point
│   │   └── templates.js         # UI data definitions
│   ├── dist/                    # Compiled production build (index.html, index-fed540d7.js)
│   ├── index.html               # HTML template
│   └── package.json             # React NPM dependencies & Vite config
├── ml/
│   ├── train.py                 # Gradient Boosting Classifier & Regressor training pipeline
│   ├── explainability.py        # SHAP TreeExplainer engine
│   ├── score.py                 # Inference scoring script
│   └── model.joblib             # Serialized trained ML model artifacts
├── simulator/
│   ├── vehicle_simulator.py     # Live 15-truck telemetry stream simulator
│   ├── route_generator.py       # National Highway GPS waypoint generator
│   └── config.json              # Simulator vehicle configuration
├── infra/
│   ├── main.bicep               # Root Azure Bicep IaC deployment template
│   ├── parameters.json          # Deployment location (southindia) and parameters
│   ├── azuredeploy.json         # Compiled ARM JSON template for Azure Portal Custom Deployment
│   └── modules/                 # Bicep modules (IoT Hub, Cosmos DB, Functions, OpenAI, etc.)
├── scripts/
│   └── run_local.py             # Local runner script (launches FastAPI on port 8000 & simulator)
├── build.sh                     # Deployment script for Render web service
├── render.yaml                  # Render Cloud infrastructure configuration
├── requirements.txt             # Root Python dependencies for cloud deployment
├── README.md                    # Project overview
└── PROJECT_DOCUMENTATION.md     # Detailed application documentation
```

---

## 🚀 Deployment Instructions

### 1. Local Execution
```powershell
python scripts/run_local.py
```
* **Frontend UI**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 2. Render Cloud Deployment
* **Repository**: `https://github.com/AvrelLeandra/Cloud_Project.git`
* **Build Command**: `./build.sh`
* **Start Command**: `python scripts/run_local.py`
* **Live Service**: Auto-deploys frontend SPA and FastAPI backend as a unified web service on Render.

### 3. Microsoft Azure Deployment
```powershell
az login
az deployment sub create --location southindia --template-file infra/main.bicep --parameters location=southindia
```

---

## 📝 GitHub Repository

The entire codebase is version-controlled and pushed to GitHub:
👉 **[https://github.com/AvrelLeandra/Cloud_Project.git](https://github.com/AvrelLeandra/Cloud_Project.git)**
