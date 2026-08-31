import random
import math

class FaultInjector:
    """Simulates gradual degradation and component fault scenarios for vehicles."""

    FAULT_TYPES = [
        "ENGINE_OVERHEATING",
        "BATTERY_DECAY",
        "TRANSMISSION_WEAR",
        "FUEL_LEAK"
    ]

    def __init__(self, fault_type=None, degradation_rate=0.02):
        self.fault_type = fault_type if fault_type in self.FAULT_TYPES else random.choice(self.FAULT_TYPES)
        self.degradation_factor = 0.0 # Starts at 0 (healthy), progresses to 1.0 (severe failure)
        self.degradation_rate = degradation_rate

    def step(self):
        """Advances simulated time degradation."""
        self.degradation_factor = min(1.0, self.degradation_factor + self.degradation_rate)

    def apply_faults(self, metrics):
        """Modifies base telemetry metrics according to current degradation level."""
        self.step()
        mod_metrics = dict(metrics)

        if self.fault_type == "ENGINE_OVERHEATING":
            # Engine temperature ramps up from nominal (85°C) to dangerous (115°C+)
            base_temp = mod_metrics.get("engine_temp", 85.0)
            added_temp = self.degradation_factor * 35.0 + random.uniform(-1.0, 2.0)
            mod_metrics["engine_temp"] = round(base_temp + added_temp, 1)

        elif self.fault_type == "BATTERY_DECAY":
            # Voltage drops from nominal (13.8V) down to critical (10.5V)
            base_v = mod_metrics.get("battery_voltage", 13.8)
            drop_v = self.degradation_factor * 3.3 + random.uniform(-0.1, 0.1)
            mod_metrics["battery_voltage"] = round(max(9.5, base_v - drop_v), 2)

        elif self.fault_type == "TRANSMISSION_WEAR":
            # RPM volatility and high erratic spikes
            base_rpm = mod_metrics.get("rpm", 2200)
            rpm_spike = self.degradation_factor * 1800 + random.randint(-200, 500)
            mod_metrics["rpm"] = int(min(6500, base_rpm + rpm_spike))

        elif self.fault_type == "FUEL_LEAK":
            # Rapid fuel depletion rate
            base_fuel = mod_metrics.get("fuel_level", 75.0)
            extra_drop = self.degradation_factor * 1.5
            mod_metrics["fuel_level"] = round(max(0.0, base_fuel - extra_drop), 1)

        return mod_metrics
