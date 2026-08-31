import React, { useState, useEffect, useRef } from 'react';

const INDIA_CENTER = [20.5937, 78.9629];

// Detailed Indian National Highway (NH) Road Network Waypoints
const HIGHWAY_ROUTES = {
  "Delhi Logistics Park->Mumbai Terminal 2": [
    [28.6139, 77.2090], [28.4595, 77.0266], [27.8188, 76.2750], [26.9124, 75.7873],
    [26.4499, 74.6399], [25.2138, 73.8340], [24.5854, 73.7125], [23.5461, 73.1812],
    [23.0225, 72.5714], [22.3072, 73.1812], [21.1702, 72.8311], [20.3712, 72.9033],
    [19.2183, 72.9781], [19.0760, 72.8777]
  ],
  "Mumbai JNPT Port->Ahmedabad Inland Depot": [
    [19.0760, 72.8777], [19.2183, 72.9781], [20.3712, 72.9033], [21.1702, 72.8311],
    [22.3072, 73.1812], [23.0225, 72.5714]
  ],
  "Bengaluru Electronic City->Chennai Harbour": [
    [12.9716, 77.5946], [12.7409, 77.8253], [12.5266, 78.2146], [12.9165, 79.1325],
    [12.9692, 79.9410], [13.0827, 80.2707]
  ],
  "Hyderabad Cargo Hub->Nagpur Logistic Center": [
    [17.3850, 78.4867], [18.6878, 78.1462], [19.6641, 78.5320], [20.2248, 78.8953],
    [21.1458, 79.0882]
  ],
  "Kolkata Port Terminal->Bhubaneswar Depot": [
    [22.5726, 88.3639], [22.3460, 87.2320], [21.4934, 86.9135], [20.8354, 86.3312],
    [20.4625, 85.8828], [20.2961, 85.8245]
  ],
  "Jaipur Industrial Zone->Delhi NCR Hub": [
    [26.9124, 75.7873], [27.8188, 76.2750], [28.4595, 77.0266], [28.6139, 77.2090]
  ],
  "Chennai Port Trust->Vijayawada Hub": [
    [13.0827, 80.2707], [14.4426, 79.9865], [15.5057, 80.0499], [16.5062, 80.6480]
  ],
  "Surat Textile Hub->Pune Industrial Area": [
    [21.1702, 72.8311], [20.3712, 72.9033], [19.2183, 72.9781], [18.5204, 73.8567]
  ],
  "Pune Auto Cluster->Goa Logistics Terminal": [
    [18.5204, 73.8567], [17.6805, 74.0183], [16.7050, 74.2433], [15.8497, 74.4977],
    [15.2993, 74.1240]
  ],
  "Ahmedabad GIDC->Udaipur Freight Station": [
    [23.0225, 72.5714], [23.5461, 73.1812], [24.5854, 73.7125]
  ],
  "Hubballi Cargo Yard->Bengaluru Peenya": [
    [15.3647, 75.1240], [14.4644, 75.9218], [13.3379, 77.1173], [12.9716, 77.5946]
  ],
  "Nagpur Central Logistics->Bhopal Cargo Depot": [
    [21.1458, 79.0882], [21.8541, 77.9033], [22.8450, 77.4126], [23.2599, 77.4126]
  ],
  "Vijayawada Auto Nagar->Visakhapatnam Port": [
    [16.5062, 80.6480], [17.0005, 81.8040], [17.6868, 83.2185]
  ],
  "Bhubaneswar Cargo City->Kolkata Dock Yard": [
    [20.2961, 85.8245], [20.4625, 85.8828], [21.4934, 86.9135], [22.3460, 87.2320],
    [22.5726, 88.3639]
  ],
  "Udaipur Marble Zone->Jaipur Transport Hub": [
    [24.5854, 73.7125], [25.2138, 73.8340], [26.4499, 74.6399], [26.9124, 75.7873]
  ]
};

// Helper: Compute exact point along route waypoints at given progress percentage (0.0 to 1.0)
function getPolylinePoint(waypoints, pct) {
  if (!waypoints || waypoints.length === 0) return INDIA_CENTER;
  if (waypoints.length === 1) return waypoints[0];
  
  const clampedPct = Math.max(0.08, Math.min(0.92, pct));
  
  const segments = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = Math.hypot(waypoints[i+1][0] - waypoints[i][0], waypoints[i+1][1] - waypoints[i][1]);
    segments.push(d);
    totalLen += d;
  }
  
  let targetLen = clampedPct * totalLen;
  let accumulated = 0;
  
  for (let i = 0; i < segments.length; i++) {
    if (accumulated + segments[i] >= targetLen) {
      const segPct = segments[i] > 0 ? (targetLen - accumulated) / segments[i] : 0;
      const p1 = waypoints[i];
      const p2 = waypoints[i+1];
      const lat = p1[0] + (p2[0] - p1[0]) * segPct;
      const lon = p1[1] + (p2[1] - p1[1]) * segPct;
      return [lat, lon];
    }
    accumulated += segments[i];
  }
  
  return waypoints[waypoints.length - 1];
}

