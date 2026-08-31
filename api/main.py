import os
import sys
import json
import datetime
import math
import random
import urllib.request
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml")))
try:
    from explainability import MLModelExplainer
    explainer = MLModelExplainer()
except Exception:
    explainer = None

app = FastAPI(
    title="Smart Fleet Management API Layer",
    description="Cloud-native fleet telemetry, predictive maintenance, Digital Twins, and Azure OpenAI services",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FLEET_CACHE: Dict[str, Dict[str, Any]] = {}
HISTORY_CACHE: Dict[str, List[Dict[str, Any]]] = {}

# 15 Pan-India Vehicles with explicit Start, Destination, and ETA
INITIAL_VEHICLES = [
    {"vehicle_id": "IND-VEH-101", "driver_name": "Rajesh Kumar", "model": "Tata Signa 5530.S", "lat": 28.6139, "lon": 77.2090, "speed": 68.5, "temp": 87.2, "voltage": 13.8, "fuel": 78.0, "risk": 0.12, "start": "Delhi Logistics Park", "dest": "Mumbai Terminal 2", "eta": "5 hrs 20 mins", "idle_km": 14.2},
    {"vehicle_id": "IND-VEH-102", "driver_name": "Amitabh Sharma", "model": "Ashok Leyland 4825", "lat": 19.0760, "lon": 72.8777, "speed": 84.0, "temp": 109.5, "voltage": 13.6, "fuel": 12.5, "risk": 0.88, "start": "Mumbai JNPT Port", "dest": "Ahmedabad Inland Depot", "eta": "3 hrs 45 mins", "idle_km": 28.6},
    {"vehicle_id": "IND-VEH-103", "driver_name": "Suresh Gowda", "model": "BharatBenz 2823C", "lat": 12.9716, "lon": 77.5946, "speed": 42.0, "temp": 86.0, "voltage": 10.8, "fuel": 45.0, "risk": 0.79, "start": "Bengaluru Electronic City", "dest": "Chennai Harbour", "eta": "6 hrs 10 mins", "idle_km": 9.4},
    {"vehicle_id": "IND-VEH-104", "driver_name": "Vikram Singh", "model": "Eicher Pro 6035", "lat": 17.3850, "lon": 78.4867, "speed": 89.2, "temp": 91.0, "voltage": 13.9, "fuel": 88.0, "risk": 0.15, "start": "Hyderabad Cargo Hub", "dest": "Nagpur Logistic Center", "eta": "4 hrs 15 mins", "idle_km": 18.0},
    {"vehicle_id": "IND-VEH-105", "driver_name": "Lakshmi Narayana", "model": "Mahindra Blazo X", "lat": 22.5726, "lon": 88.3639, "speed": 58.0, "temp": 84.0, "voltage": 13.7, "fuel": 14.0, "risk": 0.65, "start": "Kolkata Port Terminal", "dest": "Bhubaneswar Depot", "eta": "7 hrs 30 mins", "idle_km": 12.1},
    {"vehicle_id": "IND-VEH-106", "driver_name": "Pritam Mukherjee", "model": "Tata Signa 5530.S", "lat": 26.9124, "lon": 75.7873, "speed": 76.4, "temp": 88.0, "voltage": 13.5, "fuel": 62.0, "risk": 0.18, "start": "Jaipur Industrial Zone", "dest": "Delhi NCR Hub", "eta": "2 hrs 50 mins", "idle_km": 11.5},
    {"vehicle_id": "IND-VEH-107", "driver_name": "Venkatesh Murthy", "model": "Ashok Leyland 4825", "lat": 13.0827, "lon": 80.2707, "speed": 34.0, "temp": 85.5, "voltage": 13.8, "fuel": 80.0, "risk": 0.10, "start": "Chennai Port Trust", "dest": "Vijayawada Hub", "eta": "8 hrs 05 mins", "idle_km": 7.8},
    {"vehicle_id": "IND-VEH-108", "driver_name": "Ananya Rao", "model": "BharatBenz 2823C", "lat": 21.1702, "lon": 72.8311, "speed": 92.0, "temp": 94.0, "voltage": 13.7, "fuel": 71.0, "risk": 0.52, "start": "Surat Textile Hub", "dest": "Pune Industrial Area", "eta": "4 hrs 40 mins", "idle_km": 22.4},
    {"vehicle_id": "IND-VEH-109", "driver_name": "Praveen Patil", "model": "Eicher Pro 6035", "lat": 18.5204, "lon": 73.8567, "speed": 61.0, "temp": 87.0, "voltage": 13.8, "fuel": 11.0, "risk": 0.72, "start": "Pune Auto Cluster", "dest": "Goa Logistics Terminal", "eta": "6 hrs 15 mins", "idle_km": 15.3},
    {"vehicle_id": "IND-VEH-110", "driver_name": "Rohan Mehta", "model": "Mahindra Blazo X", "lat": 23.0225, "lon": 72.5714, "speed": 79.5, "temp": 86.8, "voltage": 13.6, "fuel": 55.0, "risk": 0.14, "start": "Ahmedabad GIDC", "dest": "Udaipur Freight Station", "eta": "3 hrs 10 mins", "idle_km": 8.9},
    {"vehicle_id": "IND-VEH-111", "driver_name": "Ganesh Naik", "model": "Tata Signa 5530.S", "lat": 15.3647, "lon": 75.1240, "speed": 52.0, "temp": 86.2, "voltage": 13.7, "fuel": 68.0, "risk": 0.09, "start": "Hubballi Cargo Yard", "dest": "Bengaluru Peenya", "eta": "5 hrs 50 mins", "idle_km": 10.6},
    {"vehicle_id": "IND-VEH-112", "driver_name": "Sunil Shetty", "model": "Ashok Leyland 4825", "lat": 21.1458, "lon": 79.0882, "speed": 88.0, "temp": 98.2, "voltage": 13.5, "fuel": 74.0, "risk": 0.48, "start": "Nagpur Central Logistics", "dest": "Bhopal Cargo Depot", "eta": "4 hrs 25 mins", "idle_km": 19.8},
    {"vehicle_id": "IND-VEH-113", "driver_name": "Vijay Devaraj", "model": "BharatBenz 2823C", "lat": 16.5062, "lon": 80.6480, "speed": 45.0, "temp": 87.1, "voltage": 13.8, "fuel": 85.0, "risk": 0.11, "start": "Vijayawada Auto Nagar", "dest": "Visakhapatnam Port", "eta": "5 hrs 00 mins", "idle_km": 6.7},
    {"vehicle_id": "IND-VEH-114", "driver_name": "Kavitha Reddy", "model": "Eicher Pro 6035", "lat": 20.2961, "lon": 85.8245, "speed": 82.5, "temp": 104.0, "voltage": 11.2, "fuel": 9.5, "risk": 0.94, "start": "Bhubaneswar Cargo City", "dest": "Kolkata Dock Yard", "eta": "6 hrs 40 mins", "idle_km": 31.2},
    {"vehicle_id": "IND-VEH-115", "driver_name": "Harish Acharya", "model": "Mahindra Blazo X", "lat": 24.5854, "lon": 73.7125, "speed": 71.0, "temp": 87.0, "voltage": 13.7, "fuel": 79.0, "risk": 0.13, "start": "Udaipur Marble Zone", "dest": "Jaipur Transport Hub", "eta": "4 hrs 05 mins", "idle_km": 13.4}
]

def generate_digital_twin(vehicle_data):
    temp = vehicle_data.get("engine_temp", 85.0)
    volt = vehicle_data.get("battery_voltage", 13.8)
    geofence_breach = vehicle_data.get("geofence_breach", False)

    return {
        "twin_id": f"dt-{vehicle_data.get('vehicle_id')}",
        "last_synced": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "graph_nodes": [
            {
                "id": "EngineNode",
                "label": "Engine Assembly",
                "health_pct": max(10, int(100 - (temp - 85) * 3 if temp > 85 else 98)),
                "status": "CRITICAL" if temp > 105 else ("WARNING" if temp > 95 else "HEALTHY"),
                "metrics": {"temp_c": temp, "rpm": vehicle_data.get("rpm", 2100)}
            },
            {
                "id": "BatteryNode",
                "label": "Battery & Alternator",
                "health_pct": max(10, int(100 - (13.5 - volt) * 30 if volt < 13.5 else 96)),
                "status": "CRITICAL" if volt < 11.0 else ("WARNING" if volt < 12.0 else "HEALTHY"),
                "metrics": {"voltage_v": volt}
            },
            {
                "id": "CorridorNode",
                "label": "Highway Geofence Corridor",
                "health_pct": 20 if geofence_breach else 100,
                "status": "BREACHED" if geofence_breach else "IN_CORRIDOR",
                "metrics": {"route_deviation_km": 8.4 if geofence_breach else 0.2}
            },
            {
                "id": "DriverNode",
                "label": "Assigned Operator",
                "name": vehicle_data.get("driver_name", "Driver"),
                "status": "ACTIVE"
            }
        ]
    }

def seed_cache_if_empty():
    if not FLEET_CACHE:
        for item in INITIAL_VEHICLES:
            vid = item["vehicle_id"]
            data = {
                "vehicle_id": vid,
                "driver_name": item["driver_name"],
                "model": item["model"],
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "latitude": item["lat"],
                "longitude": item["lon"],
                "speed": item["speed"],
                "engine_temp": item["temp"],
                "rpm": 2150 if item["speed"] < 80 else 3600,
                "fuel_level": item["fuel"],
                "battery_voltage": item["voltage"],
                "harsh_braking_count": 4 if item["speed"] > 80 else random.randint(0, 2),
                "idle_time": item["idle_km"] * 60,
                "idle_km": item["idle_km"],
                "start_location": item["start"],
                "destination": item["dest"],
                "eta": item["eta"],
                "geofence_breach": False,
                "failure_risk_score": item["risk"],
                "predicted_days_to_failure": round(30.0 * (1.0 - item["risk"]), 1),
                "alert_active": item["risk"] > 0.60 or item["fuel"] < 15.0 or item["speed"] > 80.0
            }
            FLEET_CACHE[vid] = data
            HISTORY_CACHE[vid] = [data]

seed_cache_if_empty()

class NLQueryRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {
        "service": "Smart Fleet Management API Layer",
        "status": "ONLINE",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "active_vehicles": len(FLEET_CACHE)
    }

@app.get("/api/vehicles")
def get_vehicles():
    seed_cache_if_empty()
    return {"vehicles": list(FLEET_CACHE.values())}

@app.get("/api/vehicles/{vehicle_id}")
def get_vehicle_detail(vehicle_id: str):
    seed_cache_if_empty()
    if vehicle_id not in FLEET_CACHE:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    current = FLEET_CACHE[vehicle_id]
    shap_data = None
    if explainer:
        shap_data = explainer.predict_and_explain(current)
    else:
        shap_data = {
            "failure_risk_score": current.get("failure_risk_score", 0.15),
            "predicted_days_to_failure": current.get("predicted_days_to_failure", 25.0),
            "shap_explanations": [
                {"feature": "engine_temp", "impact_pct": 55.0, "value": current.get("engine_temp")},
                {"feature": "fuel_level", "impact_pct": 25.0, "value": current.get("fuel_level")},
                {"feature": "speed", "impact_pct": 20.0, "value": current.get("speed")}
            ]
        }
    
    dt_graph = generate_digital_twin(current)

    return {
        "telemetry": current,
        "history": HISTORY_CACHE.get(vehicle_id, [])[-30:],
        "ml_analysis": shap_data,
        "digital_twin": dt_graph
    }

@app.get("/api/reports/generate")
def generate_report():
    seed_cache_if_empty()
    vehicles = list(FLEET_CACHE.values())
    critical_count = sum(1 for v in vehicles if v.get("failure_risk_score", 0) > 0.60 or v.get("engine_temp", 0) > 100)
    low_fuel_count = sum(1 for v in vehicles if v.get("fuel_level", 100) < 15.0)
    rash_driving_count = sum(1 for v in vehicles if v.get("speed", 0) > 80.0)

    report_content = f"""===================================================================
   SMART FLEET PREDICTIVE MAINTENANCE & DIAGNOSTIC REPORT
   Generated: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
===================================================================
Total Monitored Fleet: {len(vehicles)} Active Vehicles
Critical Maintenance Alerts: {critical_count} Vehicles
Dangerously Low Fuel Warnings (<15%): {low_fuel_count} Vehicles
Rash Driving Violations (>80 km/h): {rash_driving_count} Vehicles
Average Fleet Speed: {sum(v.get('speed',0) for v in vehicles)/len(vehicles):.1f} km/h
Average Fuel Reserve: {sum(v.get('fuel_level',0) for v in vehicles)/len(vehicles):.1f}%

DETAILED CRITICAL VEHICLE ALERTS:
"""
    for v in vehicles:
        alerts = []
        if v.get("engine_temp", 0) > 100: alerts.append(f"Thermal Overheat ({v['engine_temp']}°C)")
        if v.get("fuel_level", 100) < 15.0: alerts.append(f"Dangerously Low Fuel ({v['fuel_level']}%)")
        if v.get("speed", 0) > 80.0: alerts.append(f"Rash Driving Overspeed ({v['speed']} km/h)")
        if v.get("battery_voltage", 13.8) < 11.5: alerts.append(f"Battery Voltage Drop ({v['battery_voltage']}V)")
        if v.get("geofence_breach", False): alerts.append("Geofence Route Breach")

        if alerts:
            report_content += f"\n- [{v['vehicle_id']}] Driver: {v['driver_name']} | Route: {v['start_location']} -> {v['destination']} (ETA: {v['eta']})\n  ALERTS: {', '.join(alerts)}"

    return {
        "report_id": f"REP-{random.randint(1000, 9999)}",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "summary": report_content
    }

@app.get("/api/fleet/kpis")
def get_fleet_kpis():
    seed_cache_if_empty()
    vehicles = list(FLEET_CACHE.values())
    total = len(vehicles)
    if total == 0:
        return {}

    avg_speed = sum(v.get("speed", 0) for v in vehicles) / total
    avg_fuel = sum(v.get("fuel_level", 0) for v in vehicles) / total
    critical_alerts = sum(1 for v in vehicles if v.get("failure_risk_score", 0) > 0.60 or v.get("engine_temp", 0) > 100.0 or v.get("fuel_level", 100) < 15.0 or v.get("speed", 0) > 80.0)
    warning_alerts = sum(1 for v in vehicles if 0.35 <= v.get("failure_risk_score", 0) <= 0.60)
    healthy_count = total - critical_alerts - warning_alerts

    return {
        "total_vehicles": total,
        "active_alerts": critical_alerts,
        "warning_count": warning_alerts,
        "healthy_count": healthy_count,
        "avg_fleet_speed_kmh": round(avg_speed, 1),
        "avg_fuel_level_pct": round(avg_fuel, 1),
        "maintenance_due_count": critical_alerts + warning_alerts
    }

@app.get("/api/drivers/scores")
def get_driver_scores():
    seed_cache_if_empty()
    drivers = []
    for vid, data in FLEET_CACHE.items():
        braking = data.get("harsh_braking_count", 0)
        idle_km = data.get("idle_km", 10.0)
        speed = data.get("speed", 55)
        
        penalty = (braking * 5) + int(idle_km * 0.5) + (15 if speed > 80 else 0)
        safety_score = max(40, 100 - penalty)
        
        drivers.append({
            "vehicle_id": vid,
            "driver_name": data.get("driver_name", "Unknown"),
            "safety_score": safety_score,
            "harsh_braking_events": braking,
            "idle_km": round(idle_km, 1),
            "current_speed": speed,
            "tier": "Gold" if safety_score >= 90 else ("Silver" if safety_score >= 75 else "Needs Review")
        })

    drivers.sort(key=lambda x: x["safety_score"], reverse=True)
    return {"driver_scores": drivers}

@app.post("/api/telemetry/ingest")
def ingest_telemetry(payload: Dict[str, Any] = Body(...)):
    items = payload.get("telemetry", [])
    if isinstance(payload, list):
        items = payload

    processed_count = 0
    for record in items:
        vid = record.get("vehicle_id")
        if vid:
            if explainer:
                ml_res = explainer.predict_and_explain(record)
                record["failure_risk_score"] = ml_res["failure_risk_score"]
                record["predicted_days_to_failure"] = ml_res["predicted_days_to_failure"]
            else:
                temp = float(record.get("engine_temp", 85.0))
                volt = float(record.get("battery_voltage", 13.8))
                fuel = float(record.get("fuel_level", 75.0))
                speed = float(record.get("speed", 55.0))
                
                risk = 0.85 if (temp > 100 or volt < 11.0 or fuel < 15.0 or speed > 80.0) else 0.15
                record["failure_risk_score"] = risk
                record["predicted_days_to_failure"] = round(30.0 * (1.0 - risk), 1)

            record["alert_active"] = record["failure_risk_score"] > 0.60

            if vid in RESOLVED_ALERT_VEHICLES:
                record.update(RESOLVED_ALERT_VEHICLES[vid])
            
            # Preserve location fields
            if vid in FLEET_CACHE:
                record["start_location"] = record.get("start_location", FLEET_CACHE[vid].get("start_location", "Start Hub"))
                record["destination"] = record.get("destination", FLEET_CACHE[vid].get("destination", "Dest Hub"))
                record["eta"] = record.get("eta", FLEET_CACHE[vid].get("eta", "4 hrs"))
                record["idle_km"] = record.get("idle_km", FLEET_CACHE[vid].get("idle_km", 10.0))

            FLEET_CACHE[vid] = record
            if vid not in HISTORY_CACHE:
                HISTORY_CACHE[vid] = []
            HISTORY_CACHE[vid].append(record)
            if len(HISTORY_CACHE[vid]) > 100:
                HISTORY_CACHE[vid] = HISTORY_CACHE[vid][-100:]
            processed_count += 1

    return {"status": "SUCCESS", "records_processed": processed_count}

RESOLVED_ALERT_VEHICLES: Dict[str, Dict[str, Any]] = {}

class AlertDispatchPayload(BaseModel):
    vehicle_id: str
    alert_type: str
    service_action: str
    status: Optional[str] = "COMPLETED"

@app.post("/api/alerts/dispatch")
def dispatch_service(payload: AlertDispatchPayload):
    seed_cache_if_empty()
    vid = payload.vehicle_id
    action_lower = payload.service_action.lower()

    if payload.status == "ONGOING":
        return {
            "status": "ONGOING SERVICE",
            "dispatch_id": f"DSP-{random.randint(10000, 99999)}",
            "vehicle_id": vid,
            "service_action": payload.service_action,
            "message": f"Service '{payload.service_action}' initiated. Vehicle en route to station...",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

    overrides = {
        "failure_risk_score": 0.12,
        "alert_active": False,
        "is_faulty": False
    }

    if "fuel" in action_lower or "refuel" in action_lower or "station" in action_lower:
        overrides["fuel_level"] = 100.0
    if "coolant" in action_lower or "temp" in action_lower or "pull-over" in action_lower:
        overrides["engine_temp"] = 86.0
    if "speed" in action_lower or "governor" in action_lower or "warning" in action_lower:
        overrides["speed"] = 55.0
    if "battery" in action_lower or "alternator" in action_lower:
        overrides["battery_voltage"] = 13.8
    if "geofence" in action_lower or "route" in action_lower or "controller" in action_lower:
        overrides["geofence_breach"] = False

    RESOLVED_ALERT_VEHICLES[vid] = overrides

    if vid in FLEET_CACHE:
        FLEET_CACHE[vid].update(overrides)

    return {
        "status": "COMPLETED",
        "dispatch_id": f"DSP-{random.randint(10000, 99999)}",
        "vehicle_id": vid,
        "service_action": payload.service_action,
        "message": f"Service '{payload.service_action}' completed and verified for vehicle {vid}.",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.post("/api/query/nl")
def natural_language_query(req: NLQueryRequest):
    prompt_raw = req.prompt.strip()
    prompt_lower = prompt_raw.lower()
    seed_cache_if_empty()
    vehicles = list(FLEET_CACHE.values())

    # 1. FAST MOVING / HIGH SPEED VEHICLES
    if "fast" in prompt_lower or "speed" in prompt_lower or "overspeed" in prompt_lower or "rash" in prompt_lower:
        # Filter vehicles with speed > 70 km/h or sort by speed descending
        sorted_speed = sorted(vehicles, key=lambda x: x.get("speed", 0), reverse=True)
        fast_list = [v for v in sorted_speed if v.get("speed", 0) >= 70.0]
        if not fast_list:
            fast_list = sorted_speed[:3]
        
        list_items = [
          f"• {v['vehicle_id']} ({v['driver_name']}): {v['speed']} km/h [Route: {v['start_location']} → {v['destination']}, ETA: {v['eta']}]"
          for v in fast_list
        ]
        answer = f"Found {len(fast_list)} fast-moving vehicle(s):\n" + "\n".join(list_items)

    # 2. LOW FUEL VEHICLES
    elif "fuel" in prompt_lower or "reserve" in prompt_lower:
        sorted_fuel = sorted(vehicles, key=lambda x: x.get("fuel_level", 100))
        low_fuel = [v for v in sorted_fuel if v.get("fuel_level", 100) <= 20.0]
        if not low_fuel:
            low_fuel = sorted_fuel[:3]
        
        list_items = [
          f"• {v['vehicle_id']} ({v['driver_name']}): {v['fuel_level']}% fuel remaining [Route: {v['start_location']} → {v['destination']}]"
          for v in low_fuel
        ]
        answer = f"Vehicles with lowest fuel reserves:\n" + "\n".join(list_items)

    # 3. HIGH TEMP / THERMAL OVERHEAT / SERVICE NEEDED
    elif "service" in prompt_lower or "maintenance" in prompt_lower or "risk" in prompt_lower or "overheat" in prompt_lower or "temp" in prompt_lower:
        flagged = [v for v in vehicles if v.get("failure_risk_score", 0) > 0.40 or v.get("engine_temp", 0) > 92.0]
        if not flagged:
            flagged = sorted(vehicles, key=lambda x: x.get("failure_risk_score", 0), reverse=True)[:3]
        
        list_items = [
          f"• {v['vehicle_id']} ({v['driver_name']}): {v['engine_temp']}°C, Risk: {(v.get('failure_risk_score',0)*100):.0f}% [Route: {v['start_location']} → {v['destination']}]"
          for v in flagged
        ]
        answer = f"Found {len(flagged)} vehicle(s) requiring service/thermal inspection:\n" + "\n".join(list_items)

    # 4. GEOFENCE / ROUTE BREACH
    elif "geofence" in prompt_lower or "route" in prompt_lower or "breach" in prompt_lower or "deviation" in prompt_lower:
        breached = [v for v in vehicles if v.get("geofence_breach", False)]
        if breached:
            list_items = [f"• {v['vehicle_id']} ({v['driver_name']}) - Straying off route {v['start_location']} → {v['destination']}" for v in breached]
            answer = f"Geofence corridor breach detected on {len(breached)} vehicle(s):\n" + "\n".join(list_items)
        else:
            answer = f"All {len(vehicles)} active fleet vehicles are currently operating within their assigned logistics corridors."

    # 5. ALL OTHER QUESTIONS (General Knowledge, Weather, Cloud, Greetings, Tech, Advice)
    else:
        # Fallback to Azure OpenAI endpoint if available or intelligent comprehensive answer generator
        azure_key = os.getenv("AZURE_OPENAI_KEY")
        azure_ep = os.getenv("AZURE_OPENAI_ENDPOINT")
        
        if azure_key and azure_ep:
            try:
                url = f"{azure_ep.rstrip('/')}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview"
                headers = {"Content-Type": "application/json", "api-key": azure_key}
                body = {
                    "messages": [
                        {"role": "system", "content": "You are SmartFleet AI, an intelligent cloud assistant for logistics, cloud architecture, and general knowledge. Answer the user clearly and helpfuly."},
                        {"role": "user", "content": prompt_raw}
                    ],
                    "max_tokens": 300
                }
                req_obj = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers)
                with urllib.request.urlopen(req_obj, timeout=5) as response:
                    resp_data = json.loads(response.read().decode('utf-8'))
                    answer = resp_data["choices"][0]["message"]["content"]
            except Exception:
                answer = f"SmartFleet AI: I received your question '{prompt_raw}'. In context of our fleet across India, all 15 vehicle streams (IND-VEH-101 to IND-VEH-115) are operational. Feel free to ask about any specific vehicle, route, speed, weather, or cloud infrastructure topic!"
        else:
            # Intelligent general response
            answer = f"SmartFleet AI Assistant:\nThank you for asking: '{prompt_raw}'!\n\nAs your AI assistant, I can help you monitor live Pan-India fleet telemetry, analyze predictive ML models, or discuss cloud architecture (Azure IoT Hub, Event Hubs, Cosmos DB, Bicep IaC). Currently, 15 vehicles are actively streaming live coordinates across major logistics routes."

    return {
        "query": req.prompt,
        "response": answer,
        "queried_records_count": len(vehicles),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
