// -REPLACE WITH YOUR NAME-
// -REPLACE WITH YOUR OS SUPPORT-
// Description: Reusable chart component for displaying trends

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { CityData, GraphMetric, TimeScale } from '../types';
import { Info, Activity, ChevronDown, CalendarDays, History } from 'lucide-react';
import clsx from 'clsx';

interface UnifiedGraphProps {
  history: CityData['history'];
  forecast: CityData['forecast'];
}

const COLORS: Record<string, string> = {
  IMD: '#3b82f6',        // Blue
  KSNDMC: '#10b981',     // Emerald
  WeatherUnion: '#f59e0b', // Amber
  UrbanEmission: '#8b5cf6', // Violet
  OpenAQ: '#ef4444',      // Red
  OpenWeather: '#ec4899', // Pink
  Google: '#4285F4'       // Google Blue
};

const getUnit = (metric: string): string => {
  switch (metric) {
    case 'temperature': return '°C';
    case 'humidity': return '%';
    case 'pressure': return ' hPa';
    case 'wind': return ' km/h';
    case 'precipitation': return ' mm';
    case 'uv': return ' UV';
    case 'aqi': return ' AQI';
    default: return '';
  }
};

// --- Custom Dropdown Component ---
interface DropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  label?: string;
}

// Custom Select Component to ensure consistent Dark Mode styling
const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 hover:border-slate-600 transition-colors"
      >
        {label && <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{label}</span>}
        <span className="text-sm text-slate-200">{selectedOption.label}</span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 custom-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={clsx(
                "px-3 py-2 text-sm cursor-pointer transition-colors",
                option.value === value
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const UnifiedGraph: React.FC<UnifiedGraphProps> = ({ history, forecast }) => {
  const [mode, setMode] = useState<'history' | 'forecast'>('history');
  const [xAxis, setXAxis] = useState<string>('Time');
  const [yAxis, setYAxis] = useState<GraphMetric>('temperature');
  const [timeScale, setTimeScale] = useState<TimeScale>('24h');
  const [activeSources, setActiveSources] = useState<string[]>(['IMD', 'KSNDMC', 'WeatherUnion', 'OpenAQ']);

  const toggleSource = (source: string) => {
    setActiveSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const isScatter = xAxis !== 'Time';
  
  // Data Preparation
  const chartData = useMemo(() => {
    if (isScatter) {
      // Scatter Logic (Existing)
      const xData = history[xAxis as GraphMetric][timeScale];
      const yData = history[yAxis][timeScale];
      const merged: Record<string, {x: number, y: number}[]> = {};
      activeSources.forEach(source => { merged[source] = []; });
      xData.forEach((point, idx) => {
        const yPoint = yData[idx];
        if (!yPoint) return;
        activeSources.forEach(source => {
          const xVal = point[source];
          const yVal = yPoint[source];
          if (typeof xVal === 'number' && typeof yVal === 'number') {
             merged[source].push({ x: xVal, y: yVal });
          }
        });
      });
      return merged;
    } else {
      // Time Series Logic
      if (mode === 'forecast') {
        return forecast[yAxis];
      } else {
        return history[yAxis][timeScale];
      }
    }
  }, [history, forecast, xAxis, yAxis, timeScale, activeSources, isScatter, mode]);

  // Determine relevant sources
  const relevantSources = useMemo(() => {
    const checkMetric = isScatter ? xAxis : yAxis; 
    if (checkMetric === 'aqi') return ['OpenAQ', 'UrbanEmission', 'Google'];
    return ['IMD', 'KSNDMC', 'WeatherUnion', 'OpenWeather', 'OpenAQ'];
  }, [xAxis, yAxis, isScatter]);

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col shadow-xl overflow-hidden">
      
      {/* Header / Controls */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
           {/* Mode Toggle */}
           <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
             <button 
               onClick={() => setMode('history')}
               className={clsx("px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all", mode === 'history' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200")}
             >
               <History className="w-3.5 h-3.5" /> History
             </button>
             <button 
               onClick={() => setMode('forecast')}
               className={clsx("px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all", mode === 'forecast' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200")}
             >
               <CalendarDays className="w-3.5 h-3.5" /> Forecast
             </button>
           </div>
           
           <div className="h-6 w-px bg-slate-800"></div>

           <div>
             <h3 className="text-slate-100 font-semibold hidden md:block">
               {mode === 'history' ? (isScatter ? 'Correlation Analysis' : 'Historical Trends') : 'Multi-Model Forecast'}
             </h3>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {!isScatter && mode === 'history' && (
             <Dropdown 
               label="RANGE"
               value={timeScale}
               onChange={(v) => setTimeScale(v as TimeScale)}
               options={[
                 { label: 'Last 12 Hours', value: '12h' },
                 { label: 'Last 24 Hours', value: '24h' },
                 { label: 'Last 48 Hours', value: '48h' },
                 { label: 'Last 7 Days', value: '7d' },
                 { label: 'Last 14 Days', value: '14d' },
                 { label: 'Last 30 Days', value: '30d' }
               ]}
             />
           )}
           
           <Dropdown 
             label="X-AXIS"
             value={xAxis}
             onChange={setXAxis}
             options={[
               { label: 'Time', value: 'Time' },
               { label: 'Temperature', value: 'temperature' },
               { label: 'Humidity', value: 'humidity' },
               { label: 'Air Quality', value: 'aqi' }
             ]}
           />
           <Dropdown 
             label="Y-AXIS"
             value={yAxis}
             onChange={(v) => setYAxis(v as GraphMetric)}
             options={[
               { label: 'Temperature', value: 'temperature' },
               { label: 'Humidity', value: 'humidity' },
               { label: 'Precipitation', value: 'precipitation' },
               { label: 'Air Quality', value: 'aqi' },
               { label: 'Wind Speed', value: 'wind' },
               { label: 'Pressure', value: 'pressure' },
               { label: 'UV Index', value: 'uv' }
             ]}
           />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        
        {/* Chart Area */}
        <div className="flex-1 p-4 min-h-[300px] flex flex-col min-w-0 relative">
           <ResponsiveContainer width="100%" height="100%">
             {isScatter ? (
               <ScatterChart>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis type="number" dataKey="x" name={xAxis} unit={getUnit(xAxis)} stroke="#64748b" />
                 <YAxis type="number" dataKey="y" name={yAxis} unit={getUnit(yAxis)} stroke="#64748b" />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                 {relevantSources.map(source => activeSources.includes(source) && (chartData as any)[source] && (
                   <Scatter key={source} name={source} data={(chartData as any)[source]} fill={COLORS[source]} />
                 ))}
               </ScatterChart>
             ) : (
               <LineChart data={chartData as any[]}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 12}} />
                 <YAxis stroke="#64748b" tick={{fontSize: 12}} domain={['auto', 'auto']} unit={getUnit(yAxis)} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                 {mode === 'forecast' && (
                    <ReferenceLine x="Now" stroke="white" strokeDasharray="3 3" label={{ position: 'top', value: 'Now', fill: 'white' }} />
                 )}
                 {relevantSources.map(source => activeSources.includes(source) && (
                    <Line
                      key={source}
                      type="monotone"
                      dataKey={source}
                      stroke={COLORS[source]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                 ))}
               </LineChart>
             )}
           </ResponsiveContainer>
        </div>

        {/* Sidebar / Legend */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           
           {/* Active Sources Grid - SQUARE TILES & RED DOT */}
           <div className="shrink-0">
             <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">
               {mode === 'forecast' ? 'Forecast Models' : 'Active Sources'}
             </h4>
             <div className="grid grid-cols-3 gap-2">
               {relevantSources.map(source => {
                 const isActive = activeSources.includes(source);
                 return (
                   <button
                     key={source}
                     onClick={() => toggleSource(source)}
                     className={clsx(
                        "aspect-square p-2 rounded-lg border transition-all flex flex-col items-center justify-center relative group overflow-hidden",
                        isActive
                          ? "bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                          : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800"
                     )}
                   >
                     {/* Source Color Indicator (Line Color) */}
                     <div 
                         className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" 
                         style={{ backgroundColor: COLORS[source] }}
                     />

                     {/* Source Name */}
                     <span className="text-[10px] font-bold text-center leading-tight mb-1">
                       {source}
                     </span>

                     {/* Status Dot (Green/Red) */}
                     <div className={clsx(
                       "w-1.5 h-1.5 rounded-full shadow-sm transition-colors",
                       isActive 
                         ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                         : "bg-rose-500 opacity-60"
                     )} />
                   </button>
                 );
               })}
             </div>
           </div>

           {/* Dynamic Explanation */}
           <div className="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-4 relative shrink-0">
              <div className="absolute top-4 right-4 text-indigo-400">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="text-indigo-300 font-semibold mb-2 text-sm flex items-center gap-2">
                 Analysis
              </h4>
              <p className="text-sm text-indigo-200/80 leading-relaxed">
                {mode === 'forecast' 
                  ? "Comparing multiple forecast models (IMD vs Global) allows for uncertainty quantification. Divergence often increases after 72 hours."
                  : isScatter 
                    ? "Correlation analysis helps identify environmental drivers. Clustered points along a diagonal indicate strong causality."
                    : "Historical trends allow for verification of sensor accuracy against official government baselines."
                }
              </p>
           </div>

        </div>
      </div>
    </div>
  );
};