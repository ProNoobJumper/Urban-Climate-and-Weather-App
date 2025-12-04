import React, { useEffect, useState, useCallback } from 'react';
import { SearchHeader } from './components/SearchHeader';
import { SourceMatrix } from './components/SourceMatrix';
import { UnifiedGraph } from './components/TrendChart';
import { MapWidget } from './components/MapWidget';
import { InsightsPanel } from './components/InsightsPanel';
import { ErrorToast } from './components/ErrorToast';
import { fetchCityData } from './services/weatherService';
import { Activity, Lightbulb, MapPin } from 'lucide-react';
import './debug'; // Debug API keys

export default function App() {
  const [city, setCity] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(['Bengaluru', 'Mumbai', 'Delhi']);
  const [error, setError] = useState(null);

  const loadData = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCityData(cityName);
      setData(result);
      setCity(cityName);
    } catch (e) {
      console.error("Failed to fetch data", e);
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = useCallback((cityName) => {
    loadData(cityName);
  }, []);

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  useEffect(() => {
    // Try to get user's location on startup
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const locationData = await response.json();
          const detectedCity = locationData.city || locationData.locality;
          if (detectedCity) {
            setCity(detectedCity);
            loadData(detectedCity);
          }
        } catch (error) {
          console.error("Geolocation failed:", error);
          // Don't load any city - stay at India view
        }
      }, (error) => {
        console.log("Geolocation permission denied or failed:", error);
        // Don't load any city - stay at India view
      });
    }
    // If geolocation not supported, don't load any city - stay at India view
  }, []); // Run once on mount

  const toggleFavorite = (c) => {
    if (favorites.includes(c)) {
      setFavorites(favorites.filter(f => f !== c));
    } else {
      setFavorites([...favorites, c]);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-200">
      <SearchHeader 
        currentCity={city || ''} 
        onSearch={handleCitySelect} 
        favorites={favorites} 
        toggleFavorite={toggleFavorite}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8">
        
        {/* Top Section: Map Viewport - Full Width */}
        <div className="w-full h-[350px] lg:h-[450px] rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
           <MapWidget 
             key="main-map" 
             cityData={data} 
             cityName={city}
             onCitySelect={handleCitySelect}
             onError={handleError}
           />
        </div>

        {/* Error Toast */}
        {error && (
          <ErrorToast 
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Show data sections only when data is available */}
        {data ? (
          <>
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
          </>
        ) : (
          <div className="flex items-center justify-center h-64 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="text-center p-8">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Select a City</h3>
              <p className="text-sm text-slate-500">
                Search for a city, click on the map, or allow location access to view weather data
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
