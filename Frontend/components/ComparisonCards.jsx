import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Wind, Gauge, TrendingUp, TrendingDown, Minus, ArrowUpDown, ChevronDown, Activity, CloudRain } from 'lucide-react';

// Source colors for visual identification
const SOURCE_COLORS = {
  IMD: { bg: 'bg-blue-500', text: 'text-blue-400' },
  WeatherUnion: { bg: 'bg-purple-500', text: 'text-purple-400' },
  OpenWeather: { bg: 'bg-cyan-500', text: 'text-cyan-400' },
  OpenAQ: { bg: 'bg-pink-500', text: 'text-pink-400' },
  GoogleAQI: { bg: 'bg-green-500', text: 'text-green-400' },
  OpenMeteo: { bg: 'bg-amber-500', text: 'text-amber-400' },
};

/**
 * ComparisonCards - Side-by-side city comparison with metric differences and source selection
 */
export const ComparisonCards = ({ 
  mainCity, 
  mainData, 
  comparisonCity, 
  comparisonData 
}) => {
  // State for selected sources for each city
  const [mainSource, setMainSource] = useState('auto');
  const [compSource, setCompSource] = useState('auto');
  
  // Helper to create source object (like SourceMatrix.makeSource)
  const makeSource = (name, val, unit) => ({
    source: name,
    displayName: name,
    isOfficial: false,
    value: val,
    unit,
    status: 'active',
    lastUpdated: '5m ago'
  });
  
  // Combine matrix with aqiBreakdown (like SourceMatrix.combinedMetrics)
  const combineMatrixWithAqi = (matrix, aqiData) => {
    const safeMatrix = matrix || [];
    const safeAqiData = aqiData || [];
    
    // Create AQI-related rows from aqiBreakdown
    const aqiRow = {
      metricId: 'aqi',
      label: 'Air Quality (AQI)',
      data: safeAqiData.map(d => makeSource(d.source, d.aqiValue, 'AQI'))
    };

    const pm25Row = {
      metricId: 'pm25',
      label: 'PM 2.5',
      data: safeAqiData.map(d => makeSource(d.source, d.pm25, 'µg/m³'))
    };

    const pm10Row = {
      metricId: 'pm10',
      label: 'PM 10',
      data: safeAqiData.map(d => makeSource(d.source, d.pm10, 'µg/m³'))
    };
    
    const no2Row = {
      metricId: 'no2',
      label: 'NO₂ Levels',
      data: safeAqiData.map(d => makeSource(d.source, d.no2, 'µg/m³'))
    };

    return [...safeMatrix, aqiRow, pm25Row, pm10Row, no2Row];
  };
  
  // Combined metrics for each city (matrix + aqiBreakdown)
  const mainCombinedMatrix = useMemo(() => 
    combineMatrixWithAqi(mainData?.matrix, mainData?.aqiBreakdown), 
    [mainData]
  );
  const compCombinedMatrix = useMemo(() => 
    combineMatrixWithAqi(comparisonData?.matrix, comparisonData?.aqiBreakdown), 
    [comparisonData]
  );
  
  // Get all available sources from combined matrix data
  const getAvailableSources = (matrix) => {
    if (!matrix || !Array.isArray(matrix)) return [];
    
    const sources = new Set();
    matrix.forEach(row => {
      row.data?.forEach(s => {
        if (s.status === 'active' && s.value !== null && s.value !== undefined && s.displayName) {
          sources.add(s.displayName);
        }
      });
    });
    return Array.from(sources);
  };
  
  const mainSources = useMemo(() => getAvailableSources(mainCombinedMatrix), [mainCombinedMatrix]);
  const compSources = useMemo(() => getAvailableSources(compCombinedMatrix), [compCombinedMatrix]);
  
  // Extract key metrics from combined matrix data with selected source
  const extractMetrics = (matrix, selectedSource) => {
    if (!matrix || !Array.isArray(matrix)) return {};
    
    const metrics = {};
    matrix.forEach(row => {
      let validSource;
      
      if (selectedSource === 'auto') {
        validSource = row.data?.find(s => s.status === 'active' && s.value !== null && s.value !== undefined);
      } else {
        validSource = row.data?.find(s => s.displayName === selectedSource && s.status === 'active' && s.value !== null && s.value !== undefined);
        if (!validSource) {
          validSource = row.data?.find(s => s.status === 'active' && s.value !== null && s.value !== undefined);
        }
      }
      
      if (validSource) {
        metrics[row.metricId] = {
          value: validSource.value,
          unit: validSource.unit || '',
          source: validSource.displayName
        };
      }
    });
    return metrics;
  };
  
  const mainMetrics = useMemo(() => extractMetrics(mainCombinedMatrix, mainSource), [mainCombinedMatrix, mainSource]);
  const compMetrics = useMemo(() => extractMetrics(compCombinedMatrix, compSource), [compCombinedMatrix, compSource]);
  
  // Define which metrics to compare - ALL metrics from SourceMatrix
  // Note: 'wind' and 'windSpeed' handle both old and new metricId formats
  const metricConfig = [
    { id: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', color: 'text-orange-400', format: v => v?.toFixed(1) },
    { id: 'humidity', label: 'Humidity', icon: Droplets, unit: '%', color: 'text-blue-400', format: v => Math.round(v) },
    { id: 'pressure', label: 'Pressure', icon: Gauge, unit: ' hPa', color: 'text-purple-400', format: v => v?.toFixed(1) },
    { id: 'windSpeed', altId: 'wind', label: 'Wind Speed', icon: Wind, unit: ' km/h', color: 'text-cyan-400', format: v => v?.toFixed(1) },
    { id: 'aqi', label: 'Air Quality (AQI)', icon: Activity, unit: '', color: 'text-green-400', format: v => Math.round(v) },
    { id: 'pm25', label: 'PM 2.5', icon: CloudRain, unit: ' µg/m³', color: 'text-pink-400', format: v => v?.toFixed(1) },
    { id: 'pm10', label: 'PM 10', icon: CloudRain, unit: ' µg/m³', color: 'text-rose-400', format: v => v?.toFixed(1) },
    { id: 'no2', label: 'NO₂ Levels', icon: Activity, unit: ' µg/m³', color: 'text-amber-400', format: v => v?.toFixed(1) },
  ];
  
  // Helper to get metric value with fallback to altId
  const getMetricValue = (metrics, config) => {
    return metrics[config.id] || (config.altId ? metrics[config.altId] : null);
  };
  
  // Calculate differences - now uses config for altId support
  const getDifference = (config) => {
    const mainMetric = getMetricValue(mainMetrics, config);
    const compMetric = getMetricValue(compMetrics, config);
    
    const mainVal = mainMetric?.value;
    const compVal = compMetric?.value;
    
    if (mainVal === undefined || compVal === undefined) return null;
    
    const diff = mainVal - compVal;
    return {
      value: diff,
      abs: Math.abs(diff),
      mainHigher: diff > 0,
      equal: Math.abs(diff) < 0.5
    };
  };
  
  // Get AQI color
  const getAqiColor = (value) => {
    if (!value) return 'text-slate-400';
    if (value <= 50) return 'text-green-400';
    if (value <= 100) return 'text-yellow-400';
    if (value <= 150) return 'text-orange-400';
    return 'text-red-400';
  };
  
  // Get difference description
  const getDifferenceText = (config) => {
    const diff = getDifference(config);
    if (!diff) return null;
    if (diff.equal) return 'Same';
    
    const higherCity = diff.mainHigher ? mainCity : comparisonCity;
    const absValue = config.format ? config.format(diff.abs) : diff.abs;
    
    switch (config.id) {
      case 'temperature':
        return `${higherCity} is ${absValue}°C ${diff.mainHigher ? 'warmer' : 'cooler'}`;
      case 'humidity':
        return `${higherCity} is ${absValue}% more humid`;
      case 'pressure':
        return `${higherCity} has ${absValue} hPa higher pressure`;
      case 'windSpeed':
        return `${higherCity} has ${absValue} km/h more wind`;
      case 'aqi':
        return diff.mainHigher 
          ? `${mainCity} has worse air quality (+${absValue})`
          : `${comparisonCity} has worse air quality (+${absValue})`;
      case 'pm25':
        return diff.mainHigher 
          ? `${mainCity} has higher PM2.5 (+${absValue} µg/m³)`
          : `${comparisonCity} has higher PM2.5 (+${absValue} µg/m³)`;
      case 'pm10':
        return diff.mainHigher 
          ? `${mainCity} has higher PM10 (+${absValue} µg/m³)`
          : `${comparisonCity} has higher PM10 (+${absValue} µg/m³)`;
      case 'no2':
        return diff.mainHigher 
          ? `${mainCity} has higher NO₂ (+${absValue} µg/m³)`
          : `${comparisonCity} has higher NO₂ (+${absValue} µg/m³)`;
      default:
        return `Difference: ${absValue}`;
    }
  };

  // Source Selector Component - Now positioned below header with full width
  const SourceSelector = ({ sources, selected, onChange, accentColor }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const displayText = selected === 'auto' ? 'Best Available' : selected;
    
    return (
      <div className="relative w-full mt-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border ${accentColor === 'indigo' ? 'border-indigo-500/30 hover:border-indigo-500/50' : 'border-orange-500/30 hover:border-orange-500/50'} transition-colors text-sm`}
        >
          <span className="text-slate-400 text-xs">Data Source:</span>
          <div className="flex items-center gap-2">
            <span className={`${accentColor === 'indigo' ? 'text-indigo-300' : 'text-orange-300'} font-medium`}>
              {displayText}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 overflow-hidden">
              {/* Auto Option */}
              <button
                onClick={() => { onChange('auto'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors flex items-center gap-3 ${selected === 'auto' ? 'bg-slate-700' : ''}`}
              >
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                <span className="text-slate-200">Best Available</span>
                {selected === 'auto' && <span className="ml-auto text-green-400">✓</span>}
              </button>
              
              {/* Divider */}
              <div className="border-t border-slate-700 my-1"></div>
              
              {/* Source Options */}
              {sources.length > 0 ? (
                sources.map(source => (
                  <button
                    key={source}
                    onClick={() => { onChange(source); setIsOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors flex items-center gap-3 ${selected === source ? 'bg-slate-700' : ''}`}
                  >
                    <div className={`w-3 h-3 ${SOURCE_COLORS[source]?.bg || 'bg-slate-500'} rounded-full`}></div>
                    <span className={`${SOURCE_COLORS[source]?.text || 'text-slate-300'}`}>{source}</span>
                    {selected === source && <span className="ml-auto text-green-400">✓</span>}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2.5 text-sm text-slate-500">No sources available</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Side-by-Side Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Main City Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 rounded-xl p-5 border border-indigo-500/40 shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-indigo-500/30">
            <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
            <h3 className="text-lg font-bold text-white">{mainCity}</h3>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Primary</span>
          </div>
          
          {/* Source Selector - Below header */}
          <SourceSelector 
            sources={mainSources} 
            selected={mainSource} 
            onChange={setMainSource}
            accentColor="indigo"
          />
          
          {/* Metrics */}
          <div className="space-y-3 mt-4">
            {metricConfig.map(config => {
              const metric = getMetricValue(mainMetrics, config);
              const Icon = config.icon;
              return (
                <div key={config.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{config.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${config.id === 'aqi' ? getAqiColor(metric?.value) : config.color}`}>
                    {metric?.value !== undefined 
                      ? `${config.format ? config.format(metric.value) : metric.value}${config.unit}`
                      : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Comparison City Card */}
        <div className="bg-gradient-to-br from-orange-900/40 to-slate-900/60 rounded-xl p-5 border border-orange-500/40 shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-orange-500/30">
            <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
            <h3 className="text-lg font-bold text-white">{comparisonCity}</h3>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">Compare</span>
          </div>
          
          {/* Source Selector - Below header */}
          <SourceSelector 
            sources={compSources} 
            selected={compSource} 
            onChange={setCompSource}
            accentColor="orange"
          />
          
          {/* Metrics */}
          <div className="space-y-3 mt-4">
            {metricConfig.map(config => {
              const metric = getMetricValue(compMetrics, config);
              const Icon = config.icon;
              return (
                <div key={config.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{config.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${config.id === 'aqi' ? getAqiColor(metric?.value) : config.color}`}>
                    {metric?.value !== undefined 
                      ? `${config.format ? config.format(metric.value) : metric.value}${config.unit}`
                      : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Differences Section */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="w-5 h-5 text-purple-400" />
          <h4 className="text-md font-semibold text-slate-200">Key Differences</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metricConfig.map(config => {
            const diff = getDifference(config);
            const diffText = getDifferenceText(config);
            const Icon = config.icon;
            
            if (!diff) return null;
            
            return (
              <div 
                key={config.id}
                className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-3 border border-slate-700/30"
              >
                <div className={`p-2 rounded-lg ${diff.equal ? 'bg-slate-700' : diff.mainHigher ? 'bg-indigo-900/50' : 'bg-orange-900/50'}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{config.label}</div>
                  <div className="text-sm text-slate-200 font-medium flex items-center gap-1">
                    {diff.equal ? (
                      <>
                        <Minus className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400">No significant difference</span>
                      </>
                    ) : (
                      <>
                        {diff.mainHigher ? (
                          <TrendingUp className="w-3 h-3 text-indigo-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-orange-400" />
                        )}
                        <span>{diffText}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Comparison Table View */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="bg-slate-800/80 px-5 py-3 border-b border-slate-700/50">
          <h4 className="text-md font-semibold text-slate-200">Detailed Comparison Table</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-400">Metric</th>
                <th className="text-right px-5 py-3 text-sm font-semibold text-indigo-400">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    {mainCity}
                  </div>
                </th>
                <th className="text-right px-5 py-3 text-sm font-semibold text-orange-400">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    {comparisonCity}
                  </div>
                </th>
                <th className="text-center px-5 py-3 text-sm font-semibold text-slate-400">Difference</th>
              </tr>
            </thead>
            <tbody>
            {metricConfig.map((config, idx) => {
                const mainMetric = getMetricValue(mainMetrics, config);
                const compMetric = getMetricValue(compMetrics, config);
                const mainVal = mainMetric?.value;
                const compVal = compMetric?.value;
                const diff = getDifference(config);
                const Icon = config.icon;
                
                return (
                  <tr 
                    key={config.id} 
                    className={`border-t border-slate-800 ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm text-slate-300">{config.label}</span>
                      </div>
                    </td>
                    <td className="text-right px-5 py-4">
                      <span className={`text-lg font-bold ${config.id === 'aqi' ? getAqiColor(mainVal) : 'text-white'}`}>
                        {mainVal !== undefined 
                          ? `${config.format ? config.format(mainVal) : mainVal}${config.unit}`
                          : '-'}
                      </span>
                    </td>
                    <td className="text-right px-5 py-4">
                      <span className={`text-lg font-bold ${config.id === 'aqi' ? getAqiColor(compVal) : 'text-white'}`}>
                        {compVal !== undefined 
                          ? `${config.format ? config.format(compVal) : compVal}${config.unit}`
                          : '-'}
                      </span>
                    </td>
                    <td className="text-center px-5 py-4">
                      {diff ? (
                        <div className="flex items-center justify-center gap-2">
                          {diff.equal ? (
                            <span className="text-sm text-slate-500">—</span>
                          ) : (
                            <>
                              <span className={`text-sm font-semibold ${diff.mainHigher ? 'text-indigo-400' : 'text-orange-400'}`}>
                                {diff.mainHigher ? '+' : '-'}{config.format ? config.format(diff.abs) : diff.abs.toFixed(1)}{config.unit}
                              </span>
                              {diff.mainHigher ? (
                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-orange-400" />
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

ComparisonCards.propTypes = {
  mainCity: PropTypes.string.isRequired,
  mainData: PropTypes.shape({
    matrix: PropTypes.array
  }),
  comparisonCity: PropTypes.string.isRequired,
  comparisonData: PropTypes.shape({
    matrix: PropTypes.array
  })
};

export default ComparisonCards;
