
import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { CityData, MapLayerType } from '../types';
import { Layers, Thermometer, CloudRain, Wind, Map } from 'lucide-react';
import clsx from 'clsx';

interface MapWidgetProps {
  cityData: CityData;
}

export const MapWidget: React.FC<MapWidgetProps> = ({ cityData }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('sensors');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([cityData.lat, cityData.lng], 12);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.setView([cityData.lat, cityData.lng], 12);
    }

    // Cleanup previous layers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Layer Logic
    if (activeLayer === 'sensors') {
       // --- SENSORS LAYER ---
       const sensors = [
         { lat: cityData.lat + 0.01, lng: cityData.lng - 0.01, type: 'IMD', val: '28°C', color: '#3b82f6' },
         { lat: cityData.lat - 0.02, lng: cityData.lng + 0.02, type: 'KSNDMC', val: '27°C', color: '#10b981' },
         { lat: cityData.lat + 0.015, lng: cityData.lng + 0.01, type: 'OpenAQ', val: 'AQI 112', color: '#ef4444' },
         { lat: cityData.lat - 0.01, lng: cityData.lng - 0.02, type: 'WeatherUnion', val: '28.5°C', color: '#f59e0b' },
       ];

       sensors.forEach(s => {
         const icon = L.divIcon({
           className: 'custom-pin',
           html: `<div style="background-color: ${s.color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${s.color}; border: 2px solid white;"></div>`,
           iconSize: [12, 12],
           iconAnchor: [6, 6]
         });
         L.marker([s.lat, s.lng], { icon }).addTo(mapInstanceRef.current!)
           .bindPopup(`<b>${s.type}</b><br/>${s.val}`);
       });

    } else if (activeLayer === 'temp-heat') {
       // --- TEMP HEATMAP LAYER (Simulated) ---
       const heatPoints = [
         { lat: cityData.lat, lng: cityData.lng, radius: 2500, color: '#f59e0b' },
         { lat: cityData.lat + 0.03, lng: cityData.lng + 0.02, radius: 2000, color: '#ef4444' }, // Hot spot
         { lat: cityData.lat - 0.02, lng: cityData.lng - 0.02, radius: 2200, color: '#3b82f6' }, // Cool spot
       ];
       heatPoints.forEach(p => {
         L.circle([p.lat, p.lng], {
           color: p.color,
           fillColor: p.color,
           fillOpacity: 0.3,
           radius: p.radius,
           weight: 0
         }).addTo(mapInstanceRef.current!);
       });

    } else if (activeLayer === 'precip-radar') {
       // --- RADAR LAYER (Simulated) ---
       const rainClouds = [
         { lat: cityData.lat + 0.04, lng: cityData.lng - 0.03, radius: 4000 },
         { lat: cityData.lat - 0.05, lng: cityData.lng + 0.04, radius: 3000 }
       ];
       rainClouds.forEach(p => {
         L.circle([p.lat, p.lng], {
           color: '#0ea5e9',
           fillColor: '#0ea5e9',
           fillOpacity: 0.4,
           radius: p.radius,
           weight: 1,
           dashArray: '5, 10'
         }).addTo(mapInstanceRef.current!);
       });

    } else if (activeLayer === 'aqi-heat') {
       // --- POLLUTION LAYER (Simulated) ---
       const zones = [
         { lat: cityData.lat + 0.02, lng: cityData.lng, radius: 3000, color: '#ef4444', opacity: 0.4 }, // Bad
         { lat: cityData.lat - 0.03, lng: cityData.lng - 0.02, radius: 2500, color: '#10b981', opacity: 0.2 }, // Good
       ];
       zones.forEach(z => {
         L.circle([z.lat, z.lng], {
           color: z.color,
           fillColor: z.color,
           fillOpacity: z.opacity,
           radius: z.radius,
           weight: 0
         }).addTo(mapInstanceRef.current!);
       });
    }

  }, [cityData, activeLayer]);

  const layers: { id: MapLayerType, icon: React.ReactNode, label: string }[] = [
    { id: 'sensors', icon: <Map className="w-4 h-4" />, label: 'Sensors' },
    { id: 'temp-heat', icon: <Thermometer className="w-4 h-4" />, label: 'Temp Map' },
    { id: 'precip-radar', icon: <CloudRain className="w-4 h-4" />, label: 'Radar' },
    { id: 'aqi-heat', icon: <Wind className="w-4 h-4" />, label: 'Pollution' },
  ];

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative group shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Floating Control Panel */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 bg-slate-900/90 p-1.5 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md">
         {layers.map(layer => (
           <button
             key={layer.id}
             onClick={() => setActiveLayer(layer.id)}
             className={clsx(
               "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all",
               activeLayer === layer.id 
                 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                 : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
             )}
           >
             {layer.icon}
             <span>{layer.label}</span>
           </button>
         ))}
      </div>

      <div className="absolute bottom-4 right-4 z-[400] bg-slate-950/80 px-3 py-1.5 rounded border border-slate-700 text-[10px] text-slate-400 backdrop-blur pointer-events-none">
        Layer: <span className="text-slate-200 font-semibold uppercase">{activeLayer}</span>
      </div>
    </div>
  );
};
