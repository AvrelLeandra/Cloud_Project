import json
import logging
import os
import joblib
import pandas as pd
from explainability import MLModelExplainer

explainer = None

def init():
    """Azure ML Managed Online Endpoint Initialization Hook."""
    global explainer
    model_path = os.path.join(os.getenv("AZUREML_MODEL_DIR", "."), "model.joblib")
    explainer = MLModelExplainer(model_path=model_path)
    logging.info("Azure ML Scoring Endpoint Initialized.")

def run(raw_data):
    """Azure ML Scoring Endpoint Request Handler."""
    try:
        data = json.loads(raw_data)
        if isinstance(data, list):
            results = [explainer.predict_and_explain(item) for item in data]
            return json.dumps({"predictions": results})
        else:
            result = explainer.predict_and_explain(data)
            return json.dumps(result)
    except Exception as e:
        error = str(e)
        logging.error(f"Error scoring request: {error}")
        return json.dumps({"error": error})
