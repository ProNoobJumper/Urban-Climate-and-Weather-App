import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Thermometer, CloudRain, Wind, X } from 'lucide-react';
import clsx from 'clsx';
import { config } from '../config';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

export const MapWidget = ({ cityData, cityName, onCitySelect, onError }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const dropdownRef = useRef(null);
  const userInitiatedZoomRef = useRef(false); // Flag to track if user initiated the zoom
  
  const [activeLayer, setActiveLayer] = useState('none');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [timeMode, setTimeMode] = useState('current');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    console.log('🗺️ Initializing Mapbox GL JS...');

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: config.INDIA_CENTER,
        zoom: config.INDIA_ZOOM,
        pitch: 0,
        bearing: 0,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      map.on('load', () => {
        console.log('✅ Mapbox map loaded');
        setIsMapLoaded(true);
      });

      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        showClickRipple(e.point);

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place&country=IN&access_token=${config.MAPBOX_TOKEN}`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const cityName = feature.text;
            const cityCenter = feature.center;
            const placeType = feature.place_type?.[0];

            // Accept 'place' type which includes cities and towns, but not villages
            if (placeType === 'place') {
              userInitiatedZoomRef.current = true; // Mark as user-initiated
              flyToCity(cityCenter, cityName);
              if (onCitySelect) {
                onCitySelect(cityName);
              }
            } else {
              if (onError) {
                onError('Please select a city or town. Very small villages may not have weather data available.');
              }
            }
          } else {
            if (onError) {
              onError('Could not identify location. Please try clicking on a city or town.');
            }
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          if (onError) {
            onError('Failed to identify location. Please try again.');
          }
        }
      });

      mapInstanceRef.current = map;

    } catch (error) {
      console.error('Map initialization error:', error);
      if (onError) {
        onError('Failed to initialize map. Please check your internet connection.');
      }
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onCitySelect, onError]);

  const flyToCity = (coordinates, cityName) => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.flyTo({
      center: coordinates,
      zoom: config.CITY_ZOOM,
      pitch: config.ANIMATION_PITCH,
      bearing: 0,
      speed: config.ANIMATION_SPEED,
      curve: config.ANIMATION_CURVE,
      easing: (t) => {
        return t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },
      essential: true
    });

    // Don't add marker here - wait for data to load
    // Marker will be added in useEffect when cityData updates
  };

  const showClickRipple = (point) => {
    if (!mapContainerRef.current) return;

    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = `${point.x}px`;
    ripple.style.top = `${point.y}px`;
    
    mapContainerRef.current.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const addCityMarker = (coordinates, cityName) => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Get temperature and AQI from cityData if available
    const tempData = cityData?.matrix?.find(m => m.metricId === 'temperature');
    const aqiData = cityData?.aqiBreakdown?.[0];
    
    const temperature = tempData?.data?.[0]?.value || '--';
    const aqiValue = aqiData?.aqiValue || '--';
    
    // Determine AQI color
    let aqiColor = '#10b981'; // green
    if (aqiValue > 150) aqiColor = '#ef4444'; // red
    else if (aqiValue > 100) aqiColor = '#f59e0b'; // orange
    else if (aqiValue > 50) aqiColor = '#eab308'; // yellow

    const el = document.createElement('div');
    el.className = 'city-marker marker-bounce';
    el.innerHTML = `
      <div class="bg-slate-900/95 border border-indigo-500 rounded-lg px-4 py-3 shadow-2xl backdrop-blur-sm min-w-[180px]">
        <h3 class="text-white font-semibold text-base mb-2 border-b border-slate-700 pb-1">${cityName}</h3>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">Temperature</span>
            <span class="text-sm font-bold text-orange-400">${temperature}°C</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">AQI</span>
            <span class="text-sm font-bold" style="color: ${aqiColor}">${aqiValue}</span>
          </div>
        </div>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(coordinates)
      .addTo(mapInstanceRef.current);

    markersRef.current.push(marker);
  };

  // Only zoom when data loads if it wasn't user-initiated (e.g., from geolocation)
  useEffect(() => {
    console.log('🔍 cityData changed:', cityName, 'userInitiated:', userInitiatedZoomRef.current);
    
    if (mapInstanceRef.current && isMapLoaded && cityData && cityName) {
      if (!userInitiatedZoomRef.current) {
        // This is from geolocation or initial load, so zoom
        console.log('📍 Zooming to city (from data load):', cityName);
        flyToCity([cityData.lng, cityData.lat], cityName);
      } else {
        // User already initiated zoom, just update marker with data
        console.log('🎯 Updating marker only (user already zoomed):', cityName);
        // Wait a bit for zoom animation to complete, then add marker with data
        setTimeout(() => {
          addCityMarker([cityData.lng, cityData.lat], cityName);
        }, 100);
        userInitiatedZoomRef.current = false; // Reset flag
      }
    }
  }, [cityData, cityName, isMapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    ['temp-layer', 'rain-layer', 'aqi-layer'].forEach(layerId => {
      if (mapInstanceRef.current.getLayer(layerId)) {
        mapInstanceRef.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    if (activeLayer !== 'none') {
      const layerConfig = getLayerConfig(activeLayer);
      if (layerConfig) {
        addOrUpdateWeatherLayer(layerConfig);
      }
    }
  }, [activeLayer, isMapLoaded, timeMode]);

  const getLayerConfig = (layerName) => {
    const timestamp = timeMode === 'current' ? 'now' : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const configs = {
      'temp-heat': {
        id: 'temp-layer',
        tiles: `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/temperature/${timestamp}.png?apikey=${config.TOMORROW_API_KEY}`,
        opacity: 0.75
      },
      'precip-radar': {
        id: 'rain-layer',
        tiles: `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/precipitationIntensity/${timestamp}.png?apikey=${config.TOMORROW_API_KEY}`,
        opacity: 0.8
      },
      'aqi-heat': {
        id: 'aqi-layer',
        tiles: `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/particulateMatter25/${timestamp}.png?apikey=${config.TOMORROW_API_KEY}`,
        opacity: 0.7
      }
    };

    return configs[layerName];
  };

  const addOrUpdateWeatherLayer = (layerConfig) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (!map.getSource(layerConfig.id)) {
      map.addSource(layerConfig.id, {
        type: 'raster',
        tiles: [layerConfig.tiles],
        tileSize: 256
      });

      map.addLayer({
        id: layerConfig.id,
        type: 'raster',
        source: layerConfig.id,
        paint: {
          'raster-opacity': 0
        }
      });
    }

    map.setLayoutProperty(layerConfig.id, 'visibility', 'visible');
    
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.1;
      if (map.getPaintProperty(layerConfig.id, 'raster-opacity') !== undefined) {
        map.setPaintProperty(layerConfig.id, 'raster-opacity', Math.min(opacity, layerConfig.opacity));
      }
      if (opacity >= layerConfig.opacity) clearInterval(fadeIn);
    }, 50);
  };

  const layers = [
    { id: 'none', icon: <X className="w-4 h-4" />, label: 'None' },
    { id: 'temp-heat', icon: <Thermometer className="w-4 h-4" />, label: 'Temperature' },
    { id: 'precip-radar', icon: <CloudRain className="w-4 h-4" />, label: 'Rain' },
    { id: 'aqi-heat', icon: <Wind className="w-4 h-4" />, label: 'Air Quality' },
  ];

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
          <div className="text-center p-4">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Loading Map...</p>
          </div>
        </div>
      )}

      {/* Layer Controls Dropdown - Top Right, Below Time Toggle */}
      <div ref={dropdownRef} className="absolute right-4 top-16 z-[400]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-lg px-4 py-2.5 shadow-xl backdrop-blur-md hover:border-slate-600 transition-colors"
        >
          {layers.find(l => l.id === activeLayer)?.icon}
          <span className="text-sm font-medium text-slate-200">
            {layers.find(l => l.id === activeLayer)?.label}
          </span>
          <svg className={clsx("w-4 h-4 text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden">
            {layers.map(layer => (
              <button
                key={layer.id}
                onClick={() => {
                  setActiveLayer(layer.id);
                  setIsDropdownOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-b border-slate-800 last:border-b-0",
                  activeLayer === layer.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                {layer.icon}
                <span>{layer.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Mode Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-[400] flex gap-2 bg-slate-900/90 p-1 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setTimeMode('current')}
          className={clsx(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            timeMode === 'current'
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Current
        </button>
        <button
          onClick={() => setTimeMode('historical')}
          className={clsx(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            timeMode === 'historical'
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Historical
        </button>
      </div>
    </div>
  );
};

MapWidget.propTypes = {
  cityData: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  cityName: PropTypes.string,
  onCitySelect: PropTypes.func,
  onError: PropTypes.func,
};
