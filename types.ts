
export type SourceStatus = 'active' | 'error_timeout' | 'unavailable' | 'maintenance';
export type MetricUnit = 'C' | '%' | 'hPa' | 'km/h' | 'µg/m³' | 'AQI' | 'mm' | 'UV';

export interface SourceData {
  source: string;
  displayName: string;
  isOfficial: boolean; // For government badge (IMD/KSNDMC)
  value: number | null;
  unit: MetricUnit;
  status: SourceStatus;
  lastUpdated: string;
}

export interface MetricRow {
  metricId: string;
  label: string;
  data: SourceData[];
  idealRange?: [number, number]; // For coloring logic
}

export interface HistoricalPoint {
  timestamp: string;
  [sourceName: string]: number | string; // Dynamic keys for source values
}

export type TimeScale = '12h' | '24h' | '48h' | '7d' | '14d' | '30d';
export type GraphMetric = 'temperature' | 'humidity' | 'aqi' | 'precipitation' | 'wind' | 'pressure' | 'uv';

export type MapLayerType = 'sensors' | 'temp-heat' | 'precip-radar' | 'aqi-heat';

export interface Insight {
  type: 'record' | 'alert' | 'trend';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface CityData {
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  matrix: MetricRow[];
  // History now supports multiple metrics and timescales
  history: Record<GraphMetric, Record<TimeScale, HistoricalPoint[]>>;
  // 7-Day Forecast from multiple sources
  forecast: Record<GraphMetric, HistoricalPoint[]>;
  insights: Insight[];
  aqiBreakdown: {
    source: string;
    aqiValue: number; // Added AQI value
    pm25: number;
    pm10: number;
    no2: number;
    status: 'Safe' | 'Moderate' | 'Hazardous';
  }[];
}

export interface UserPreferences {
  favorites: string[];
}
