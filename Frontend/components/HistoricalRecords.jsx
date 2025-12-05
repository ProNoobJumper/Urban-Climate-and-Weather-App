import React, { useState, useEffect } from 'react';
import { 
  fetchHistoricalRecords, 
  fetchTypicalComparison, 
  fetchLongTermTrends 
} from '../services/weatherService';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  Activity, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const RecordCard = ({ title, data, icon: Icon, color, type }) => {
  if (!data) return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center justify-center h-32">
      <div className="text-slate-500 text-sm">No record data</div>
    </div>
  );

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-slate-900/50 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded-full">
          {new Date(data.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div className="mt-2">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{title}</div>
        <div className="text-2xl font-bold text-slate-100 mt-1">
          {data.value}
          <span className="text-sm text-slate-500 font-normal ml-1">{data.unit}</span>
        </div>
      </div>
    </div>
  );
};

const TypicalComparison = ({ data, currentData }) => {
  if (!data || !data.typical) return null;

  const { typical, month } = data;
  const currentTemp = currentData?.temperature;
  const tempDiff = currentTemp ? (currentTemp - typical.avgTemperature).toFixed(1) : null;
  const isWarmer = tempDiff > 0;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-slate-200">Today vs. Typical {month}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Temperature Comparison */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm text-slate-400 mb-1">Current Temperature</div>
              <div className="text-3xl font-bold text-slate-100">{currentTemp}°C</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Typical Average</div>
              <div className="text-3xl font-bold text-slate-400">{typical.avgTemperature}°C</div>
            </div>
          </div>

          {/* Visual Bar */}
          <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
            {/* Center Marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 z-10"></div>
            
            {/* Bar */}
            {tempDiff !== null && (
              <div 
                className={`absolute top-0 bottom-0 transition-all duration-500 ${isWarmer ? 'bg-orange-500 left-1/2' : 'bg-cyan-500 right-1/2'}`}
                style={{ width: `${Math.min(Math.abs(tempDiff) * 5, 50)}%` }} // Scale width
              ></div>
            )}
          </div>

          <div className="text-center text-sm">
            {tempDiff !== null ? (
              <span className={isWarmer ? 'text-orange-400' : 'text-cyan-400'}>
                {Math.abs(tempDiff)}°C {isWarmer ? 'warmer' : 'cooler'} than average
              </span>
            ) : (
              <span className="text-slate-500">No current data</span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/30 p-3 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Typical High</div>
            <div className="text-lg font-semibold text-orange-300">{typical.maxTemperature}°C</div>
          </div>
          <div className="bg-slate-900/30 p-3 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Typical Low</div>
            <div className="text-lg font-semibold text-cyan-300">{typical.minTemperature}°C</div>
          </div>
          <div className="bg-slate-900/30 p-3 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Typical AQI</div>
            <div className="text-lg font-semibold text-emerald-300">{typical.aqi}</div>
          </div>
          <div className="bg-slate-900/30 p-3 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Data Points</div>
            <div className="text-lg font-semibold text-slate-400">{typical.dataPoints}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LongTermTrends = ({ data, isFallback }) => {
  if (isFallback) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mt-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <h3 className="text-xl font-bold text-slate-100 mb-2">Long-Term Trends Unavailable</h3>
          <p className="text-slate-400 max-w-md mb-4">
            Decade-level climate analysis requires this city to be in our database. 
            Currently showing limited data from Open-Meteo.
          </p>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
            Add City to Database
          </button>
        </div>
        
        {/* Blurred Background Content */}
        <div className="opacity-20 filter blur-sm pointer-events-none">
           <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-slate-200">Long-Term Trends (Yearly Average)</h3>
          </div>
          <div className="h-64 w-full bg-slate-800/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.trends || data.trends.length === 0) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-slate-200">Long-Term Trends (Yearly Average)</h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              unit="°C"
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="avgTemperature" 
              name="Avg Temp (°C)" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#f97316' }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="aqi" 
              name="Avg AQI" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const HistoricalRecords = ({ cityId, currentData, history, isFallback }) => {
  const [records, setRecords] = useState(null);
  const [typical, setTypical] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (isFallback) {
        // Calculate local records from available history (usually 7-14 days)
        if (history) {
          const temps = history.temperature || [];
          const rains = history.precipitation || []; // Assuming precipitation exists in history
          const aqis = history.aqi || [];

          // Helper to find max/min
          const findMax = (arr) => arr.length ? arr.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null;
          const findMin = (arr) => arr.length ? arr.reduce((prev, current) => (prev.value < current.value) ? prev : current) : null;

          setRecords({
            hottest: findMax(temps) ? { ...findMax(temps), unit: '°C' } : null,
            coldest: findMin(temps) ? { ...findMin(temps), unit: '°C' } : null,
            wettest: findMax(rains) ? { ...findMax(rains), unit: 'mm' } : null,
            worstAqi: findMax(aqis) ? { ...findMax(aqis), unit: 'AQI' } : null
          });

          // Mock typical data or leave null
          setTypical(null); 
          setTrends(null);
        }
        setLoading(false);
        return;
      }

      if (!cityId) return;
      
      try {
        const [recordsData, typicalData, trendsData] = await Promise.all([
          fetchHistoricalRecords(cityId),
          fetchTypicalComparison(cityId),
          fetchLongTermTrends(cityId)
        ]);
        
        setRecords(recordsData);
        setTypical(typicalData);
        setTrends(trendsData);
      } catch (err) {
        console.error("Failed to load historical records", err);
        setError("Failed to load historical data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cityId, isFallback, history]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading historical records...</div>;
  if (!records && !typical && !trends && !isFallback) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-100">Historical Records & Context</h2>
        </div>
        {isFallback && (
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">
            Limited Data (Open-Meteo)
          </span>
        )}
      </div>

      {/* Extreme Records Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RecordCard 
          title={isFallback ? "Hottest (Recent)" : "Hottest Day"} 
          data={records?.hottest} 
          icon={Thermometer} 
          color="text-orange-400" 
        />
        <RecordCard 
          title={isFallback ? "Coldest (Recent)" : "Coldest Day"} 
          data={records?.coldest} 
          icon={Thermometer} 
          color="text-cyan-400" 
        />
        <RecordCard 
          title={isFallback ? "Wettest (Recent)" : "Wettest Day"} 
          data={records?.wettest} 
          icon={CloudRain} 
          color="text-blue-400" 
        />
        <RecordCard 
          title={isFallback ? "Worst AQI (Recent)" : "Worst Air Quality"} 
          data={records?.worstAqi} 
          icon={Wind} 
          color="text-emerald-400" 
        />
      </div>

      {/* Typical Comparison */}
      <TypicalComparison data={typical} currentData={currentData} />

      {/* Long Term Trends */}
      <LongTermTrends data={trends} isFallback={isFallback} />
    </div>
  );
};
