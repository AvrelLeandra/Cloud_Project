import os
import sys
import time
import subprocess
import threading

def start_backend():
    print("Starting FastAPI Local Server on http://127.0.0.1:8000...")
    subprocess.run([sys.executable, "-m", "uvicorn", "api.main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def start_simulator():
    time.sleep(3) # Wait for backend startup
    print("Starting Fleet Telemetry Simulator...")
    subprocess.run([sys.executable, "simulator/vehicle_simulator.py"], cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if __name__ == "__main__":
    print("==========================================================================")
    print(" SMART FLEET TELEMETRY & PREDICTIVE MAINTENANCE PLATFORM (LOCAL RUNNER) ")
    print("==========================================================================")
    
    t_backend = threading.Thread(target=start_backend, daemon=True)
    t_backend.start()

    t_sim = threading.Thread(target=start_simulator, daemon=True)
    t_sim.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Smart Fleet Local Runner...")
