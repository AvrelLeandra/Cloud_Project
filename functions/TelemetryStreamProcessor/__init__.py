import logging
import json
import os
import requests
import azure.functions as func

ML_INFERENCE_ENDPOINT = os.getenv("ML_INFERENCE_ENDPOINT", "http://127.0.0.1:8000/api/ml/predict")
LOGIC_APP_ALERT_WEBHOOK = os.getenv("LOGIC_APP_ALERT_WEBHOOK", "")

def main(event: func.EventHubEvent, cosmosOutput: func.Out[func.Document]) -> None:
    logging.info(f"TelemetryStreamProcessor processing batch of events...")
    
    output_documents = []
    
    for item in event:
        try:
            body = item.get_body().decode('utf-8')
            telemetry = json.loads(body)
            
            # Request real-time failure prediction score from ML Endpoint
            risk_score = 0.15
            days_to_failure = 30
            try:
                ml_resp = requests.post(ML_INFERENCE_ENDPOINT, json=telemetry, timeout=1)
                if ml_resp.status_code == 200:
                    ml_data = ml_resp.json()
                    risk_score = ml_data.get("failure_risk_score", risk_score)
                    days_to_failure = ml_data.get("predicted_days_to_failure", days_to_failure)
            except Exception as ml_err:
                logging.warning(f"ML endpoint call fallback: {ml_err}")

            telemetry["failure_risk_score"] = risk_score
            telemetry["predicted_days_to_failure"] = days_to_failure

            # Threshold Breach Alert Check
            if risk_score > 0.75 or telemetry.get("engine_temp", 0) > 105.0:
                telemetry["alert_active"] = True
                telemetry["alert_severity"] = "CRITICAL" if risk_score > 0.85 else "WARNING"
                
                # Trigger Azure Logic App Alert Workflow if configured
                if LOGIC_APP_ALERT_WEBHOOK:
                    try:
                        requests.post(LOGIC_APP_ALERT_WEBHOOK, json={
                            "vehicle_id": telemetry.get("vehicle_id"),
                            "alert_type": "HIGH_FAILURE_RISK",
                            "severity": telemetry["alert_severity"],
                            "failure_risk_score": risk_score,
                            "details": f"Engine Temp: {telemetry.get('engine_temp')}°C, Voltage: {telemetry.get('battery_voltage')}V"
                        }, timeout=2)
                    except Exception as e:
                        logging.error(f"Logic App trigger failed: {e}")
            else:
                telemetry["alert_active"] = False

            output_documents.append(json.dumps(telemetry))

        except Exception as err:
            logging.error(f"Error processing telemetry event: {err}")

    if output_documents:
        cosmosOutput.set(func.DocumentList(output_documents))