// Clean SVG Icons
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  LiveMap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
  ),
  FleetOps: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
  ),
  EmergencyDispatch: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
  ),
  AnalyticsReports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
  ),
  AIAssistant: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
  ),
  Sparkles: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c.132 0 .263 0 .393 0A9 9 0 0 1 21 12c0 .132 0 .263 0 .393A9 9 0 0 1 12 21c-.132 0-.263 0-.393 0A9 9 0 0 1 3 12c0-.132 0-.263 0-.393A9 9 0 0 1 12 3z"></path><path d="M12 8v8M8 12h8"></path></svg>
  ),
  Alerts: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  ),
  Speedometer: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  Fuel: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="15" y2="22"></line><line x1="4" y1="9" x2="14" y2="9"></line><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path></svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  DigitalTwin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  )
};

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Persistent Selected Live Map Vehicle ID State & Ref
  const [selectedLiveMapVehicleId, setSelectedLiveMapVehicleId] = useState(null);
  const selectedLiveMapVehicleIdRef = useRef(null);

  const [vehicleDetail, setVehicleDetail] = useState(null);
  
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [fleetSubTab, setFleetSubTab] = useState('Vehicles');
  const [analyticsSubTab, setAnalyticsSubTab] = useState('Trends');

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [reportModalData, setReportModalData] = useState(null);

  // Realistic Service Lifecycle State
  const [ongoingServices, setOngoingServices] = useState({});
  const [dispatchLogs, setDispatchLogs] = useState([
    {
      dispatch_id: "DSP-84912",
      vehicle_id: "IND-VEH-102",
      alert_type: "Thermal Overheat (109.5°C)",
      service_action: "Dispatch Emergency Coolant & Repair Team",
      status: "COMPLETED ✅",
      timestamp: "10:14 AM"
    },
    {
      dispatch_id: "DSP-71203",
      vehicle_id: "IND-VEH-108",
      alert_type: "Rash Driving Violation (92.0 km/h)",
      service_action: "Remote Lock Speed Governor to 60 km/h",
      status: "COMPLETED ✅",
      timestamp: "10:08 AM"
    }
  ]);
  const [toastMessage, setToastMessage] = useState(null);

  // AI Query state
  const [nlPrompt, setNlPrompt] = useState('');
  const [nlResponse, setNlResponse] = useState(null);
  const [nlLoading, setNlLoading] = useState(false);

  // Map state
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const selectedPolylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const finishMarkerRef = useRef(null);
  const movingVehicleMarkerRef = useRef(null);

  const selectLiveMapVehicle = (vid) => {
    setSelectedLiveMapVehicleId(vid);
    selectedLiveMapVehicleIdRef.current = vid;
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const vResp = await fetch('/api/vehicles');
      if (vResp.ok) {
        const vData = await vResp.json();
        const loadedVehicles = vData.vehicles || [];
        setVehicles(loadedVehicles);

        if (!selectedLiveMapVehicleIdRef.current && loadedVehicles.length > 0) {
          selectLiveMapVehicle(loadedVehicles[0].vehicle_id);
        }
      }

      const kResp = await fetch('/api/fleet/kpis');
      if (kResp.ok) {
        const kData = await kResp.json();
        setKpis(kData);
      }

      const dResp = await fetch('/api/drivers/scores');
      if (dResp.ok) {
        const dData = await dResp.json();
        setDrivers(dData.driver_scores || []);
      }
    } catch (e) {
      console.warn("Backend API polling:", e);
    }
  };

  useEffect(() => {
    if (!selectedVehicleId) return;
    fetch(`/api/vehicles/${selectedVehicleId}`)
      .then(res => res.json())
      .then(data => setVehicleDetail(data))
      .catch(err => console.error("Error fetching vehicle detail:", err));
  }, [selectedVehicleId]);

  const selectedLiveMapVehicle = vehicles.find(v => v.vehicle_id === selectedLiveMapVehicleId) || vehicles[0];

  // Dispatch Emergency Alert Service Handler (REALISTIC TIMED LIFECYCLE)
  const handleAlertServiceDispatch = async (vehicleId, alertType, serviceAction) => {
    try {
      const dispatchId = `DSP-${Math.floor(10000 + Math.random() * 90000)}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Step 1: Immediately set ONGOING SERVICE (Vehicle en route to station / service team dispatched)
      const ongoingLog = {
        dispatch_id: dispatchId,
        vehicle_id: vehicleId,
        alert_type: alertType,
        service_action: serviceAction,
        status: "ONGOING SERVICE 🚚",
        timestamp: timeStr
      };

      setDispatchLogs(prev => [ongoingLog, ...prev]);
      setOngoingServices(prev => ({ ...prev, [vehicleId]: serviceAction }));
      setToastMessage(`🚚 Ongoing Service: Vehicle ${vehicleId} rerouting to nearest fuel station... (ETA ~6s)`);

      await fetch('/api/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          alert_type: alertType,
          service_action: serviceAction,
          status: "ONGOING"
        })
      });

      // Step 2: Realistic Delay (6 Seconds simulating vehicle travel to station & refueling/service completion)
      setTimeout(async () => {
        const res = await fetch('/api/alerts/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_id: vehicleId,
            alert_type: alertType,
            service_action: serviceAction,
            status: "COMPLETED"
          })
        });
        await res.json();

        // Step 3: Transition to COMPLETED upon arrival at fuel station!
        setDispatchLogs(prev => prev.map(log => log.dispatch_id === dispatchId ? { ...log, status: "COMPLETED ✅" } : log));
        setOngoingServices(prev => {
          const next = { ...prev };
          delete next[vehicleId];
          return next;
        });

        setToastMessage(`✅ Service Completed: Vehicle ${vehicleId} arrived at fuel station & refueled to 100%! (${dispatchId})`);

        setVehicles(prevVehicles => prevVehicles.map(v => {
          if (v.vehicle_id === vehicleId) {
            const actLower = serviceAction.toLowerCase();
            const isFuel = actLower.includes("fuel") || actLower.includes("refuel") || actLower.includes("station");
            const isTemp = actLower.includes("coolant") || actLower.includes("temp") || actLower.includes("pull-over");
            const isSpeed = actLower.includes("speed") || actLower.includes("governor") || actLower.includes("warning");
            const isBattery = actLower.includes("battery") || actLower.includes("alternator");

            return {
              ...v,
              fuel_level: isFuel ? 100.0 : v.fuel_level,
              engine_temp: isTemp ? 86.0 : v.engine_temp,
              speed: isSpeed ? 55.0 : v.speed,
              battery_voltage: isBattery ? 13.8 : v.battery_voltage,
              failure_risk_score: 0.12,
              alert_active: false,
              geofence_breach: false
            };
          }
          return v;
        }));

        setTimeout(() => setToastMessage(null), 4000);
        fetchData();
      }, 6000);

    } catch (e) {
      console.error("Alert service dispatch error:", e);
    }
  };

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeNav !== 'Dashboard' && activeNav !== 'Live Map') return;
    if (!window.L) return;

    const containerId = activeNav === 'Live Map' ? 'map-container-fullscreen' : 'map-container-dashboard';
    const containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
      selectedPolylineRef.current = null;
      startMarkerRef.current = null;
      finishMarkerRef.current = null;
      movingVehicleMarkerRef.current = null;
    }

    const map = window.L.map(containerId, {
      center: INDIA_CENTER,
      zoom: 5,
      zoomControl: true
    });

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO & OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 200);

  }, [activeNav]);

  // Dashboard Map Markers ONLY (Renders all 15 vehicles strictly on Dashboard view)
  useEffect(() => {
    if (activeNav !== 'Dashboard' || !mapInstanceRef.current || !window.L) return;

    const bounds = [];
    const currentMarkers = markersRef.current;

    vehicles.forEach(v => {
      const lat = v.latitude;
      const lon = v.longitude;
      if (!lat || !lon) return;

      bounds.push([lat, lon]);
      const risk = v.failure_risk_score || 0.15;
      const isBreached = v.geofence_breach;
      const isLowFuel = v.fuel_level < 15.0;
      const isOverspeed = v.speed > 80.0;
      const isCritical = risk > 0.60 || (v.engine_temp && v.engine_temp > 100) || isBreached || isLowFuel || isOverspeed;
      const isWarning = !isCritical && (risk > 0.35 || (v.engine_temp && v.engine_temp > 90));

      const haloColor = isCritical ? '#ef4444' : (isWarning ? '#f59e0b' : '#2dd4bf');

      const customIcon = window.L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${haloColor}; opacity: 0.35; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; width: 16px; height: 16px; border-radius: 50%; background-color: ${haloColor}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${haloColor};"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const popupHtml = `
        <div style="padding: 4px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #2dd4bf; font-size: 14px;">${v.vehicle_id}</strong>
            <span style="background: ${haloColor}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: bold;">
              ${(risk * 100).toFixed(0)}% Risk
            </span>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; line-height: 1.6;">
            <strong>Driver:</strong> ${v.driver_name} (${v.model})<br/>
            <strong>Route:</strong> ${v.start_location} → ${v.destination}<br/>
            <strong>ETA:</strong> <strong style="color:#2dd4bf">${v.eta}</strong><br/>
            <strong>Speed:</strong> ${v.speed} km/h | <strong>Fuel:</strong> ${v.fuel_level}%<br/>
            <strong>Engine Temp:</strong> ${v.engine_temp}°C
          </div>
        </div>
      `;

      if (currentMarkers[v.vehicle_id]) {
        currentMarkers[v.vehicle_id].setLatLng([lat, lon]);
        currentMarkers[v.vehicle_id].setIcon(customIcon);
        currentMarkers[v.vehicle_id].getPopup().setContent(popupHtml);
      } else {
        const marker = window.L.marker([lat, lon], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupHtml);
        
        marker.on('click', () => {
          setSelectedVehicleId(v.vehicle_id);
          selectLiveMapVehicle(v.vehicle_id);
        });
        currentMarkers[v.vehicle_id] = marker;
      }
    });

    if (bounds.length > 0 && !mapInstanceRef.current._hasFitBounds) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      mapInstanceRef.current._hasFitBounds = true;
    }

  }, [vehicles, activeNav]);

  // LIVE MAP VIEW: Green Pulsating Start Node, Red Pulsating Finish Node, & STRICTLY Interpolated Moving Vehicle Node
  useEffect(() => {
    if (activeNav !== 'Live Map' || !selectedLiveMapVehicle || !mapInstanceRef.current || !window.L) return;

    // Remove previous layers
    if (selectedPolylineRef.current) {
      mapInstanceRef.current.removeLayer(selectedPolylineRef.current);
      selectedPolylineRef.current = null;
    }
    if (startMarkerRef.current) {
      mapInstanceRef.current.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (finishMarkerRef.current) {
      mapInstanceRef.current.removeLayer(finishMarkerRef.current);
      finishMarkerRef.current = null;
    }
    if (movingVehicleMarkerRef.current) {
      mapInstanceRef.current.removeLayer(movingVehicleMarkerRef.current);
      movingVehicleMarkerRef.current = null;
    }

    const routeKey = `${selectedLiveMapVehicle.start_location}->${selectedLiveMapVehicle.destination}`;
    let roadWaypoints = HIGHWAY_ROUTES[routeKey];

    if (!roadWaypoints) {
      roadWaypoints = [
        [selectedLiveMapVehicle.latitude - 1.2, selectedLiveMapVehicle.longitude - 0.8],
        [selectedLiveMapVehicle.latitude - 0.5, selectedLiveMapVehicle.longitude - 0.3],
        [selectedLiveMapVehicle.latitude, selectedLiveMapVehicle.longitude],
        [selectedLiveMapVehicle.latitude + 0.6, selectedLiveMapVehicle.longitude + 0.4],
        [selectedLiveMapVehicle.latitude + 1.3, selectedLiveMapVehicle.longitude + 0.9]
      ];
    }

    const startPos = roadWaypoints[0];
    const finishPos = roadWaypoints[roadWaypoints.length - 1];

    // Compute vehicle index to calculate smooth progress along route (between 20% and 75% of route)
    const vIndex = parseInt(selectedLiveMapVehicle.vehicle_id.replace(/\D/g, '')) || 101;
    const progressFactor = ((vIndex * 17) % 55 + 20) / 100.0;
    const movingCoords = getPolylinePoint(roadWaypoints, progressFactor);

    // Smooth Emerald Highway Polyline
    const polyline = window.L.polyline(roadWaypoints, {
      color: '#10b981',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(mapInstanceRef.current);

    selectedPolylineRef.current = polyline;

    // GREEN PULSATING RING START POINTER NODE
    const startPulseIcon = window.L.divIcon({
      className: 'start-pulsating-node',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="START: ${selectedLiveMapVehicle.start_location}">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #10b981; opacity: 0.45; animation: pulse 1.8s infinite;"></div>
          <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background-color: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 14px #10b981;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // RED PULSATING RING FINISH POINTER NODE
    const finishPulseIcon = window.L.divIcon({
      className: 'finish-pulsating-node',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="DESTINATION: ${selectedLiveMapVehicle.destination}">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #ef4444; opacity: 0.45; animation: pulse 1.8s infinite;"></div>
          <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background-color: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 0 14px #ef4444;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // LIVE MOVING VEHICLE MARKER (CYAN PULSATING TRUCK NODE - GUARANTEED 100% ON THE GREEN LINE)
    const movingIcon = window.L.divIcon({
      className: 'moving-vehicle-node',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="${selectedLiveMapVehicle.vehicle_id} (${selectedLiveMapVehicle.speed} km/h)">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #2dd4bf; opacity: 0.5; animation: pulse 1.5s infinite;"></div>
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: #0d3633; border: 2px solid #2dd4bf; box-shadow: 0 0 16px #2dd4bf; display: flex; align-items: center; justify-content: center; font-size: 11px;">🚛</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    startMarkerRef.current = window.L.marker(startPos, { icon: startPulseIcon }).addTo(mapInstanceRef.current)
      .bindTooltip(`START: ${selectedLiveMapVehicle.start_location}`, { permanent: false, direction: 'top' });
    
    finishMarkerRef.current = window.L.marker(finishPos, { icon: finishPulseIcon }).addTo(mapInstanceRef.current)
      .bindTooltip(`DESTINATION: ${selectedLiveMapVehicle.destination}`, { permanent: false, direction: 'top' });

    movingVehicleMarkerRef.current = window.L.marker(movingCoords, { icon: movingIcon }).addTo(mapInstanceRef.current)
      .bindTooltip(`LIVE: ${selectedLiveMapVehicle.vehicle_id} (${selectedLiveMapVehicle.speed} km/h)`, { permanent: false, direction: 'top' });

    // Auto-fit route bounds
    const routeBounds = window.L.latLngBounds([startPos, movingCoords, finishPos]);
    mapInstanceRef.current.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 8 });

  }, [selectedLiveMapVehicleId, vehicles, activeNav]);

  // Fault Injector Helper
  const triggerFaultInjection = async (vehicleId, type) => {
    try {
      const isGeofence = (type === 'GEOFENCE');
      const isOverheat = (type === 'OVERHEAT');
      const isVoltage = (type === 'VOLTAGE');
      const isLowFuel = (type === 'LOW_FUEL');
      const isRash = (type === 'RASH');

      await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: [{
            vehicle_id: vehicleId,
            driver_name: "Rajesh Kumar",
            model: "Tata Signa 5530.S",
            latitude: isGeofence ? 32.5000 : 28.6139,
            longitude: isGeofence ? 72.1000 : 77.2090,
            speed: isRash ? 96.5 : 55.0,
            engine_temp: isOverheat ? 114.5 : 87.5,
            rpm: isRash ? 4800 : 2150,
            fuel_level: isLowFuel ? 8.5 : 65.0,
            battery_voltage: isVoltage ? 10.1 : 13.8,
            harsh_braking_count: isRash ? 7 : 1,
            idle_km: 14.2,
            geofence_breach: isGeofence,
            is_faulty: true
          }]
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await fetch('/api/reports/generate');
      const data = await res.json();
      setReportModalData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNLQuery = async (queryText) => {
    const promptToUse = queryText || nlPrompt;
    if (!promptToUse.trim()) return;
    setNlLoading(true);
    try {
      const res = await fetch('/api/query/nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse })
      });
      const data = await res.json();
      setNlResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setNlLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.driver_name.toLowerCase().includes(searchQuery.toLowerCase());
    const risk = v.failure_risk_score || 0.15;
    const isAlert = risk > 0.40 || v.engine_temp > 92 || v.fuel_level < 15.0 || v.speed > 80.0 || v.geofence_breach;
    if (filterStatus === 'CRITICAL') return matchesSearch && isAlert;
    if (filterStatus === 'HEALTHY') return matchesSearch && !isAlert;
    return matchesSearch;
  });

  // Filter vehicles specifically with active alerts for Emergency Dispatch tab
  const alertVehicles = vehicles.filter(v => {
    const risk = v.failure_risk_score || 0.15;
    return risk > 0.40 || v.engine_temp > 95 || v.fuel_level < 15.0 || v.speed > 80.0 || v.geofence_breach || v.battery_voltage < 11.5;
  });

  const healthyCount = kpis?.healthy_count ?? 9;
  const warningCount = kpis?.warning_count ?? 4;
  const criticalCount = kpis?.active_alerts ?? 2;
  const totalCount = kpis?.total_vehicles ?? 15;

  return (
    <div style={styles.appContainer}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.4); opacity: 0.15; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .ai-btn-glow {
          box-shadow: 0 0 15px rgba(45, 212, 191, 0.35);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ai-btn-glow:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 25px rgba(45, 212, 191, 0.6);
        }
        .dispatch-action-btn {
          background: #081414;
          border: 1px solid #14615a;
          color: #2dd4bf;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dispatch-action-btn:hover {
          background: linear-gradient(135deg, #0d4b47, #14615a);
          color: #ffffff;
          border-color: #2dd4bf;
          box-shadow: 0 0 12px rgba(45, 212, 191, 0.4);
        }
      `}</style>

      {/* TOAST NOTIFICATION BADGE */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: 'rgba(13, 75, 71, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #2dd4bf',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: '700',
          fontSize: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* LEFT NAVIGATION SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogoBox}>
            <Icons.FleetOps />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#2dd4bf', letterSpacing: '0.5px' }}>FLEET TELEMETRY</h2>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Real-time Operations</p>
          </div>
        </div>

        {/* CONSOLIDATED SIDEBAR NAVIGATION */}
        <nav style={styles.navMenu}>
          {[
            { id: 'Dashboard', Icon: Icons.Dashboard },
            { id: 'Live Map', Icon: Icons.LiveMap },
            { id: 'Fleet Operations', Icon: Icons.FleetOps, badge: vehicles.length },
            { id: 'Emergency Dispatch', Icon: Icons.EmergencyDispatch, badge: alertVehicles.length > 0 ? alertVehicles.length : null, badgeColor: '#ef4444' },
            { id: 'Analytics & Reports', Icon: Icons.AnalyticsReports },
            { id: 'AI Assistant', Icon: Icons.AIAssistant }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={styles.navItem(activeNav === item.id)}
            >
              <item.Icon />
              <span style={{ flex: 1 }}>{item.id}</span>
              {item.badge && (
                <span style={{
                  ...styles.navBadge,
                  background: item.badgeColor ? `${item.badgeColor}30` : '#0d3633',
                  color: item.badgeColor || '#2dd4bf',
                  border: `1px solid ${item.badgeColor || '#14615a'}`
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.profileAvatar}>AS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#ffffff' }}>Alex Smith</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Fleet Controller</div>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>›</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={styles.mainContent}>
        {/* Top Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Fleet Telemetry <span style={{ color: '#2dd4bf' }}>Intelligence Hub</span></h1>
            <p style={styles.pageSubtitle}>Real-time telemetry, IoT streaming & predictive maintenance</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.liveBadge}>
              <span style={styles.liveDot}></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#2dd4bf', letterSpacing: '0.5px' }}>LIVE TELEMETRY PIPELINE</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>• 15 Vehicles</span>
            </div>
            <button style={styles.headerIconBtn}>☀️</button>
            <button style={styles.headerIconBtn}>
              <Icons.Alerts />
              <span style={styles.notifBadge}>{alertVehicles.length}</span>
            </button>
            <button style={styles.headerIconBtn}>🎛️</button>
          </div>
        </header>

        {/* VIEW 1: DASHBOARD */}
        {activeNav === 'Dashboard' && (
          <>
            {/* 4 TOP KPI SUMMARY CARDS */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <div style={styles.iconCircle('#0d3633', '#2dd4bf')}><Icons.FleetOps /></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.kpiLabel}>ACTIVE VEHICLES</div>
                    <div style={styles.kpiValue}>{totalCount}</div>
                    <div style={styles.pillBadge('#2dd4bf', '#0d3633')}>100% Streaming Live</div>
                  </div>
                </div>
                <div style={styles.waveform('#2dd4bf')}></div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <div style={styles.iconCircle('#3b1111', '#ef4444')}><Icons.Alerts /></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.kpiLabel}>HIGH RISK ALERTS</div>
                    <div style={{ ...styles.kpiValue, color: '#ef4444' }}>{criticalCount}</div>
                    <div style={styles.pillBadge('#ef4444', '#3b1111')}>Immediate Attention</div>
                  </div>
                </div>
                <div style={styles.waveform('#ef4444')}></div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <div style={styles.iconCircle('#0d3633', '#2dd4bf')}><Icons.Speedometer /></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.kpiLabel}>AVERAGE SPEED</div>
                    <div style={styles.kpiValue}>{kpis?.avg_fleet_speed_kmh ?? 58.2} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>km/h</span></div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Normal Traffic Flow</div>
                  </div>
                </div>
                <div style={styles.waveform('#2dd4bf')}></div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <div style={styles.iconCircle('#0d3633', '#2dd4bf')}><Icons.Fuel /></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.kpiLabel}>AVERAGE FUEL RESERVE</div>
                    <div style={styles.kpiValue}>{kpis?.avg_fuel_level_pct ?? 74.8}%</div>
                    <div style={{ fontSize: '11px', color: '#2dd4bf', marginTop: '2px' }}>Above Threshold</div>
                  </div>
                </div>
                <div style={{ background: '#081414', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${kpis?.avg_fuel_level_pct ?? 74.8}%`, height: '100%', background: 'linear-gradient(90deg, #14b8a6, #2dd4bf)' }}></div>
                </div>
              </div>
            </div>

            {/* MIDDLE GRID SECTION: MAP & ACTIVE VEHICLES */}
            <div style={styles.middleGrid}>
              <div style={styles.mapCard}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' }}>PAN-INDIA FLEET TELEMETRY GPS MAP (ALL 15 VEHICLES)</span>
                    <span style={styles.pillBadge('#2dd4bf', '#0d3633')}>Live</span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '11px', alignItems: 'center' }}>
                    <span><span style={{ color: '#2dd4bf' }}>●</span> Normal</span>
                    <span><span style={{ color: '#f59e0b' }}>●</span> Warning</span>
                    <span><span style={{ color: '#ef4444' }}>●</span> Critical</span>
                  </div>
                </div>
                <div id="map-container-dashboard" style={{ height: '360px', width: '100%' }}></div>
              </div>

              {/* Active Vehicles Sidebar Panel */}
              <div style={styles.activeVehiclesCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#ffffff', letterSpacing: '0.5px' }}>ACTIVE VEHICLES</strong>
                    <span style={{ background: '#0d3633', color: '#2dd4bf', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{vehicles.length}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '10px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search vehicle ID or driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {['All', 'Critical', 'Healthy'].map(st => (
                    <button key={st} onClick={() => setFilterStatus(st.toUpperCase())} style={styles.filterChip(filterStatus === st.toUpperCase())}>
                      {st}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '270px', overflowY: 'auto' }}>
                  {filteredVehicles.map(v => {
                    const risk = v.failure_risk_score || 0.15;
                    const isCritical = risk > 0.60 || v.engine_temp > 100 || v.fuel_level < 15.0 || v.speed > 80.0 || v.geofence_breach;
                    const isWarning = !isCritical && (risk > 0.35 || v.engine_temp > 90);
                    const statusColor = isCritical ? '#ef4444' : (isWarning ? '#f59e0b' : '#2dd4bf');

                    return (
                      <div key={v.vehicle_id} onClick={() => setSelectedVehicleId(v.vehicle_id)} style={styles.vehicleRow(v.vehicle_id === selectedVehicleId)}>
                        <div style={styles.rowIconSquare(statusColor)}><Icons.FleetOps /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '12px', color: '#ffffff' }}>{v.vehicle_id}</strong>
                            <span style={styles.riskBadge(statusColor)}>{(risk * 100).toFixed(0)}% Risk</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', margin: '2px 0' }}>{v.driver_name} • {v.model}</div>
                          <div style={{ fontSize: '10px', color: '#2dd4bf' }}>Route: {v.start_location} → {v.destination}</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>ETA: <strong style={{ color: '#ffffff' }}>{v.eta}</strong></span>
                            <span>Fuel: <strong style={{ color: v.fuel_level < 15 ? '#ef4444' : '#ffffff' }}>{v.fuel_level}%</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button onClick={() => { setActiveNav('Fleet Operations'); setFleetSubTab('Vehicles'); }} style={{ background: 'transparent', border: 'none', color: '#2dd4bf', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    View All Vehicles →
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM GRID SECTION */}
            <div style={styles.bottomGrid}>
              <div style={styles.widgetCard}>
                <div style={styles.widgetHeader}>FLEET HEALTH OVERVIEW</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: '10px' }}>
                  <div style={styles.donutRing}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{totalCount}</div>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>Total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                    <div><span style={{ color: '#2dd4bf' }}>●</span> Healthy <strong>{healthyCount} ({((healthyCount/totalCount)*100).toFixed(0)}%)</strong></div>
                    <div><span style={{ color: '#f59e0b' }}>●</span> Warning <strong>{warningCount} ({((warningCount/totalCount)*100).toFixed(0)}%)</strong></div>
                    <div><span style={{ color: '#ef4444' }}>●</span> Critical <strong>{criticalCount} ({((criticalCount/totalCount)*100).toFixed(0)}%)</strong></div>
                  </div>
                </div>
              </div>

              <div style={styles.widgetCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={styles.widgetHeader}>TELEMETRY TRENDS (LIVE)</div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Speed (km/h) ▾</span>
                </div>
                <svg width="100%" height="80" viewBox="0 0 300 80">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0 50 Q 30 20 60 40 T 120 25 T 180 45 T 240 20 T 300 35 L 300 80 L 0 80 Z" fill="url(#areaGradient)" />
                  <path d="M 0 50 Q 30 20 60 40 T 120 25 T 180 45 T 240 20 T 300 35" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="60" cy="40" r="3" fill="#2dd4bf"/>
                  <circle cx="120" cy="25" r="3" fill="#2dd4bf"/>
                  <circle cx="180" cy="45" r="3" fill="#2dd4bf"/>
                  <circle cx="240" cy="20" r="3" fill="#2dd4bf"/>
                </svg>
              </div>

              {/* Diverse Alert Types */}
              <div style={styles.widgetCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={styles.widgetHeader}>RECENT ALERTS</div>
                  <button onClick={() => { setActiveNav('Analytics & Reports'); setAnalyticsSubTab('Alerts'); }} style={styles.linkBtn}>View All</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '115px', overflowY: 'auto' }}>
                  <div style={styles.alertRow('#ef4444')}>
                    <span style={{ color: '#ef4444' }}>⛽</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#ffffff' }}>Dangerously Low Fuel</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>IND-VEH-114 (9.5%) • 1 min ago</div>
                    </div>
                    <span style={styles.pillBadge('#ef4444', '#3b1111')}>Critical</span>
                  </div>
                  <div style={styles.alertRow('#ef4444')}>
                    <span style={{ color: '#ef4444' }}>🚨</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#ffffff' }}>Rash Driving (92.0 km/h)</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>IND-VEH-108 • 4 min ago</div>
                    </div>
                    <span style={styles.pillBadge('#ef4444', '#3b1111')}>Critical</span>
                  </div>
                  <div style={styles.alertRow('#f59e0b')}>
                    <span style={{ color: '#f59e0b' }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#ffffff' }}>High Engine Temp (109°C)</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>IND-VEH-102 • 8 min ago</div>
                    </div>
                    <span style={styles.pillBadge('#f59e0b', '#36240d')}>Warning</span>
                  </div>
                </div>
              </div>

              <div style={styles.widgetCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={styles.widgetHeader}>DRIVER BEHAVIOR SCORE</div>
                  <button onClick={() => { setActiveNav('Fleet Operations'); setFleetSubTab('Driver Behavior'); }} style={styles.linkBtn}>View All</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={styles.arcGauge('#2dd4bf')}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>82</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>/100</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '12px', color: '#ffffff' }}>Good Performance</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Average Fleet Score</div>
                  </div>
                </div>
              </div>

              {/* Fault Simulator */}
              <div style={styles.widgetCard}>
                <div style={styles.widgetHeader}>LIVE ANOMALY SIMULATOR</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginTop: '6px' }}>
                  <button onClick={() => triggerFaultInjection("IND-VEH-114", "LOW_FUEL")} style={styles.demoFaultBtn}>
                    ⛽ Low Fuel Alert (IND-VEH-114)
                  </button>
                  <button onClick={() => triggerFaultInjection("IND-VEH-108", "RASH")} style={styles.demoFaultBtn}>
                    🚨 Rash Driving Alert (IND-VEH-108)
                  </button>
                  <button onClick={() => triggerFaultInjection("IND-VEH-101", "OVERHEAT")} style={styles.demoFaultBtn}>
                    🔥 Engine Overheat (IND-VEH-101)
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* LIVE MAP NAVIGATION VIEW WITH GUARANTEED 100% ROUTE ALIGNMENT */}
        {activeNav === 'Live Map' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', position: 'relative' }}>
            {/* Live Map Vehicle List Sidebar */}
            <div style={{ background: '#0e2221', border: '1px solid #163330', borderRadius: '12px', padding: '14px', height: '620px', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ffffff' }}>Live Pan-India Vehicles ({vehicles.length})</h3>
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: 0 }}>Select a vehicle to view its highway route</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {vehicles.map(v => {
                  const isSelected = selectedLiveMapVehicleId === v.vehicle_id;
                  return (
                    <div
                      key={v.vehicle_id}
                      onClick={() => selectLiveMapVehicle(v.vehicle_id)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: isSelected ? 'linear-gradient(135deg, #0d4b47, #14615a)' : '#081414',
                        border: `1px solid ${isSelected ? '#2dd4bf' : '#163330'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', color: '#ffffff' }}>{v.vehicle_id}</strong>
                        <span style={{ fontSize: '10px', color: '#2dd4bf', fontWeight: 'bold' }}>{v.eta}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#cbd5e1', margin: '2px 0' }}>{v.driver_name} • {v.model}</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                        Route: <span style={{ color: '#2dd4bf' }}>{v.start_location}</span> → <span style={{ color: '#2dd4bf' }}>{v.destination}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map Container & Bottom Information Banner */}
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #163330' }}>
              <div id="map-container-fullscreen" style={{ height: '620px', width: '100%' }}></div>

              {/* Bottom Info Banner */}
              {selectedLiveMapVehicle && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  zIndex: 1000,
                  background: 'rgba(8, 20, 20, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d3633', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.FleetOps />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                        {selectedLiveMapVehicle.vehicle_id} <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'normal' }}>({selectedLiveMapVehicle.driver_name})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Model: {selectedLiveMapVehicle.model} | Speed: <strong>{selectedLiveMapVehicle.speed} km/h</strong> | Fuel: <strong>{selectedLiveMapVehicle.fuel_level}%</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>START LOCATION</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>{selectedLiveMapVehicle.start_location}</div>
                    </div>
                    <div style={{ color: '#10b981', fontSize: '16px' }}>➔</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>DESTINATION</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>{selectedLiveMapVehicle.destination}</div>
                    </div>
                    <div style={{ background: '#0d3633', border: '1px solid #14615a', padding: '6px 14px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', fontWeight: '700', color: '#10b981', letterSpacing: '0.5px' }}>ESTIMATED TIME OF TRAVEL</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>{selectedLiveMapVehicle.eta}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW NAVIGATION SECTION: EMERGENCY & SERVICE DISPATCH */}
        {activeNav === 'Emergency Dispatch' && (
          <div style={styles.widgetCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #163330', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: '800' }}>Emergency & Service Dispatch Center</h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>Active fleet alert monitoring and targeted service unit dispatch pipeline</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ background: '#3b1111', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '800' }}>
                  {alertVehicles.length} Vehicles Need Service
                </span>
              </div>
            </div>

            {/* Active Alert Vehicles Cards */}
            {alertVehicles.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#081414', borderRadius: '12px', border: '1px solid #163330' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <h3 style={{ color: '#2dd4bf', margin: 0 }}>All Fleet Vehicles Healthy!</h3>
                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>There are currently no active critical alerts requiring emergency service dispatch.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {alertVehicles.map(v => {
                  let alertBadge = { text: "High Failure Risk Alert", icon: "⚠️", color: "#ef4444", bg: "#3b1111" };
                  let serviceOptions = [
                    { action: "Dispatch Emergency Service Van", icon: "🚚" },
                    { action: "Schedule Immediate Depot Inspection", icon: "🔧" }
                  ];

                  if (v.fuel_level < 15.0) {
                    alertBadge = { text: `Dangerously Low Fuel (${v.fuel_level}%)`, icon: "⛽", color: "#ef4444", bg: "#3b1111" };
                    serviceOptions = [
                      { action: "Reroute to Nearest HPCL/BPCL Fuel Station", icon: "📍" },
                      { action: "Dispatch Mobile Fuel Refueler Truck", icon: "🚚" }
                    ];
                  } else if (v.engine_temp > 95.0) {
                    alertBadge = { text: `Thermal Overheat (${v.engine_temp}°C)`, icon: "🔥", color: "#ef4444", bg: "#3b1111" };
                    serviceOptions = [
                      { action: "Dispatch Emergency Coolant & Repair Team", icon: "🧊" },
                      { action: "Command Driver Emergency Pull-Over", icon: "🛑" }
                    ];
                  } else if (v.speed > 80.0) {
                    alertBadge = { text: `Rash Driving Violation (${v.speed} km/h)`, icon: "🚨", color: "#ef4444", bg: "#3b1111" };
                    serviceOptions = [
                      { action: "Issue Immediate Voice Warning to Driver Cab", icon: "📢" },
                      { action: "Remote Lock Speed Governor to 60 km/h", icon: "🔒" }
                    ];
                  } else if (v.battery_voltage < 11.5) {
                    alertBadge = { text: `Battery Voltage Drop (${v.battery_voltage} V)`, icon: "⚡", color: "#f59e0b", bg: "#36240d" };
                    serviceOptions = [
                      { action: "Dispatch Mobile Battery Replacement Unit", icon: "⚡" },
                      { action: "Schedule Alternator Repair at Depot", icon: "🔧" }
                    ];
                  } else if (v.geofence_breach) {
                    alertBadge = { text: "Geofence Corridor Breach", icon: "🌐", color: "#ef4444", bg: "#3b1111" };
                    serviceOptions = [
                      { action: "Transmit GPS Route Recalibration Data", icon: "🗺️" },
                      { action: "Contact Highway Corridor Control Center", icon: "📞" }
                    ];
                  }

                  const isServiceOngoing = ongoingServices[v.vehicle_id];

                  return (
                    <div key={v.vehicle_id} style={{ background: '#081414', border: `1px solid ${isServiceOngoing ? '#f59e0b' : alertBadge.color}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '15px', color: '#ffffff' }}>{v.vehicle_id}</strong>
                          <span style={{ background: isServiceOngoing ? '#36240d' : alertBadge.bg, color: isServiceOngoing ? '#f59e0b' : alertBadge.color, border: `1px solid ${isServiceOngoing ? '#f59e0b' : alertBadge.color}`, padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                            {isServiceOngoing ? "🚚 ONGOING SERVICE" : `${alertBadge.icon} ${alertBadge.text}`}
                          </span>
                        </div>

                        {/* Driver & Telemetry Details */}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', lineHeight: '1.6' }}>
                          Driver: <strong style={{ color: '#ffffff' }}>{v.driver_name}</strong> ({v.model})<br/>
                          Route: <strong style={{ color: '#2dd4bf' }}>{v.start_location} → {v.destination}</strong> (ETA: {v.eta})<br/>
                          Speed: <strong style={{ color: v.speed > 80 ? '#ef4444' : '#ffffff' }}>{v.speed} km/h</strong> | Fuel: <strong style={{ color: v.fuel_level < 15 ? '#ef4444' : '#ffffff' }}>{v.fuel_level}%</strong> | Temp: <strong style={{ color: v.engine_temp > 95 ? '#ef4444' : '#ffffff' }}>{v.engine_temp}°C</strong>
                        </div>
                      </div>

                      {/* Targeted Service Action Buttons OR Ongoing Service Progress Bar */}
                      <div style={{ marginTop: '12px', borderTop: '1px solid #163330', paddingTop: '12px' }}>
                        {isServiceOngoing ? (
                          <div style={{ background: '#1c1508', border: '1px solid #f59e0b', padding: '10px 12px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f59e0b', fontSize: '11px', fontWeight: 'bold' }}>
                              <span style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚙️</span>
                              <span>ONGOING SERVICE: {isServiceOngoing}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                              Vehicle en route to station... Refueling & servicing upon arrival (~6s)
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#2dd4bf', marginBottom: '8px', letterSpacing: '0.5px' }}>SELECT EMERGENCY SERVICE TO DISPATCH:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {serviceOptions.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  className="dispatch-action-btn"
                                  onClick={() => handleAlertServiceDispatch(v.vehicle_id, alertBadge.text, opt.action)}
                                >
                                  <span>{opt.icon}</span>
                                  <span style={{ flex: 1, textAlign: 'left' }}>{opt.action}</span>
                                  <span>➔</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Service Dispatch Audit Log */}
            {dispatchLogs.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #163330', paddingTop: '16px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ffffff' }}>Recent Service Unit Dispatch Audit Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dispatchLogs.map((log, lIdx) => {
                    const isOngoing = log.status.includes("ONGOING");
                    return (
                      <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#081414', padding: '8px 12px', borderRadius: '6px', border: '1px solid #163330', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ background: '#0d3633', color: '#2dd4bf', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{log.dispatch_id}</span>
                          <strong style={{ color: '#ffffff' }}>{log.vehicle_id}</strong>
                          <span style={{ color: '#64748b' }}>• {log.service_action}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            background: isOngoing ? '#36240d' : '#0d3633',
                            color: isOngoing ? '#f59e0b' : '#10b981',
                            border: `1px solid ${isOngoing ? '#f59e0b' : '#10b981'}`,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            fontSize: '10px'
                          }}>
                            {log.status}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '10px' }}>{log.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: FLEET OPERATIONS */}
        {activeNav === 'Fleet Operations' && (
          <div style={styles.widgetCard}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #163330', paddingBottom: '10px', marginBottom: '16px' }}>
              {['Vehicles', 'Driver Behavior', 'Maintenance'].map(sub => (
                <button key={sub} onClick={() => setFleetSubTab(sub)} style={styles.subTabBtn(fleetSubTab === sub)}>
                  {sub}
                </button>
              ))}
            </div>

            {fleetSubTab === 'Vehicles' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff' }}>Pan-India Fleet Inventory ({vehicles.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {vehicles.map(v => (
                    <div key={v.vehicle_id} onClick={() => setSelectedVehicleId(v.vehicle_id)} style={styles.vehicleRow(v.vehicle_id === selectedVehicleId)}>
                      <div style={styles.rowIconSquare('#2dd4bf')}><Icons.FleetOps /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>{v.vehicle_id}</strong>
                          <span style={{ fontSize: '11px', color: '#2dd4bf', fontWeight: 'bold' }}>{v.eta}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{v.driver_name} • {v.model}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          Route: <strong style={{ color: '#ffffff' }}>{v.start_location}</strong> → <strong style={{ color: '#ffffff' }}>{v.destination}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fleetSubTab === 'Driver Behavior' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff' }}>Driver Safety Leaderboard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {drivers.map((d, idx) => (
                    <div key={d.vehicle_id} style={{ background: '#081414', padding: '12px', borderRadius: '8px', border: '1px solid #163330' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#ffffff' }}>#{idx+1} {d.driver_name}</strong>
                        <span style={{ background: '#0d3633', color: '#2dd4bf', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                          {d.safety_score}/100 Score
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', margin: '4px 0' }}>{d.vehicle_id} • Current Speed: <strong style={{ color: '#ffffff' }}>{d.current_speed} km/h</strong></div>
                      <div style={{ fontSize: '11px', color: '#2dd4bf', fontWeight: '600' }}>
                        Idle / Coasting Distance: {d.idle_km} km
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        Harsh Braking Events: {d.harsh_braking_events}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fleetSubTab === 'Maintenance' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff' }}>Predictive Maintenance Schedule</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vehicles.map(v => (
                    <div key={v.vehicle_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#081414', borderRadius: '8px', border: '1px solid #163330' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#ffffff' }}>{v.vehicle_id} ({v.driver_name})</strong>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Route: {v.start_location} → {v.destination}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: v.predicted_days_to_failure < 10 ? '#ef4444' : '#2dd4bf', fontSize: '12px' }}>{v.predicted_days_to_failure} days RUL</strong>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>ETA: {v.eta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: ANALYTICS & REPORTS */}
        {activeNav === 'Analytics & Reports' && (
          <div style={styles.widgetCard}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #163330', paddingBottom: '10px', marginBottom: '16px' }}>
              {['Trends', 'Alerts', 'Reports'].map(sub => (
                <button key={sub} onClick={() => setAnalyticsSubTab(sub)} style={styles.subTabBtn(analyticsSubTab === sub)}>
                  {sub}
                </button>
              ))}
            </div>

            {analyticsSubTab === 'Trends' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff' }}>Fleet Telemetry Analytics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: '#081414', padding: '15px', borderRadius: '8px', border: '1px solid #163330' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Average Speed Index</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2dd4bf', marginTop: '6px' }}>{kpis?.avg_fleet_speed_kmh} km/h</div>
                  </div>
                  <div style={{ background: '#081414', padding: '15px', borderRadius: '8px', border: '1px solid #163330' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Fuel Efficiency Index</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2dd4bf', marginTop: '6px' }}>{kpis?.avg_fuel_level_pct}%</div>
                  </div>
                </div>
              </div>
            )}

            {analyticsSubTab === 'Alerts' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff' }}>Active Alarm Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vehicles.filter(v => v.failure_risk_score > 0.40 || v.engine_temp > 95 || v.fuel_level < 15.0 || v.speed > 80.0 || v.geofence_breach).map(v => {
                    let alertType = "Thermal Warning";
                    if (v.fuel_level < 15.0) alertType = "Dangerously Low Fuel Alert";
                    else if (v.speed > 80.0) alertType = "Rash Driving Overspeed Violation";
                    else if (v.battery_voltage < 11.5) alertType = "Battery Voltage Drop Failure";
                    else if (v.geofence_breach) alertType = "Geofence Corridor Breach";

                    return (
                      <div key={v.vehicle_id} style={styles.alertRow('#ef4444')}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#ffffff', fontSize: '12px' }}>{v.vehicle_id} - {alertType}</strong>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Driver: {v.driver_name} | Route: {v.start_location} → {v.destination} (ETA: {v.eta})
                          </div>
                        </div>
                        <span style={styles.pillBadge('#ef4444', '#3b1111')}>Critical</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analyticsSubTab === 'Reports' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>Automated Diagnostic & Cost Report Generator</h3>
                  <button onClick={handleGenerateReport} style={styles.aiSubmitPillBtn}>
                    📄 Generate Live Report
                  </button>
                </div>
                {reportModalData ? (
                  <div style={{ background: '#081414', padding: '16px', borderRadius: '8px', border: '1px solid #14615a', fontFamily: 'monospace', fontSize: '11px', color: '#2dd4bf', whiteSpace: 'pre-wrap' }}>
                    {reportModalData.summary}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '12px' }}>Click "Generate Live Report" to compile current fleet diagnostic state into an exportable document.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: AI ASSISTANT VIEW */}
        {activeNav === 'AI Assistant' && (
          <div style={styles.aiContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={styles.aiHeaderIcon}>
                <Icons.Sparkles />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>Universal SmartFleet AI Assistant</h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Ask any fleet telemetry question or general cloud & tech topic</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[
                "Show fast moving vehicles",
                "Show low fuel vehicles",
                "Which trucks need service in India?",
                "How does Azure IoT Hub handle telemetry?",
                "What is the weather in New Delhi?"
              ].map((qPill, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => {
                    setNlPrompt(qPill);
                    handleNLQuery(qPill);
                  }}
                  style={styles.samplePill}
                >
                  <Icons.Sparkles />
                  <span>{qPill}</span>
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleNLQuery(); }} style={styles.aiInputWrapper}>
              <div style={{ color: '#2dd4bf', display: 'flex', alignItems: 'center', paddingLeft: '14px' }}>
                <Icons.Sparkles />
              </div>
              <input
                type="text"
                placeholder="Ask about fast moving vehicles, low fuel trucks, cloud tech, or anything..."
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                style={styles.aiInput}
              />
              <button
                type="submit"
                disabled={nlLoading}
                className="ai-btn-glow"
                style={styles.aiSubmitPillBtn}
              >
                {nlLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
                    <span>Querying AI...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Send />
                    <span>Ask AI</span>
                  </div>
                )}
              </button>
            </form>

            {nlResponse && (
              <div style={styles.aiResponseCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: '#2dd4bf', letterSpacing: '0.5px' }}>
                    <Icons.Sparkles />
                    <span>SMARTFLEET AI RESPONSE</span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.6', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                  {nlResponse.response}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #163330' }}>
                  <span>Queried Cosmos DB & AI Intelligence Engine</span>
                  <span>{nlResponse.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* VEHICLE INSPECTION MODAL */}
      {selectedVehicleId && vehicleDetail && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#2dd4bf', fontSize: '16px' }}>Vehicle Inspection: {selectedVehicleId}</h3>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Driver: {vehicleDetail.telemetry.driver_name} • {vehicleDetail.telemetry.model}
                </div>
                <div style={{ fontSize: '11px', color: '#ffffff', marginTop: '2px' }}>
                  Route: <strong>{vehicleDetail.telemetry.start_location}</strong> → <strong>{vehicleDetail.telemetry.destination}</strong> | ETA: <strong style={{ color: '#2dd4bf' }}>{vehicleDetail.telemetry.eta}</strong>
                </div>
              </div>
              <button onClick={() => setSelectedVehicleId(null)} style={styles.closeBtn}>✕ Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
              <div style={styles.modalBox}>
                <div style={styles.modalBoxLabel}>ENGINE TEMP</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: vehicleDetail.telemetry.engine_temp > 100 ? '#ef4444' : '#ffffff' }}>{vehicleDetail.telemetry.engine_temp}°C</div>
              </div>
              <div style={styles.modalBox}>
                <div style={styles.modalBoxLabel}>FUEL LEVEL</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: vehicleDetail.telemetry.fuel_level < 15 ? '#ef4444' : '#2dd4bf' }}>{vehicleDetail.telemetry.fuel_level}%</div>
                <button
                  onClick={() => handleAlertServiceDispatch(selectedVehicleId, "Low Fuel", "Reroute to Nearest HPCL/BPCL Fuel Station")}
                  style={{ marginTop: '4px', background: '#0d3633', border: '1px solid #2dd4bf', color: '#2dd4bf', padding: '4px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                >
                  📍 Reroute to Fuel Station
                </button>
              </div>
              <div style={styles.modalBox}>
                <div style={styles.modalBoxLabel}>SPEED</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: vehicleDetail.telemetry.speed > 80 ? '#ef4444' : '#ffffff' }}>{vehicleDetail.telemetry.speed} km/h</div>
              </div>
              <div style={styles.modalBox}>
                <div style={styles.modalBoxLabel}>ML RISK</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: vehicleDetail.ml_analysis.failure_risk_score > 0.6 ? '#ef4444' : '#2dd4bf' }}>{(vehicleDetail.ml_analysis.failure_risk_score * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Azure Digital Twins Node Graph View */}
            {vehicleDetail.digital_twin && (
              <div style={{ marginBottom: '12px', background: '#081414', padding: '10px', borderRadius: '8px', border: '1px solid #163330' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#2dd4bf', marginBottom: '8px' }}>
                  <Icons.DigitalTwin />
                  <span>AZURE DIGITAL TWINS (ADT) GRAPH NODES</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {(vehicleDetail.digital_twin.graph_nodes || []).map((node, nIdx) => (
                    <div key={nIdx} style={{ background: '#0e2221', padding: '8px', borderRadius: '6px', border: '1px solid #163330', fontSize: '10px' }}>
                      <div style={{ fontWeight: '700', color: '#ffffff' }}>{node.label}</div>
                      <div style={{ color: node.status === 'HEALTHY' || node.status === 'IN_CORRIDOR' ? '#2dd4bf' : '#ef4444', marginTop: '2px' }}>
                        Status: {node.status} {node.health_pct ? `(${node.health_pct}% Health)` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHAP Feature Breakdown */}
            <h4 style={{ margin: '8px 0 6px 0', fontSize: '12px', color: '#ffffff' }}>SHAP Explainable AI Feature Breakdown</h4>
            <div style={{ background: '#081414', padding: '10px', borderRadius: '8px', border: '1px solid #163330' }}>
              {(vehicleDetail.ml_analysis.shap_explanations || []).map((exp, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                    <span>{exp.feature.toUpperCase()} ({exp.value})</span>
                    <span>{exp.impact_pct}% impact</span>
                  </div>
                  <div style={{ background: '#163330', height: '5px', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: `${exp.impact_pct}%`, height: '100%', background: '#2dd4bf' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: '#081313',
    fontFamily: "'Inter', sans-serif"
  },
  sidebar: {
    width: '230px',
    background: '#071010',
    borderRight: '1px solid #122927',
    padding: '18px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingLeft: '4px'
  },
  sidebarLogoBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: '#0d3633',
    color: '#2dd4bf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #14615a'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  navItem: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? 'linear-gradient(135deg, #0d4b47, #14615a)' : 'transparent',
    color: isActive ? '#ffffff' : '#64748b',
    fontWeight: isActive ? '700' : '500',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease'
  }),
  navBadge: {
    background: '#0d3633',
    color: '#2dd4bf',
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '10px',
    fontWeight: 'bold'
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#0e2221',
    border: '1px solid #163330',
    padding: '8px 10px',
    borderRadius: '8px'
  },
  profileAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#14615a',
    color: '#2dd4bf',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainContent: {
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff'
  },
  pageSubtitle: {
    margin: '3px 0 0 0',
    fontSize: '12px',
    color: '#64748b'
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#0e2221',
    border: '1px solid #163330',
    padding: '6px 12px',
    borderRadius: '16px'
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#2dd4bf',
    boxShadow: '0 0 6px #2dd4bf'
  },
  headerIconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #163330',
    background: '#0e2221',
    color: '#64748b',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    background: '#ef4444',
    color: 'white',
    fontSize: '8px',
    width: '13px',
    height: '13px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '14px',
    marginBottom: '20px'
  },
  kpiCard: {
    background: '#0e2221',
    border: '1px solid #163330',
    padding: '16px',
    borderRadius: '12px',
    position: 'relative',
    overflow: 'hidden'
  },
  kpiTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  iconCircle: (bg, color) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),
  kpiLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px'
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '2px 0'
  },
  pillBadge: (color, bg) => ({
    background: bg,
    color: color,
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '8px',
    display: 'inline-block'
  }),
  waveform: (color) => ({
    height: '2px',
    background: color,
    marginTop: '12px',
    opacity: 0.6
  }),
  middleGrid: {
    display: 'grid',
    gridTemplateColumns: '2.4fr 1fr',
    gap: '16px',
    marginBottom: '20px'
  },
  mapCard: {
    background: '#0e2221',
    border: '1px solid #163330',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #163330',
    background: '#091515'
  },
  activeVehiclesCard: {
    background: '#0e2221',
    border: '1px solid #163330',
    borderRadius: '12px',
    padding: '14px'
  },
  searchInput: {
    width: '100%',
    background: '#081414',
    border: '1px solid #163330',
    color: '#ffffff',
    padding: '7px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    outline: 'none'
  },
  filterChip: (isActive) => ({
    flex: 1,
    background: isActive ? '#14615a' : '#081414',
    color: isActive ? '#ffffff' : '#64748b',
    border: '1px solid #163330',
    padding: '4px 0',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer'
  }),
  vehicleRow: (isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: isSelected ? '#14615a' : '#081414',
    border: `1px solid ${isSelected ? '#2dd4bf' : '#163330'}`,
    cursor: 'pointer'
  }),
  rowIconSquare: (bgColor) => ({
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: `${bgColor}20`,
    color: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),
  riskBadge: (color) => ({
    background: `${color}20`,
    color: color,
    fontSize: '9px',
    fontWeight: '700',
    padding: '1px 5px',
    borderRadius: '6px'
  }),
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '14px'
  },
  widgetCard: {
    background: '#0e2221',
    border: '1px solid #163330',
    borderRadius: '12px',
    padding: '14px'
  },
  widgetHeader: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px'
  },
  donutRing: {
    width: '65px',
    height: '65px',
    borderRadius: '50%',
    border: '6px solid #2dd4bf',
    borderTopColor: '#ef4444',
    borderRightColor: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  arcGauge: (color) => ({
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: `6px solid ${color}`,
    borderBottomColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),
  alertRow: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: '6px',
    background: '#081414',
    border: '1px solid #163330'
  }),
  demoFaultBtn: {
    background: '#081414',
    color: '#ef4444',
    border: '1px solid #3b1111',
    padding: '5px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left'
  },
  subTabBtn: (isActive) => ({
    background: isActive ? '#14615a' : '#081414',
    color: isActive ? '#ffffff' : '#64748b',
    border: '1px solid #163330',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  }),
  samplePill: {
    background: '#081414',
    color: '#2dd4bf',
    border: '1px solid #163330',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  aiContainer: {
    background: '#0e2221',
    border: '1px solid #163330',
    borderRadius: '14px',
    padding: '24px'
  },
  aiHeaderIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0d4b47, #14615a)',
    color: '#2dd4bf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #2dd4bf44'
  },
  aiInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#081414',
    border: '1px solid #14615a',
    borderRadius: '30px',
    padding: '4px 6px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    marginBottom: '20px'
  },
  aiInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    padding: '10px 12px',
    fontSize: '13px',
    outline: 'none'
  },
  aiSubmitPillBtn: {
    background: 'linear-gradient(135deg, #2dd4bf, #0284c7)',
    color: '#081414',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '24px',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '0.3px'
  },
  aiResponseCard: {
    background: '#081414',
    border: '1px solid #14615a',
    borderRadius: '12px',
    padding: '18px',
    borderLeft: '4px solid #2dd4bf'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(8, 19, 19, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modalCard: {
    background: '#0e2221',
    border: '1px solid #2dd4bf',
    borderRadius: '14px',
    padding: '20px',
    width: '100%',
    maxWidth: '600px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  closeBtn: {
    background: '#081414',
    color: '#ffffff',
    border: '1px solid #163330',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px'
  },
  modalBox: {
    background: '#081414',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #163330'
  },
  modalBoxLabel: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#64748b'
  }
};
