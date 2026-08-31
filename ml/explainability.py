import os
import joblib
import numpy as np
import pandas as pd
import shap

class MLModelExplainer:
    def __init__(self, model_path=None):
        if not model_path:
            model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
            
        if os.path.exists(model_path):
            self.artifacts = joblib.load(model_path)
            self.clf = self.artifacts["classifier"]
            self.reg = self.artifacts["regressor"]
            self.feature_names = self.artifacts["feature_names"]
            self.explainer = shap.TreeExplainer(self.clf)
        else:
            self.artifacts = None
            self.clf = None
            self.reg = None
            self.feature_names = ["speed", "engine_temp", "rpm", "fuel_level", "battery_voltage", "harsh_braking_count", "idle_time"]
            self.explainer = None

    def predict_and_explain(self, telemetry_dict):
        """Returns risk score, remaining days to failure, and SHAP feature importance breakdown."""
        # Convert input dict to dataframe with feature names
        input_data = pd.DataFrame([{
            "speed": float(telemetry_dict.get("speed", 60.0)),
            "engine_temp": float(telemetry_dict.get("engine_temp", 85.0)),
            "rpm": float(telemetry_dict.get("rpm", 2200)),
            "fuel_level": float(telemetry_dict.get("fuel_level", 80.0)),
            "battery_voltage": float(telemetry_dict.get("battery_voltage", 13.8)),
            "harsh_braking_count": int(telemetry_dict.get("harsh_braking_count", 0)),
            "idle_time": int(telemetry_dict.get("idle_time", 0))
        }])[self.feature_names]

        if not self.clf:
            # Fallback heuristic calculation if model un-trained
            temp = float(telemetry_dict.get("engine_temp", 85.0))
            volt = float(telemetry_dict.get("battery_voltage", 13.8))
            risk = 0.15
            if temp > 105 or volt < 11.0:
                risk = 0.88
            elif temp > 95 or volt < 12.0:
                risk = 0.55
            days = max(1.0, round(30.0 * (1.0 - risk), 1))
            return {
                "failure_risk_score": round(risk, 4),
                "predicted_days_to_failure": days,
                "shap_explanations": [
                    {"feature": "engine_temp", "impact_pct": 55.0, "value": temp},
                    {"feature": "battery_voltage", "impact_pct": 30.0, "value": volt},
                    {"feature": "rpm", "impact_pct": 15.0, "value": float(telemetry_dict.get("rpm", 2200))}
                ]
            }

        # Predict with trained ML models
        risk_score = float(self.clf.predict_proba(input_data)[0, 1])
        predicted_days = float(max(0.5, self.reg.predict(input_data)[0]))

        # Calculate SHAP feature values for this specific row
        shap_vals = self.explainer.shap_values(input_data)[0]
        abs_shap = np.abs(shap_vals)
        total_shap = np.sum(abs_shap) if np.sum(abs_shap) > 0 else 1.0

        explanations = []
        for feat, val, s_val in zip(self.feature_names, input_data.iloc[0], shap_vals):
            pct = round((abs(s_val) / total_shap) * 100.0, 1)
            explanations.append({
                "feature": feat,
                "value": float(val),
                "shap_value": round(float(s_val), 4),
                "impact_pct": pct
            })

        # Sort by impact percentage descending
        explanations.sort(key=lambda x: x["impact_pct"], reverse=True)

        return {
            "failure_risk_score": round(risk_score, 4),
            "predicted_days_to_failure": round(predicted_days, 1),
            "shap_explanations": explanations
        }
