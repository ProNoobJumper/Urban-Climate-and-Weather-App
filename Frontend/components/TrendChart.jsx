// Trend Chart Component
// Description: Reusable chart component for displaying trends

import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import { Info, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const COLORS = {
  IMD: '#3b82f6',
  KSNDMC: '#10b981',
  WeatherUnion: '#f59e0b',
  UrbanEmission: '#8b5cf6',
  OpenAQ: '#ec4899',
  OpenWeather: '#06b6d4',
  Google: '#f43f5e',
};

const getUnit = (metric) => {
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

// Custom Dropdown Component
const Dropdown = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
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
                  : "hover:bg-slate-800 text-slate-300"
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

Dropdown.propTypes = {
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  })).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export const UnifiedGraph = ({ history, forecast }) => {
  const [xAxis, setXAxis] = useState('Time');
  const [yAxis, setYAxis] = useState('temperature');
  const [timeScale, setTimeScale] = useState('24h');
  const [activeSources, setActiveSources] = useState(['IMD', 'KSNDMC', 'WeatherUnion', 'OpenAQ']);

  const toggleSource = (source) => {
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
      const xData = history[xAxis][timeScale];
      const yData = history[yAxis][timeScale];
      const merged = {};
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
      return history[yAxis][timeScale];
    }
  }, [history, forecast, xAxis, yAxis, timeScale, activeSources, isScatter]);

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
           <div>
             <h3 className="text-slate-100 font-semibold">
               {isScatter ? 'Correlation Analysis' : 'Historical Trends'}
             </h3>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {!isScatter && (
             <Dropdown 
               label="RANGE"
               value={timeScale}
               onChange={(v) => setTimeScale(v)}
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
             onChange={(v) => setYAxis(v)}
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
        <div className="flex-1 p-4 min-h-[300px] flex flex-col min-w-0 relative" style={{ height: '100%' }}>
           <ResponsiveContainer width="100%" height="100%">
             {isScatter ? (
               <ScatterChart>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis type="number" dataKey="x" name={xAxis} unit={getUnit(xAxis)} stroke="#64748b" />
                 <YAxis type="number" dataKey="y" name={yAxis} unit={getUnit(yAxis)} stroke="#64748b" />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                 {relevantSources.map(source => activeSources.includes(source) && chartData[source] && (
                   <Scatter key={source} name={source} data={chartData[source]} fill={COLORS[source]} />
                 ))}
               </ScatterChart>
             ) : (
               <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis 
                   dataKey="timestamp" 
                   stroke="#64748b" 
                   tick={{fontSize: 11}} 
                   angle={-45}
                   textAnchor="end"
                   height={80}
                 />
                 <YAxis stroke="#64748b" tick={{fontSize: 12}} domain={['auto', 'auto']} unit={getUnit(yAxis)} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                 {relevantSources.map(source => activeSources.includes(source) && (
                    <Line
                      key={source}
                      type="monotone"
                      dataKey={source}
                      stroke={COLORS[source]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                 ))}
               </LineChart>
             )}
           </ResponsiveContainer>
        </div>

        {/* Sidebar / Legend */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           
           {/* Active Sources Grid */}
           <div className="shrink-0">
             <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">
               Active Data Sources
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
                          : "bg-slate-950/50 border-slate-700 hover:border-slate-600"
                     )}
                   >
                     {/* Source Color Indicator */}
                     <div 
                         className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" 
                         style={{ backgroundColor: COLORS[source] }}
                     />

                     {/* Source Name */}
                     <span className="text-[10px] font-bold text-center leading-tight mb-1">
                       {source}
                     </span>

                     {/* Status Dot */}
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
                {isScatter 
                  ? `Scatter plot reveals the relationship between ${xAxis} and ${yAxis}. Points clustered along a diagonal line indicate strong correlation, while scattered points suggest weak or no relationship.`
                  : `Viewing ${yAxis} trends over ${timeScale.replace('h', ' hours').replace('d', ' days')} from multiple sources. Divergence between sources may indicate measurement differences or local variations. IMD provides official government data, while other sources offer independent verification.`
                }
              </p>
           </div>

        </div>
      </div>
    </div>
  );
};

UnifiedGraph.propTypes = {
  history: PropTypes.objectOf(
    PropTypes.objectOf(
      PropTypes.arrayOf(PropTypes.object)
    )
  ).isRequired,
  forecast: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.object)
  ).isRequired,
};
