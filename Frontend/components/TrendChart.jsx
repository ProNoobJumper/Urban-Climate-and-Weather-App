// Trend Chart Component
// Description: Reusable chart component for displaying trends

import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter,
  Brush, Legend, ReferenceArea
} from 'recharts';
import { Info, ChevronDown, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { getCityInfo } from '../config/urbanCities';

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

// Check if city is in Karnataka (for KSNDMC filtering)
const isKarnatakaCity = (cityName) => {
  if (!cityName) return false;
  const cityInfo = getCityInfo(cityName);
  return cityInfo?.state === 'Karnataka';
};

// Custom Dropdown Component - Clean & Simple
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
        className={clsx(
          "flex items-center gap-2 rounded-lg px-3 py-2 transition-all border",
          isOpen 
            ? "bg-slate-800 border-indigo-500" 
            : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
        )}
      >
        {label && <span className="text-[10px] uppercase text-slate-500 font-semibold">{label}</span>}
        <span className="text-sm text-white">{selectedOption.label}</span>
        <ChevronDown className={clsx(
          "w-4 h-4 text-slate-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] max-h-64 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
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
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
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

export const UnifiedGraph = ({ history, forecast, comparisonHistory, comparisonCityName, mainCityName }) => {
  const [xAxis, setXAxis] = useState('Time');
  const [yAxis, setYAxis] = useState('temperature');
  const [timeScale, setTimeScale] = useState('24h');
  
  // Get available sources from actual data (excludes sources with no data)
  // Filter KSNDMC based on whether main city is in Karnataka
  const mainCityIsKarnataka = isKarnatakaCity(mainCityName);
  const comparisonCityIsKarnataka = isKarnatakaCity(comparisonCityName);
  
  const availableSources = useMemo(() => {
    const baseSources = ['IMD', 'WeatherUnion', 'OpenWeather', 'OpenAQ'];
    
    // Only include KSNDMC if main city is in Karnataka
    if (mainCityIsKarnataka) {
      return ['IMD', 'KSNDMC', 'WeatherUnion', 'OpenWeather', 'OpenAQ'];
    }
    
    return baseSources;
  }, [mainCityIsKarnataka]);
  
  // Separate active sources for each city (for independent toggling)
  const [mainActiveSources, setMainActiveSources] = useState(['IMD', 'WeatherUnion', 'OpenWeather', 'OpenAQ']);
  const [compActiveSources, setCompActiveSources] = useState(['IMD', 'WeatherUnion', 'OpenWeather', 'OpenAQ']);
  
  // Update active sources when available sources change
  useEffect(() => {
    setMainActiveSources(availableSources.slice(0, 4));
    setCompActiveSources(availableSources.slice(0, 4));
  }, [availableSources]);
  
  // Zoom state
  const [zoomLeft, setZoomLeft] = useState(null);
  const [zoomRight, setZoomRight] = useState(null);
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [isZooming, setIsZooming] = useState(false);
  
  // Highlight source (to emphasize one line while dimming others)
  const [highlightSource, setHighlightSource] = useState(null);

  // Line stroke patterns for different sources (to distinguish overlapping lines)
  const STROKE_PATTERNS = {
    IMD: '',           // solid
    KSNDMC: '8 4',     // dashed
    WeatherUnion: '4 4', // shorter dash
    OpenWeather: '12 4 4 4', // dash-dot
    OpenAQ: '2 2',     // dotted
    UrbanEmission: '16 4', // long dash
    Google: '4 8',     // space dash
  };

  // Toggle functions for each city
  const toggleMainSource = (source) => {
    setMainActiveSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };
  
  const toggleCompSource = (source) => {
    setCompActiveSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };
  
  // Combined active sources for data that needs both (legacy compatibility)
  const activeSources = [...new Set([...mainActiveSources, ...compActiveSources])];

  // Reset zoom
  const resetZoom = () => {
    setZoomLeft(null);
    setZoomRight(null);
  };

  const isScatter = xAxis !== 'Time';
  const isComparison = !!comparisonHistory && !!comparisonCityName;
  
  // Data Preparation
  const chartData = useMemo(() => {
    if (isScatter) {
      const xData = history[xAxis]?.[timeScale] || [];
      const yData = history[yAxis]?.[timeScale] || [];
      const merged = {};
      
      // Main city data - use mainActiveSources
      mainActiveSources.forEach(source => { 
        const key = `${mainCityName || 'Main'}_${source}`;
        merged[key] = []; 
      });
      
      xData.forEach((point, idx) => {
        const yPoint = yData[idx];
        if (!yPoint) return;
        mainActiveSources.forEach(source => {
          const xVal = point[source];
          const yVal = yPoint[source];
          if (typeof xVal === 'number' && typeof yVal === 'number') {
            const key = `${mainCityName || 'Main'}_${source}`;
            merged[key].push({ 
              x: xVal, 
              y: yVal, 
              city: mainCityName || 'Main',
              source: source
            });
          }
        });
      });
      
      // Comparison city data (if comparing) - use compActiveSources
      if (isComparison && comparisonHistory) {
        const compXData = comparisonHistory[xAxis]?.[timeScale] || [];
        const compYData = comparisonHistory[yAxis]?.[timeScale] || [];
        
        compActiveSources.forEach(source => { 
          const key = `${comparisonCityName}_${source}`;
          merged[key] = []; 
        });
        
        compXData.forEach((point, idx) => {
          const yPoint = compYData[idx];
          if (!yPoint) return;
          compActiveSources.forEach(source => {
            const xVal = point[source];
            const yVal = yPoint[source];
            if (typeof xVal === 'number' && typeof yVal === 'number') {
              const key = `${comparisonCityName}_${source}`;
              merged[key].push({ 
                x: xVal, 
                y: yVal, 
                city: comparisonCityName,
                source: source
              });
            }
          });
        });
      }
      
      return merged;
    } else {
      const mainData = history[yAxis][timeScale];
      
      if (isComparison) {
        const compData = comparisonHistory[yAxis][timeScale];
        // Merge data by timestamp (index)
        // Assuming both arrays are aligned by time (which they should be for the same timeScale)
        return mainData.map((point, idx) => {
          const compPoint = compData[idx] || {};
          const mergedPoint = { ...point };
          
          // Add comparison data with prefix
          Object.keys(compPoint).forEach(key => {
            if (key !== 'timestamp') {
              mergedPoint[`COMP_${key}`] = compPoint[key];
            }
          });
          return mergedPoint;
        });
      }
      
      return mainData;
    }
  }, [history, forecast, xAxis, yAxis, timeScale, mainActiveSources, compActiveSources, isScatter, comparisonHistory, isComparison, mainCityName, comparisonCityName]);

  // Determine relevant sources based on what's available in the data
  const relevantSources = useMemo(() => {
    const checkMetric = isScatter ? xAxis : yAxis; 
    if (checkMetric === 'aqi') return ['OpenAQ', 'UrbanEmission', 'Google'];
    // Use availableSources instead of hardcoding KSNDMC
    return availableSources.length > 0 ? availableSources : ['IMD', 'WeatherUnion', 'OpenWeather', 'OpenAQ'];
  }, [xAxis, yAxis, isScatter, availableSources]);

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col shadow-xl overflow-hidden">
      
      {/* Header / Controls */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
           <div>
             <h3 className="text-slate-100 font-semibold flex items-center gap-2">
               {isScatter ? 'Correlation Analysis' : 'Historical Trends'}
               {isComparison && (
                 <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                   Comparing vs {comparisonCityName}
                 </span>
               )}
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
                 <XAxis 
                   type="number" 
                   dataKey="x" 
                   name={xAxis} 
                   unit={getUnit(xAxis)} 
                   stroke="#64748b"
                   domain={['auto', 'auto']}
                   allowDataOverflow
                 />
                 <YAxis 
                   type="number" 
                   dataKey="y" 
                   name={yAxis} 
                   unit={getUnit(yAxis)} 
                   stroke="#64748b"
                   domain={['auto', 'auto']}
                   allowDataOverflow
                 />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      
                      // Collect ALL points from the payload (multiple Scatter series may be present)
                      const allPoints = [];
                      
                      payload.forEach(entry => {
                        if (!entry || !entry.payload) return;
                        
                        // Get city and source from each entry
                        let cityName = entry.payload.city;
                        let sourceName = entry.payload.source;
                        
                        // Fallback: parse from entry.name (format: "CityName_Source")
                        if (!cityName || !sourceName) {
                          const scatterName = entry.name;
                          if (scatterName && typeof scatterName === 'string' && scatterName.includes('_')) {
                            const lastUnderscoreIdx = scatterName.lastIndexOf('_');
                            if (lastUnderscoreIdx > 0) {
                              cityName = cityName || scatterName.substring(0, lastUnderscoreIdx);
                              sourceName = sourceName || scatterName.substring(lastUnderscoreIdx + 1);
                            }
                          }
                        }
                        
                        if (cityName && sourceName) {
                          allPoints.push({
                            city: cityName,
                            source: sourceName,
                            color: COLORS[sourceName] || entry.fill || '#6366f1',
                            x: entry.payload.x,
                            y: entry.payload.y,
                            isCompCity: cityName === comparisonCityName
                          });
                        }
                      });
                      
                      if (allPoints.length === 0) return null;
                      
                      // Get the x/y values (same for all overlapping points)
                      const xValue = allPoints[0].x;
                      const yValue = allPoints[0].y;
                      const xFormatted = typeof xValue === 'number' ? xValue.toFixed(1) : '-';
                      const yFormatted = typeof yValue === 'number' ? yValue.toFixed(1) : '-';
                      
                      // Check if we have mixed cities
                      const hasMainCity = allPoints.some(p => !p.isCompCity);
                      const hasCompCity = allPoints.some(p => p.isCompCity);
                      
                      return (
                        <div style={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569', 
                          borderRadius: '8px',
                          padding: '12px',
                          minWidth: '220px',
                          maxWidth: '280px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                        }}>
                          {/* Values Header */}
                          <div style={{ 
                            fontSize: '12px',
                            color: '#94a3b8',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #334155'
                          }}>
                            <span style={{ color: '#818cf8', fontWeight: '600' }}>{xAxis.toLowerCase()}: </span>
                            <span style={{ color: '#e2e8f0' }}>{xFormatted}{getUnit(xAxis)}</span>
                            <span style={{ color: '#475569', margin: '0 6px' }}>|</span>
                            <span style={{ color: '#fb923c', fontWeight: '600' }}>{yAxis.toLowerCase()}: </span>
                            <span style={{ color: '#e2e8f0' }}>{yFormatted}{getUnit(yAxis)}</span>
                          </div>
                          
                          {/* Count label if multiple points */}
                          {allPoints.length > 1 && (
                            <div style={{ 
                              fontSize: '11px',
                              color: '#64748b',
                              marginBottom: '8px'
                            }}>
                              {allPoints.length} overlapping points:
                            </div>
                          )}
                          
                          {/* Scrollable list of points */}
                          <div style={{ 
                            maxHeight: '150px', 
                            overflowY: allPoints.length > 4 ? 'auto' : 'visible',
                            paddingRight: allPoints.length > 4 ? '4px' : '0'
                          }}>
                            {allPoints.map((point, idx) => (
                              <div 
                                key={`${point.city}-${point.source}-${idx}`}
                                style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '4px 0',
                                  borderLeft: point.isCompCity ? '2px solid #f97316' : '2px solid #6366f1',
                                  paddingLeft: '8px',
                                  marginBottom: '4px'
                                }}
                              >
                                {/* Color dot */}
                                <div style={{ 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%', 
                                  backgroundColor: point.color,
                                  flexShrink: 0
                                }} />
                                
                                {/* City name */}
                                <span style={{ 
                                  color: point.isCompCity ? '#fb923c' : '#818cf8', 
                                  fontWeight: '600', 
                                  fontSize: '12px'
                                }}>
                                  {point.city}
                                </span>
                                
                                {/* Source name */}
                                <span style={{ 
                                  color: '#94a3b8', 
                                  fontSize: '11px',
                                  marginLeft: 'auto'
                                }}>
                                  ({point.source})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                 {/* Zoom brush for X-axis */}
                 <Brush 
                   dataKey="x" 
                   height={30} 
                   stroke="#6366f1"
                   fill="#1e293b"
                   startIndex={0}
                 />
                  {/* Render scatter points for each City_Source combination */}
                  {Object.keys(chartData).map((key) => {
                    const data = chartData[key];
                    if (!data || data.length === 0) return null;
                    
                    // Extract city and source from key (format: "CityName_Source")
                    const lastUnderscoreIdx = key.lastIndexOf('_');
                    const cityName = key.substring(0, lastUnderscoreIdx);
                    const sourceName = key.substring(lastUnderscoreIdx + 1);
                    
                    // Determine if this is comparison city
                    const isCompCity = cityName === comparisonCityName;
                    
                    // Filter based on per-city active sources
                    const cityActiveSources = isCompCity ? compActiveSources : mainActiveSources;
                    if (!cityActiveSources.includes(sourceName)) return null;
                    
                    const sourceIdx = relevantSources.indexOf(sourceName);
                    
                    // Apply jitter to prevent exact overlap
                    const jitteredData = data.map((point, i) => ({
                      ...point,
                      x: point.x + (sourceIdx - 2) * 0.15 + (i % 3 - 1) * 0.05 + (isCompCity ? 0.08 : 0),
                      y: point.y + (sourceIdx - 2) * 0.1 + ((i + sourceIdx) % 3 - 1) * 0.05 + (isCompCity ? -0.05 : 0)
                    }));
                    
                    // Custom shape function that maintains data association
                    const renderShape = (props) => {
                      const { cx, cy } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isCompCity ? 5 : 4}
                          fill={COLORS[sourceName]}
                          stroke={isCompCity ? '#fff' : '#1e293b'}
                          strokeWidth={isCompCity ? 2 : 1}
                          strokeDasharray={isCompCity ? '2,2' : undefined}
                        />
                      );
                    };
                    
                    return (
                      <Scatter 
                        key={key} 
                        name={key} 
                        data={jitteredData} 
                        fill={COLORS[sourceName]}
                        opacity={highlightSource && highlightSource !== sourceName ? 0.15 : 0.8}
                        shape={renderShape}
                      />
                    );
                  })}
               </ScatterChart>
             ) : (
               <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis 
                   dataKey="timestamp" 
                   stroke="#64748b" 
                   tick={{fontSize: 10}} 
                   angle={-45}
                   textAnchor="end"
                   height={70}
                   domain={zoomLeft && zoomRight ? [zoomLeft, zoomRight] : ['auto', 'auto']}
                 />
                 <YAxis stroke="#64748b" tick={{fontSize: 11}} domain={['auto', 'auto']} unit={getUnit(yAxis)} />
                 <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      
                      // Separate main and comparison data
                      const mainData = payload.filter(p => !p.dataKey?.startsWith('COMP_'));
                      const compData = payload.filter(p => p.dataKey?.startsWith('COMP_'));
                      
                      // Filter based on per-city active sources
                      const filteredMainData = mainData.filter(p => {
                        if (p.dataKey === 'KSNDMC' && !mainCityIsKarnataka) return false;
                        return mainActiveSources.includes(p.dataKey);
                      });
                      
                      const filteredCompData = compData.filter(p => {
                        const sourceName = p.dataKey?.replace('COMP_', '');
                        if (sourceName === 'KSNDMC' && !comparisonCityIsKarnataka) return false;
                        return compActiveSources.includes(sourceName);
                      });
                      
                      return (
                        <div style={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569', 
                          borderRadius: '8px',
                          padding: '12px',
                          minWidth: isComparison ? '280px' : '160px'
                        }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8', 
                            marginBottom: '8px',
                            borderBottom: '1px solid #334155',
                            paddingBottom: '6px'
                          }}>
                            {label}
                          </div>
                          
                          {isComparison ? (
                            // Table format for comparison
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '4px 8px', color: '#64748b' }}>Source</th>
                                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#818cf8', borderLeft: '1px solid #334155' }}>{mainCityName || 'Main'}</th>
                                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#fb923c', borderLeft: '1px solid #334155' }}>{comparisonCityName}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMainData.map((entry, idx) => {
                                  const compEntry = filteredCompData.find(c => c.dataKey === `COMP_${entry.dataKey}`);
                                  return (
                                    <tr key={idx} style={{ borderTop: '1px solid #334155' }}>
                                      <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
                                        <span style={{ color: '#e2e8f0' }}>{entry.dataKey}</span>
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '4px 8px', color: '#818cf8', fontWeight: '600', borderLeft: '1px solid #334155' }}>
                                        {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '4px 8px', color: '#fb923c', fontWeight: '600', borderLeft: '1px solid #334155' }}>
                                        {compEntry ? (typeof compEntry.value === 'number' ? compEntry.value.toFixed(1) : compEntry.value) : '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            // Simple list for single city
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {filteredMainData.map((entry, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
                                    <span style={{ color: '#e2e8f0', fontSize: '11px' }}>{entry.dataKey}</span>
                                  </div>
                                  <span style={{ color: entry.color, fontWeight: '600', fontSize: '11px' }}>
                                    {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                 />
                 
                 {/* Zoom/Pan Brush at bottom of chart */}
                 <Brush 
                   dataKey="timestamp" 
                   height={30} 
                   stroke="#6366f1"
                   fill="#1e293b"
                   tickFormatter={(value) => value?.slice(0, 5) || ''}
                 />
                 
                 {relevantSources.map(source => {
                    // Check if source is active for each city
                    const mainActive = mainActiveSources.includes(source);
                    const compActive = compActiveSources.includes(source);
                    
                    return (
                      <React.Fragment key={source}>
                        {/* Main City Line - SOLID */}
                        {mainActive && (
                          <Line
                            type="monotone"
                            dataKey={source}
                            stroke={COLORS[source]}
                            strokeWidth={highlightSource === source ? 3 : 2}
                            strokeDasharray={undefined}  /* SOLID line for main city */
                            dot={false}
                            activeDot={{ r: 6 }}
                            name={source}
                            opacity={highlightSource && highlightSource !== source ? 0.15 : 1}
                          />
                        )}
                        {/* Comparison City Line - DASHED with lower opacity */}
                        {isComparison && compActive && (
                          <Line
                            type="monotone"
                            dataKey={`COMP_${source}`}
                            stroke={COLORS[source]}
                            strokeWidth={2}
                            strokeDasharray="8 4"  /* DASHED line for comparison city */
                            dot={false}
                            activeDot={{ r: 4 }}
                            name={`COMP_${source}`}
                            opacity={highlightSource && highlightSource !== source ? 0.1 : 0.5}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
               </LineChart>
             )}
           </ResponsiveContainer>
        </div>

        {/* Sidebar / Legend */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-700 bg-slate-800/80 p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
           
           {/* Comparison Mode: Split City Boxes */}
           {isComparison ? (
             <div className="space-y-4">
               {/* Main City Box */}
               <div className="bg-slate-900/60 border border-indigo-500/50 rounded-lg overflow-hidden">
                 <div className="bg-indigo-500/20 px-3 py-2 border-b border-indigo-500/30">
                   <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                     <div className="w-3 h-0.5 bg-indigo-400"></div>
                     {mainCityName || 'Main City'}
                   </h4>
                   <p className="text-[10px] text-slate-400 mt-0.5">Solid lines</p>
                 </div>
                 <div className="p-3">
                   <div className="flex flex-wrap gap-1.5">
                     {relevantSources.map(source => {
                       const isActive = mainActiveSources.includes(source);
                       return (
                         <button
                           key={source}
                           onClick={() => toggleMainSource(source)}
                           className={clsx(
                             "px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1.5",
                             isActive
                               ? "bg-slate-700 border border-slate-600 text-white"
                               : "bg-slate-800/50 border border-slate-700/50 text-slate-500"
                           )}
                         >
                           <div 
                             className="w-2 h-2 rounded-full"
                             style={{ backgroundColor: COLORS[source] }}
                           />
                           {source}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               </div>

               {/* Comparison City Box */}
               <div className="bg-slate-900/60 border border-orange-500/50 rounded-lg overflow-hidden">
                 <div className="bg-orange-500/20 px-3 py-2 border-b border-orange-500/30">
                   <h4 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
                     <div className="w-3 h-0.5 bg-orange-400" style={{borderStyle: 'dashed'}}></div>
                     {comparisonCityName}
                   </h4>
                   <p className="text-[10px] text-slate-400 mt-0.5">Dashed lines</p>
                 </div>
                  <div className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {relevantSources.map(source => {
                        const isActive = compActiveSources.includes(source);
                        return (
                          <button
                            key={`comp_${source}`}
                            onClick={() => toggleCompSource(source)}
                            className={clsx(
                              "px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1.5",
                              isActive
                                ? "bg-slate-700 border border-slate-600 text-white"
                                : "bg-slate-800/50 border border-slate-700/50 text-slate-500"
                            )}
                          >
                            <div 
                              className="w-2 h-2 rounded-full opacity-60"
                              style={{ backgroundColor: COLORS[source] }}
                            />
                            {source}
                          </button>
                        );
                      })}
                    </div>
                  </div>
               </div>
             </div>
           ) : (
             /* Single City Mode: Original Layout */
             <div className="shrink-0">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                   Data Sources
                 </h4>
                 {highlightSource && (
                   <button 
                     onClick={() => setHighlightSource(null)}
                     className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                   >
                     <RotateCcw className="w-3 h-3" />
                     Show all
                   </button>
                 )}
               </div>
               <p className="text-[10px] text-slate-500 mb-3">Click to toggle • Double-click to focus</p>
                <div className="flex flex-wrap gap-2">
                  {relevantSources.map(source => {
                    const isActive = mainActiveSources.includes(source);
                    const isHighlighted = highlightSource === source;
                    return (
                      <button
                        key={source}
                        onClick={() => toggleMainSource(source)}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          setHighlightSource(isHighlighted ? null : source);
                        }}
                        className={clsx(
                           "px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2",
                           isHighlighted
                             ? "bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-400"
                             : isActive
                               ? "bg-slate-800 border-slate-600 text-white"
                               : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-slate-300 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={clsx(
                              "w-2.5 h-2.5 rounded-full transition-all",
                              isActive && "ring-2 ring-offset-1 ring-offset-slate-800"
                            )}
                            style={{
                              backgroundColor: COLORS[source],
                              ringColor: isActive ? COLORS[source] : undefined
                            }}
                          />
                          <div
                            className="w-4 h-0.5"
                            style={{
                              backgroundColor: COLORS[source],
                              opacity: isActive ? 1 : 0.3
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium">{source}</span>
                        {isHighlighted && <Eye className="w-3 h-3 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
             </div>
           )}

           {/* Dynamic Explanation */}
           <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 shrink-0">
              <h4 className="text-slate-300 font-medium mb-2 text-sm flex items-center gap-2">
                 <Info className="w-4 h-4 text-slate-400" />
                 Analysis
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isScatter 
                  ? `Scatter plot shows correlation between ${xAxis} and ${yAxis}. Clustered points = strong correlation.`
                  : isComparison
                    ? `Comparing ${yAxis}: solid lines = main city, dashed lines = ${comparisonCityName}.`
                    : `${yAxis} trends over ${timeScale.replace('h', ' hours').replace('d', ' days')}. Multiple sources shown for verification.`
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
  comparisonHistory: PropTypes.object,
  comparisonCityName: PropTypes.string,
  mainCityName: PropTypes.string,
};
