import math
import random

class RouteGenerator:
    """Generates realistic vehicle waypoint paths across Pan-India logistics corridors."""
    
    BASE_ROUTES = {
        "IND-VEH-101": [(28.6139, 77.2090), (28.4595, 77.0266), (26.9124, 75.7873), (24.5854, 73.7125), (23.0225, 72.5714), (21.1702, 72.8311), (19.0760, 72.8777)],
        "IND-VEH-102": [(19.0760, 72.8777), (20.3712, 72.9033), (21.1702, 72.8311), (22.3072, 73.1812), (23.0225, 72.5714)],
        "IND-VEH-103": [(12.9716, 77.5946), (12.7409, 77.8253), (12.5266, 78.2146), (12.9165, 79.1325), (13.0827, 80.2707)],
        "IND-VEH-104": [(17.3850, 78.4867), (18.6878, 78.1462), (19.6641, 78.5320), (21.1458, 79.0882)],
        "IND-VEH-105": [(22.5726, 88.3639), (22.3460, 87.2320), (21.4934, 86.9135), (20.2961, 85.8245)],
        "IND-VEH-106": [(26.9124, 75.7873), (27.8188, 76.2750), (28.4595, 77.0266), (28.6139, 77.2090)],
        "IND-VEH-107": [(13.0827, 80.2707), (14.4426, 79.9865), (15.5057, 80.0499), (16.5062, 80.6480)],
        "IND-VEH-108": [(21.1702, 72.8311), (20.3712, 72.9033), (19.2183, 72.9781), (18.5204, 73.8567)],
        "IND-VEH-109": [(18.5204, 73.8567), (17.6805, 74.0183), (16.7050, 74.2433), (15.8497, 74.4977), (15.2993, 74.1240)],
        "IND-VEH-110": [(23.0225, 72.5714), (23.5461, 73.1812), (24.5854, 73.7125)],
        "IND-VEH-111": [(15.3647, 75.1240), (14.4644, 75.9218), (13.3379, 77.1173), (12.9716, 77.5946)],
        "IND-VEH-112": [(21.1458, 79.0882), (21.8541, 77.9033), (22.8450, 77.4126), (23.2599, 77.4126)],
        "IND-VEH-113": [(16.5062, 80.6480), (17.0005, 81.8040), (17.6868, 83.2185)],
        "IND-VEH-114": [(20.2961, 85.8245), (20.4625, 85.8828), (21.4934, 86.9135), (22.5726, 88.3639)],
        "IND-VEH-115": [(24.5854, 73.7125), (25.2138, 73.8340), (26.4499, 74.6399), (26.9124, 75.7873)]
    }

    def __init__(self, vehicle_id=None):
        if not vehicle_id or vehicle_id not in self.BASE_ROUTES:
            vehicle_id = "IND-VEH-101"
        self.vehicle_id = vehicle_id
        self.waypoints = self.BASE_ROUTES[vehicle_id]
        self.current_index = 0
        self.progress = 0.25 # Start at 25% along the route near start
        self.direction = 1

    def get_next_position(self, speed_kmh=65.0, step_seconds=3.0):
        if len(self.waypoints) < 2:
            return self.waypoints[0]
            
        p1 = self.waypoints[self.current_index]
        next_idx = self.current_index + self.direction
        
        if next_idx >= len(self.waypoints) or next_idx < 0:
            self.direction *= -1
            next_idx = self.current_index + self.direction

        p2 = self.waypoints[next_idx]
        
        d_lat = math.radians(p2[0] - p1[0])
        d_lon = math.radians(p2[1] - p1[1])
        lat1 = math.radians(p1[0])
        lat2 = math.radians(p2[0])
        a = math.sin(d_lat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2)**2
        segment_km = 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        if segment_km <= 0.001:
            segment_km = 0.1

        dist_traveled_km = (speed_kmh / 3600.0) * step_seconds
        step_progress = dist_traveled_km / segment_km
        self.progress += step_progress

        if self.progress >= 1.0:
            self.progress = 0.0
            self.current_index = next_idx

        lat = p1[0] + (p2[0] - p1[0]) * self.progress
        lon = p1[1] + (p2[1] - p1[1]) * self.progress
        
        return round(lat, 6), round(lon, 6)
