import os
import sys
import time
import subprocess
import threading

def start_backend():
    port = int(os.getenv("PORT", 8000))
    print(f"Starting FastAPI Server on http://0.0.0.0:{port}...")
    subprocess.run([sys.executable, "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", str(port)], cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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
