import React, { useEffect, useState, useCallback } from 'react';
import { SearchHeader } from './components/SearchHeader';
import { SourceMatrix } from './components/SourceMatrix';
import { UnifiedGraph } from './components/TrendChart';
import { MapWidget } from './components/MapWidget';
import { InsightsPanel } from './components/InsightsPanel';
import { ErrorToast } from './components/ErrorToast';
import { ComparisonCards } from './components/ComparisonCards';
import { HistoricalRecords } from './components/HistoricalRecords';
import { AlertBanner } from './components/AlertBanner';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import ProfileDashboard from './components/ProfileDashboard';
import AuthCallback from './components/AuthCallback';
import { useAuth } from './contexts/AuthContext';
import { fetchCityData } from './services/weatherService';
import { Activity, Lightbulb, MapPin, BarChart3, User } from 'lucide-react';
import './debug'; // Debug API keys

export default function App() {
  const { isAuthenticated, loading: authLoading, login, register } = useAuth();
  const [city, setCity] = useState(null);
  const [data, setData] = useState(null);
  const [comparisonCity, setComparisonCity] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(['Bengaluru', 'Mumbai', 'Delhi']);
  const [error, setError] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  
  // Auth modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProfileDashboard, setShowProfileDashboard] = useState(false);

  const loadData = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCityData(cityName);
      setData(result);
      setCity(cityName);
      // Clear comparison when main city changes
      setComparisonCity(null);
      setComparisonData(null);
    } catch (e) {
      console.error("Failed to fetch data", e);
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (compareCityName) => {
    if (!compareCityName || compareCityName === city) return;
    
    try {
      const result = await fetchCityData(compareCityName);
      setComparisonData(result);
      setComparisonCity(compareCityName);
      setComparisonMode(false); // Turn off comparison mode after city is selected
    } catch (e) {
      console.error("Failed to fetch comparison data", e);
      setError(`Failed to load data for ${compareCityName}`);
    }
  };

  const handleClearComparison = () => {
    setComparisonCity(null);
    setComparisonData(null);
    setComparisonMode(false); // Also reset comparison mode
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

  const handleDownload = (format) => {
    if (data) {
      import('./services/downloadUtils').then(module => {
        module.downloadData(data, format);
      });
    }
  };

  // Handle OAuth callback route
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // Show landing page if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <>
        <LandingPage 
          onLoginClick={() => setShowLoginModal(true)}
          onRegisterClick={() => setShowRegisterModal(true)}
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={login}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onRegister={register}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-200">
      <SearchHeader 
        currentCity={city || ''} 
        onSearch={handleCitySelect} 
        favorites={favorites} 
        toggleFavorite={toggleFavorite}
        onDownload={handleDownload}
        hasData={!!data}
        onCompare={handleCompare}
        comparisonCity={comparisonCity}
        onClearComparison={handleClearComparison}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        onProfileClick={() => setShowProfileDashboard(true)}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8">
        
        {/* Top Section: Map Viewport - Full Width */}
        <div className="w-full h-[350px] lg:h-[450px] rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
           <MapWidget 
             key="main-map" 
             cityData={data} 
             cityName={city}
             onCitySelect={handleCitySelect}
             onCompareSelect={handleCompare}
             onError={handleError}
             comparisonMode={comparisonMode}
             comparisonCity={comparisonCity}
             comparisonData={comparisonData}
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
            {/* Comparison Header Banner when comparing */}
            {comparisonCity && comparisonData && (
              <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-4 border border-indigo-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-white font-semibold">{city}</span>
                    </div>
                    <span className="text-slate-400">vs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-white font-semibold">{comparisonCity}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleClearComparison}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Clear Comparison
                  </button>
                </div>
              </div>
            )}

            {/* Alerts Section */}
            {data.alerts && data.alerts.length > 0 && (
              <AlertBanner alerts={data.alerts} />
            )}

            {/* Historical Insights (Section B) - Only show when NOT comparing */}
            {!comparisonCity && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Historical Context & Alerts</h3>
                </div>
                <InsightsPanel insights={data.insights} />
              </div>
            )}

            {/* Side-by-Side Metric Comparison when comparing */}
            {comparisonCity && comparisonData ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                    City Comparison Analysis
                  </h2>
                </div>
                
                {/* New ComparisonCards component */}
                <ComparisonCards
                  mainCity={city}
                  mainData={data}
                  comparisonCity={comparisonCity}
                  comparisonData={comparisonData}
                />
              </div>
            ) : (
              /* Single City View */
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
            )}

            {/* Historical Records Section */}
            <HistoricalRecords 
              cityId={data.cityId}
              cityName={data.location}  
              isFallback={!data.cityId}
              history={data.history}
              currentData={{
                temperature: data.matrix?.find(m => m.metricId === 'temperature')?.data?.find(s => s.status === 'active')?.value
              }}
            />

            {/* Bottom Section: Unified Graph (Trend + Forecast) */}
            <div className="w-full pb-8">
               <div className="h-[650px]">
                 <UnifiedGraph 
                   history={data.history} 
                   forecast={data.forecast} 
                   comparisonHistory={comparisonData?.history}
                   comparisonCityName={comparisonCity}
                   mainCityName={city}
                 />
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

      {/* Profile Dashboard Modal */}
      <ProfileDashboard
        isOpen={showProfileDashboard}
        onClose={() => setShowProfileDashboard(false)}
        onCityClick={handleCitySelect}
      />

      {/* Error Toast */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
