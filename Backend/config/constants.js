const CITIES = [
  { 
    id: 'city_001', 
    name: 'Mumbai', 
    state: 'Maharashtra',
    lat: 19.0760, 
    lng: 72.8777, 
    timezone: 'Asia/Kolkata',
    population: 20961472
  },
  { 
    id: 'city_002', 
    name: 'Delhi', 
    state: 'Delhi',
    lat: 28.7041, 
    lng: 77.1025, 
    timezone: 'Asia/Kolkata',
    population: 16787941
  },
  { 
    id: 'city_003', 
    name: 'Bangalore', 
    state: 'Karnataka',
    lat: 12.9716, 
    lng: 77.5946, 
    timezone: 'Asia/Kolkata',
    population: 8436675
  },
  { 
    id: 'city_004', 
    name: 'Hyderabad', 
    state: 'Telangana',
    lat: 17.3850, 
    lng: 78.4867, 
    timezone: 'Asia/Kolkata',
    population: 6809970
  },
  { 
    id: 'city_005', 
    name: 'Kolkata', 
    state: 'West Bengal',
    lat: 22.5726, 
    lng: 88.3639, 
    timezone: 'Asia/Kolkata',
    population: 14681900
  },
  { 
    id: 'city_006', 
    name: 'Chennai', 
    state: 'Tamil Nadu',
    lat: 13.0827, 
    lng: 80.2707, 
    timezone: 'Asia/Kolkata',
    population: 7088000
  },
  { 
    id: 'city_007', 
    name: 'Pune', 
    state: 'Maharashtra',
    lat: 18.5204, 
    lng: 73.8567, 
    timezone: 'Asia/Kolkata',
    population: 6430400
  },
  { 
    id: 'city_008', 
    name: 'Ahmedabad', 
    state: 'Gujarat',
    lat: 23.0225, 
    lng: 72.5714, 
    timezone: 'Asia/Kolkata',
    population: 8450570
  }
];

const AQI_CATEGORIES = {
  0: { range: [0, 50], label: 'Good', color: '#00E400', health: 'No health effects' },
  1: { range: [51, 100], label: 'Moderate', color: '#FFFF00', health: 'Unusually sensitive people' },
  2: { range: [101, 150], label: 'Unhealthy for Sensitive Groups', color: '#FF7E00', health: 'Sensitive groups may experience effects' },
  3: { range: [151, 200], label: 'Unhealthy', color: '#FF0000', health: 'General public may experience effects' },
  4: { range: [201, 300], label: 'Very Unhealthy', color: '#8F3F97', health: 'Everyone may begin to experience health effects' },
  5: { range: [301, 500], label: 'Hazardous', color: '#7E0023', health: 'Health alert: everyone may experience serious health effects' }
};

module.exports = { CITIES, AQI_CATEGORIES };