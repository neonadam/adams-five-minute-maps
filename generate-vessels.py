import json
import random

# Generate vessel data with coordinates in seas/rivers around the world
vessels = []

# Vessel types
vessel_types = ['Cargo Ship', 'Tanker', 'Container Ship', 'Cruise Ship', 'Fishing Vessel', 'Yacht', 'Ferry', 'Bulk Carrier']

# Major sea areas and their approximate bounds (lat, lon ranges)
sea_areas = [
    # North Atlantic
    {'name': 'North Atlantic', 'lat': (20, 60), 'lon': (-80, -10)},
    # Mediterranean
    {'name': 'Mediterranean', 'lat': (30, 46), 'lon': (-6, 36)},
    # North Sea
    {'name': 'North Sea', 'lat': (51, 61), 'lon': (-2, 10)},
    # Caribbean
    {'name': 'Caribbean', 'lat': (10, 25), 'lon': (-90, -60)},
    # Pacific Ocean
    {'name': 'Pacific', 'lat': (-20, 50), 'lon': (100, -80)},
    # Indian Ocean
    {'name': 'Indian Ocean', 'lat': (-40, 25), 'lon': (20, 120)},
    # South Atlantic
    {'name': 'South Atlantic', 'lat': (-40, 20), 'lon': (-60, 20)},
    # Red Sea
    {'name': 'Red Sea', 'lat': (12, 30), 'lon': (32, 44)},
    # Baltic Sea
    {'name': 'Baltic Sea', 'lat': (54, 66), 'lon': (9, 30)},
    # Gulf of Mexico
    {'name': 'Gulf of Mexico', 'lat': (18, 30), 'lon': (-98, -80)},
    # South China Sea
    {'name': 'South China Sea', 'lat': (0, 25), 'lon': (100, 120)},
    # Arabian Sea
    {'name': 'Arabian Sea', 'lat': (10, 25), 'lon': (55, 75)},
    # Bering Sea
    {'name': 'Bering Sea', 'lat': (52, 66), 'lon': (162, -168)},
    # Black Sea
    {'name': 'Black Sea', 'lat': (41, 47), 'lon': (27, 42)},
    # Amazon River (approximate)
    {'name': 'Amazon River', 'lat': (-5, 3), 'lon': (-70, -50)},
    # Mississippi River Delta
    {'name': 'Mississippi Delta', 'lat': (29, 30.5), 'lon': (-91, -89)},
    # Yangtze River (approximate)
    {'name': 'Yangtze River', 'lat': (30, 32), 'lon': (118, 121)},
    # Thames Estuary
    {'name': 'Thames Estuary', 'lat': (51.3, 51.7), 'lon': (0.5, 1.5)},
    # Rhine River
    {'name': 'Rhine River', 'lat': (51, 52.6), 'lon': (4, 6)},
    # Suez Canal
    {'name': 'Suez Canal', 'lat': (29.8, 31.3), 'lon': (32.3, 32.6)},
]

# Generate 8000 vessels
for i in range(8000):
    area = random.choice(sea_areas)
    lat = random.uniform(area['lat'][0], area['lat'][1])
    lon = random.uniform(area['lon'][0], area['lon'][1])
    
    vessel = {
        'id': f'VESSEL-{i+1:05d}',
        'name': f'{random.choice(vessel_types)} {chr(65 + i % 26)}{i+1}',
        'type': random.choice(vessel_types),
        'latitude': round(lat, 6),
        'longitude': round(lon, 6),
        'heading': random.randint(0, 360),
        'speed': round(random.uniform(5, 25), 1),
        'destination': random.choice(['New York', 'London', 'Shanghai', 'Singapore', 'Rotterdam', 'Hong Kong', 'Los Angeles', 'Tokyo', 'Dubai', 'Sydney', 'Hamburg', 'Antwerp']),
        'flag': random.choice(['USA', 'UK', 'Panama', 'Liberia', 'Marshall Islands', 'Singapore', 'Malta', 'Hong Kong', 'Greece', 'China', 'Japan', 'Norway']),
        'length': random.randint(50, 400),
        'tonnage': random.randint(1000, 250000),
        'status': random.choice(['Underway', 'Anchored', 'Moored', 'Restricted Maneuverability'])
    }
    vessels.append(vessel)

with open('public/vessel-data.json', 'w') as f:
    json.dump(vessels, f, indent=2)

print(f'Generated {len(vessels)} vessels')

