import os
import json
import time
import random
import datetime
import requests
from route_generator import RouteGenerator
from fault_injector import FaultInjector

class Vehicle:
    def __init__(self, vehicle_id, driver_name, model, is_faulty=False, fault_type=None):
        self.vehicle_id = vehicle_id
        self.driver_name = driver_name
        self.model = model
        self.route = RouteGenerator(vehicle_id=vehicle_id)
        self.is_faulty = is_faulty
        self.fault_injector = FaultInjector(fault_type=fault_type) if is_faulty else None
        
        self.speed = 58.0 # km/h
        self.engine_temp = 87.5 # °C
        self.rpm = 2150
        self.fuel_level = random.uniform(60.0, 95.0)
        self.battery_voltage = 13.8 # V
        self.harsh_braking_count = 0
        self.idle_time = 0
        self.total_distance = round(random.uniform(1000.0, 50000.0), 1)

    def generate_telemetry(self):
        lat, lon = self.route.get_next_position(speed_kmh=self.speed, step_seconds=3.0)
        
        self.speed = max(0.0, min(105.0, self.speed + random.uniform(-3.5, 3.5)))
        if self.speed < 5.0:
            self.idle_time += 3
        
        harsh_brake = random.random() < 0.04
        if harsh_brake:
            self.harsh_braking_count += 1
            self.speed = max(0.0, self.speed - 20.0)

        self.fuel_level = max(0.0, self.fuel_level - 0.02)
        base_metrics = {
            "vehicle_id": self.vehicle_id,
            "driver_name": self.driver_name,
            "model": self.model,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "latitude": lat,
            "longitude": lon,
            "speed": round(self.speed, 1),
            "engine_temp": round(self.engine_temp + random.uniform(-0.5, 0.5), 1),
            "rpm": int(self.rpm + random.uniform(-50, 50)),
            "fuel_level": round(self.fuel_level, 1),
            "battery_voltage": round(self.battery_voltage + random.uniform(-0.05, 0.05), 2),
            "harsh_braking_count": self.harsh_braking_count,
            "idle_time": self.idle_time,
            "total_distance": round(self.total_distance, 1),
            "is_faulty": self.is_faulty
        }

        if self.is_faulty and self.fault_injector:
            base_metrics = self.fault_injector.apply_faults(base_metrics)

        return base_metrics

class FleetSimulator:
    def __init__(self, num_vehicles=15, target_url="http://127.0.0.1:8000/api/telemetry/ingest"):
        self.target_url = target_url
        self.vehicles = []
        drivers = [
            "Rajesh Kumar", "Amitabh Sharma", "Suresh Gowda", "Vikram Singh", "Lakshmi Narayana",
            "Pritam Mukherjee", "Venkatesh Murthy", "Ananya Rao", "Praveen Patil", "Rohan Mehta",
            "Ganesh Naik", "Sunil Shetty", "Vijay Devaraj", "Kavitha Reddy", "Harish Acharya"
        ]
        models = ["Tata Signa 5530.S", "Ashok Leyland 4825", "BharatBenz 2823C", "Eicher Pro 6035", "Mahindra Blazo X"]

        for i in range(num_vehicles):
            v_id = f"IND-VEH-{101 + i}"
            driver = drivers[i % len(drivers)]
            model = models[i % len(models)]
            is_faulty = (i % 4 == 1)
            fault_type = FaultInjector.FAULT_TYPES[i % len(FaultInjector.FAULT_TYPES)] if is_faulty else None
            self.vehicles.append(Vehicle(v_id, driver, model, is_faulty=is_faulty, fault_type=fault_type))

    def run_cycle(self):
        batch = []
        for v in self.vehicles:
            data = v.generate_telemetry()
            batch.append(data)
            
        try:
            requests.post(self.target_url, json={"telemetry": batch}, timeout=2)
        except Exception:
            pass

        return batch

    def start_loop(self, interval=3):
        print(f"Starting Pan-India Fleet Simulator for {len(self.vehicles)} vehicles...")
        while True:
            self.run_cycle()
            time.sleep(interval)
