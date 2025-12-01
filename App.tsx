
import React, { useEffect, useState } from 'react';
import { SearchHeader } from './components/SearchHeader';
import { SourceMatrix } from './components/SourceMatrix';
import { UnifiedGraph } from './components/TrendChart';
import { MapWidget } from './components/MapWidget';
import { InsightsPanel } from './components/InsightsPanel';
import { fetchCityData } from './services/weatherService';
import { CityData } from './types';
import { Activity, Lightbulb } from 'lucide-react';

export default function App() {
  const [city, setCity] = useState('Bengaluru');
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(['Bengaluru', 'Mumbai', 'Delhi']);

  const loadData = async (cityName: string) => {
    setLoading(true);
    try {
      const result = await fetchCityData(cityName);
      setData(result);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(city);
  }, [city]);

  const toggleFavorite = (c: string) => {
    if (favorites.includes(c)) {
      setFavorites(favorites.filter(f => f !== c));
    } else {
      setFavorites([...favorites, c]);
    }
  };

  if (!data) return <div className="bg-slate-950 h-screen flex items-center justify-center text-slate-500 font-mono">Initializing EcoSense Neural Network...</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-200">
      <SearchHeader 
        currentCity={city} 
        onSearch={setCity} 
        favorites={favorites} 
        toggleFavorite={toggleFavorite}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8">
        
        {/* Top Section: Map Viewport - Full Width */}
        <div className="w-full h-[350px] lg:h-[450px] rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
           <MapWidget cityData={data} />
        </div>

        {/* Historical Insights (Section B) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Historical Context & Alerts</h3>
          </div>
          <InsightsPanel insights={data.insights} />
        </div>

        {/* Middle Section: Metric Grid (Cards) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-400" />
              Live Conditions & Consensus
            </h2>
            <span className="text-xs text-slate-500 hidden sm:block">Click cards for detailed source comparison</span>
          </div>
          
          {loading ? (
             <div className="h-48 bg-slate-900/50 rounded-xl animate-pulse flex items-center justify-center text-slate-600">
               Aggregating Multi-Source Data...
             </div>
          ) : (
            <SourceMatrix matrix={data.matrix} aqiData={data.aqiBreakdown} />
          )}
        </div>

        {/* Bottom Section: Unified Graph (Trend + Forecast) */}
        <div className="w-full pb-8">
           <div className="h-[650px]">
             <UnifiedGraph history={data.history} forecast={data.forecast} />
           </div>
        </div>

      </main>
    </div>
  );
}
