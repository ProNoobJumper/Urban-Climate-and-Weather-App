import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { config } from '../config';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

export const MapWidget = ({ cityData, cityName, onCitySelect, onCompareSelect, onError, comparisonMode, comparisonCity, comparisonData }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userInitiatedZoomRef = useRef(false); // Flag to track if user initiated the zoom
  
  // Refs to track current props for use in click handler (avoids stale closure)
  const comparisonModeRef = useRef(comparisonMode);
  const onCompareSelectRef = useRef(onCompareSelect);
  
  // Keep refs in sync with props
  useEffect(() => {
    comparisonModeRef.current = comparisonMode;
    onCompareSelectRef.current = onCompareSelect;
  }, [comparisonMode, onCompareSelect]);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
            const selectedCityName = feature.text;
            const cityCenter = feature.center;
            const placeType = feature.place_type?.[0];

            // Accept 'place' type which includes cities and towns, but not villages
            if (placeType === 'place') {
              userInitiatedZoomRef.current = true; // Mark as user-initiated
              
              // Route to comparison or main city based on mode (use refs for current values)
              if (comparisonModeRef.current && onCompareSelectRef.current) {
                console.log('🔀 Selecting comparison city from map:', selectedCityName);
                // Don't fly to city for comparison - will fit bounds later
                onCompareSelectRef.current(selectedCityName);
              } else if (onCitySelect) {
                console.log('📍 Selecting main city from map:', selectedCityName);
                flyToCity(cityCenter, selectedCityName);
                onCitySelect(selectedCityName);
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

  const addCityMarker = (coordinates, markerCityName, isComparison = false) => {
    if (!mapInstanceRef.current) return;

    // Only remove markers of the same type (main vs comparison)
    const markerKey = isComparison ? 'comparison' : 'main';
    const existingMarker = markersRef.current.find(m => m._type === markerKey);
    if (existingMarker) {
      existingMarker.remove();
      markersRef.current = markersRef.current.filter(m => m._type !== markerKey);
    }

    // Get data based on marker type
    const sourceData = isComparison ? comparisonData : cityData;
    const tempData = sourceData?.matrix?.find(m => m.metricId === 'temperature');
    const aqiDataItem = sourceData?.aqiBreakdown?.[0];
    
    const temperature = tempData?.data?.[0]?.value || '--';
    const aqiValue = aqiDataItem?.aqiValue || '--';
    
    // Determine AQI color
    let aqiColor = '#10b981'; // green
    if (aqiValue > 150) aqiColor = '#ef4444'; // red
    else if (aqiValue > 100) aqiColor = '#f59e0b'; // orange
    else if (aqiValue > 50) aqiColor = '#eab308'; // yellow

    // Different border colors for main vs comparison
    const borderColor = isComparison ? 'border-orange-500' : 'border-indigo-500';
    const headerBg = isComparison ? 'bg-orange-500/10' : 'bg-indigo-500/10';
    const labelBadge = isComparison 
      ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">Compare</span>' 
      : '<span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium">Main</span>';

    // Position offset for comparison marker to avoid overlap - use inline styles
    const topPosition = isComparison ? '130px' : '16px';

    const el = document.createElement('div');
    el.className = 'city-marker marker-bounce';
    el.style.cssText = `position: absolute; left: 16px; top: ${topPosition}; z-index: 500;`;
    el.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid ${isComparison ? '#f97316' : '#6366f1'}; border-radius: 8px; padding: 8px 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); min-width: 140px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 6px; margin: -8px -12px 6px -12px; padding: 8px 12px 6px 12px; border-radius: 6px 6px 0 0; background: ${isComparison ? 'rgba(249, 115, 22, 0.1)' : 'rgba(99, 102, 241, 0.1)'};">
          <h3 style="color: white; font-weight: 600; font-size: 14px; margin: 0;">${markerCityName}</h3>
          <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${isComparison ? 'rgba(249, 115, 22, 0.2)' : 'rgba(99, 102, 241, 0.2)'}; color: ${isComparison ? '#fb923c' : '#818cf8'}; font-weight: 500;">${isComparison ? 'Compare' : 'Main'}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; color: #94a3b8;">Temperature</span>
            <span style="font-size: 12px; font-weight: 700; color: #fb923c;">${temperature}°C</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; color: #94a3b8;">AQI</span>
            <span style="font-size: 12px; font-weight: 700; color: ${aqiColor};">${aqiValue}</span>
          </div>
        </div>
      </div>
    `;

    // Add as fixed UI element on map instead of marker
    if (mapContainerRef.current) {
      // Remove existing card of same type
      const existingCard = mapContainerRef.current.querySelector(`.city-card-${markerKey}`);
      if (existingCard) existingCard.remove();
      
      el.classList.add(`city-card-${markerKey}`);
      mapContainerRef.current.appendChild(el);
    }

    // Still add a simple pin marker at location
    const pinEl = document.createElement('div');
    pinEl.className = 'w-4 h-4 rounded-full border-2 border-white shadow-lg';
    pinEl.style.backgroundColor = isComparison ? '#f97316' : '#6366f1';
    
    const marker = new mapboxgl.Marker({ element: pinEl, anchor: 'center' })
      .setLngLat(coordinates)
      .addTo(mapInstanceRef.current);

    marker._type = markerKey;
    markersRef.current.push(marker);
  };

  // Update markers when main city data changes
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
        setTimeout(() => {
          addCityMarker([cityData.lng, cityData.lat], cityName, false);
        }, 100);
        userInitiatedZoomRef.current = false; // Reset flag
      }
    }
  }, [cityData, cityName, isMapLoaded]);

  // Reset map to India view when entering comparison mode (before 2nd city is selected)
  useEffect(() => {
    if (mapInstanceRef.current && isMapLoaded && comparisonMode && !comparisonCity) {
      console.log('🔄 Comparison mode activated - resetting to India view for 2nd city selection');
      
      // Reset to India view with a nice animation
      mapInstanceRef.current.flyTo({
        center: config.INDIA_CENTER,
        zoom: config.INDIA_ZOOM,
        pitch: 0,
        bearing: 0,
        speed: 1.2,
        curve: 1.5,
        essential: true
      });
      
      // Remove the main city marker temporarily for cleaner selection
      markersRef.current.forEach(marker => {
        if (marker._type === 'main') {
          marker.getElement().style.opacity = '0.4';
        }
      });
    } else if (!comparisonMode) {
      // Restore marker opacity when exiting comparison mode
      markersRef.current.forEach(marker => {
        if (marker._type === 'main') {
          marker.getElement().style.opacity = '1';
        }
      });
    }
  }, [comparisonMode, comparisonCity, isMapLoaded]);

  // Update markers when comparison data changes and fit bounds to show both cities
  useEffect(() => {
    if (mapInstanceRef.current && isMapLoaded && comparisonData && comparisonCity && cityData) {
      console.log('🔀 Adding comparison marker for:', comparisonCity);
      addCityMarker([comparisonData.lng, comparisonData.lat], comparisonCity, true);
      
      // Restore main marker opacity
      markersRef.current.forEach(marker => {
        if (marker._type === 'main') {
          marker.getElement().style.opacity = '1';
        }
      });
      
      // Fit bounds to show both cities with padding
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([cityData.lng, cityData.lat]);
      bounds.extend([comparisonData.lng, comparisonData.lat]);
      
      console.log('📐 Fitting bounds to show both cities');
      mapInstanceRef.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 10,
        duration: 1500,
        essential: true
      });
      
    } else if (!comparisonCity && cityData) {
      // Remove comparison marker when comparison is cleared
      const compMarker = markersRef.current.find(m => m._type === 'comparison');
      if (compMarker) {
        compMarker.remove();
        markersRef.current = markersRef.current.filter(m => m._type !== 'comparison');
      }
      
      // Also remove the comparison info card
      if (mapContainerRef.current) {
        const compCard = mapContainerRef.current.querySelector('.city-card-comparison');
        if (compCard) {
          compCard.remove();
          console.log('🗑️ Removed comparison info card');
        }
      }
      
      // Fly back to main city
      if (mapInstanceRef.current) {
        console.log('🔙 Comparison cleared - flying back to main city');
        mapInstanceRef.current.flyTo({
          center: [cityData.lng, cityData.lat],
          zoom: config.CITY_ZOOM,
          pitch: config.ANIMATION_PITCH,
          bearing: 0,
          speed: 1.2,
          curve: 1.5,
          essential: true
        });
      }
    }
  }, [comparisonData, comparisonCity, cityData, isMapLoaded]);
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
  onCompareSelect: PropTypes.func,
  onError: PropTypes.func,
  comparisonMode: PropTypes.bool,
  comparisonCity: PropTypes.string,
  comparisonData: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};
