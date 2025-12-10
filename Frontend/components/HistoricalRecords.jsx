
import React, { useState, useEffect } from 'react';
import {
  fetchHistoricalRecords,
  fetchTypicalComparison,
  fetchLongTermTrends,
  fetchHistoricalDate
} from '../services/weatherService';
import {
  Thermometer,
  Droplet,
  Wind,
  Cloud,
  Activity,
  TrendingUp,
  AlertTriangle,
  Flag
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
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 h-32">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-slate-900/50 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{title}</div>
        <div className="text-xs text-slate-500 mt-2 italic">
          {type === 'aqi' ? 'AQI data not available in Visual Crossing API' : 'API quota exceeded or data unavailable'}
        </div>
      </div>
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
        <Flag className="w-5 h-5 text-indigo-400" />
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
  // Hide Long-Term Trends section entirely for fallback cities
  if (isFallback) {
    return null;
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

export const HistoricalRecords = ({ cityId, cityName, currentData, history, isFallback }) => {
  const [records, setRecords] = useState(null);
  const [typical, setTypical] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // For fallback cities (not in database), skip local calculation
      if (isFallback) {
        setRecords(null);  // Don't calculate from 7-day history
        setTypical(null);
        setTrends(null);
        setLoading(false);
        return;
      }

    if (!cityName && !cityId) {
      setLoading(false);
      return;
    }

      try {
        const [recordsData, typicalData, trendsData] = await Promise.all([
          fetchHistoricalRecords(cityName || cityId),  // Use cityName first, fallback to cityId
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
  }, [cityId, cityName, isFallback, history]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading historical records...</div>;

  if (!records && !typical && !trends && !isFallback) return null;

  const showWarning = isFallback && (!records || !records.hottest);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-100">Historical Records & Context</h2>
        </div>
        {records?.source && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-200">
              {records.source === 'Visual Crossing API' ? (
                <>via <span className="text-emerald-400 font-semibold">Visual Crossing API</span> • {records.dataPoints || 0} days</>
              ) : (
                <><span className="text-blue-400 font-semibold">Database</span> • {records.dataPoints || 0} days</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Warning Message for Limited Data */}
      {showWarning && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-200 mb-1">Extended Historical Data Unavailable</h3>
              <p className="text-xs text-amber-300/80">
                This city is not in our tracking database. Historical records are limited to 1 year of data from Visual Crossing API (subject to quota limits).
              </p>
            </div>
          </div>
        </div>
      )}

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
          icon={Cloud}
          color="text-blue-400"
        />
        <RecordCard
          title={isFallback ? "Worst AQI (Recent)" : "Worst Air Quality"}
          data={records?.worstAqi}
          type="aqi"
          icon={Wind}
          color="text-emerald-400"
        />
      </div>

      {/* Interactive Date Explorer */}
      <DateExplorer cityName={cityName} />

      {/* Typical Comparison */}
      <TypicalComparison data={typical} currentData={currentData} />

      {/* Long Term Trends */}
      <LongTermTrends data={trends} isFallback={isFallback} />

      {/* Visual Crossing API Limitation Message */}
      {!isFallback && (
        <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            💡 <strong className="text-slate-300">For 10+ years of comprehensive climate analysis</strong>, add this city to the tracking database.
            Currently showing up to 1 year via Visual Crossing API.
          </p>
        </div>
      )}
    </div>
  );
};

// Date Explorer Component
const DateExplorer = ({ cityName }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [dateData, setDateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ];

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);

    const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    try {
      const result = await fetchHistoricalDate(cityName, date);
      setDateData(result);
    } catch (err) {
      setError(err.message || 'No data available for this date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">📅 Explore Historical Data</h3>

      {/* Date Selectors */}
      <div className="grid grid-cols-4 gap-3">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(Number(e.target.value))}
          className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
        >
          {days.map(day => <option key={day} value={day}>{day}</option>)}
        </select>

        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {loading ? 'Loading...' : 'View Data'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Weather Display */}
      {dateData && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="text-xs text-slate-400 mb-1">Temperature</div>
            <div className="text-2xl font-bold text-orange-400">
              {dateData.data.temperature !== null ? `${dateData.data.temperature}°C` : 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="text-xs text-slate-400 mb-1">Precipitation</div>
            <div className="text-2xl font-bold text-blue-400">
              {dateData.data.precipitation}mm
            </div>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="text-xs text-slate-400 mb-1">Humidity</div>
            <div className="text-2xl font-bold text-cyan-400">
              {dateData.data.humidity !== null ? `${dateData.data.humidity}%` : 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="text-xs text-slate-400 mb-1">Conditions</div>
            <div className="text-sm font-semibold text-slate-200 capitalize">
              {dateData.data.conditions}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

