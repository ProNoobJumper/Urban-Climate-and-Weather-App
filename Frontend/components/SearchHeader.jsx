import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Search,
  MapPin,
  Star,
  Loader2,
  Download,
  ChevronDown,
  Split,
  User,
} from "lucide-react";
import clsx from "clsx";
import { searchCitySuggestions } from "../services/weatherService";
import { config } from "../config";
import { useAuth } from "../contexts/AuthContext";

export const SearchHeader = ({
  currentCity,
  onSearch,
  favorites,
  toggleFavorite,
  onDownload,
  hasData,
  onCompare,
  comparisonCity,
  onClearComparison,
  comparisonMode,
  setComparisonMode,
  onProfileClick,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [input, setInput] = useState(currentCity);
  const [compareInput, setCompareInput] = useState(comparisonCity || "");
  const [suggestions, setSuggestions] = useState([]);
  const [compareSuggestions, setCompareSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCompareSuggestions, setShowCompareSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  // Use the parent's comparisonMode state instead of local isComparing
  const isComparing = comparisonMode || !!comparisonCity;

  const wrapperRef = useRef(null);
  const compareWrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const compareDebounceRef = useRef(null);

  const isFav = favorites.includes(currentCity);

  // Update input when currentCity changes (e.g., from map click)
  useEffect(() => {
    setInput(currentCity);
  }, [currentCity]);

  // Update compare input when comparisonCity changes
  useEffect(() => {
    if (comparisonCity) {
      setCompareInput(comparisonCity);
      // isComparing is now computed from comparisonMode || !!comparisonCity
    } else {
      setCompareInput("");
    }
  }, [comparisonCity]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (
        compareWrapperRef.current &&
        !compareWrapperRef.current.contains(event.target)
      ) {
        setShowCompareSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e, isCompare = false) => {
    const val = e.target.value;
    if (isCompare) {
      setCompareInput(val);
    } else {
      setInput(val);
    }

    const currentDebounce = isCompare ? compareDebounceRef : debounceRef;
    if (currentDebounce.current) clearTimeout(currentDebounce.current);

    if (val.length >= 2) {
      if (isCompare) setCompareLoading(true);
      else setLoading(true);

      if (isCompare) setShowCompareSuggestions(true);
      else setShowSuggestions(true);

      currentDebounce.current = setTimeout(async () => {
        const results = await searchCitySuggestions(val);
        if (isCompare) {
          setCompareSuggestions(results);
          setCompareLoading(false);
        } else {
          setSuggestions(results);
          setLoading(false);
        }
      }, 400);
    } else {
      if (isCompare) {
        setCompareSuggestions([]);
        setShowCompareSuggestions(false);
        setCompareLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
      }
    }
  };

  const handleSelectCity = (city, isCompare = false) => {
    if (isCompare) {
      setCompareInput(city.name);
      onCompare(city.name);
      setShowCompareSuggestions(false);
    } else {
      setInput(city.name);
      onSearch(city.name);
      setShowSuggestions(false);
    }
  };

  // Detect if input is coordinates (e.g., "12.9716, 77.5946" or "12.9716,77.5946")
  const parseCoordinates = (input) => {
    const coordRegex = /^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/;
    const match = input.trim().match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      // Validate reasonable coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  // Reverse geocode coordinates to city name
  const geocodeCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place&country=IN&access_token=${config.MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].text;
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSubmit = async (e, isCompare = false) => {
    e.preventDefault();
    const searchValue = isCompare ? compareInput.trim() : input.trim();
    
    if (!searchValue) return;
    
    // Check if input is coordinates
    const coords = parseCoordinates(searchValue);
    
    if (coords) {
      // Set loading state
      if (isCompare) setCompareLoading(true);
      else setLoading(true);
      
      // Geocode coordinates to city name
      const cityName = await geocodeCoordinates(coords.lat, coords.lng);
      
      if (isCompare) setCompareLoading(false);
      else setLoading(false);
      
      if (cityName) {
        console.log(`📍 Geocoded coordinates (${coords.lat}, ${coords.lng}) to: ${cityName}`);
        if (isCompare) {
          setCompareInput(cityName);
          onCompare(cityName);
          setShowCompareSuggestions(false);
        } else {
          setInput(cityName);
          onSearch(cityName);
          setShowSuggestions(false);
        }
      } else {
        console.warn('Could not geocode coordinates to a city');
        // Try with the raw input as a city name anyway
        if (isCompare) {
          onCompare(searchValue);
          setShowCompareSuggestions(false);
        } else {
          onSearch(searchValue);
          setShowSuggestions(false);
        }
      }
    } else {
      // Regular city name search
      if (isCompare) {
        onCompare(searchValue);
        setShowCompareSuggestions(false);
      } else {
        onSearch(searchValue);
        setShowSuggestions(false);
      }
    }
  };

  const toggleCompareMode = () => {
    if (isComparing) {
      onClearComparison();
      if (setComparisonMode) setComparisonMode(false);
      setCompareInput("");
    } else {
      if (setComparisonMode) setComparisonMode(true);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MapPin className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              EcoSense<span className="text-indigo-400">India</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Multi-Source Intelligence
            </p>
          </div>
        </div>

        {/* Search Bars Container */}
        <div className="flex flex-1 max-w-2xl gap-2 items-center w-full">
          {/* Primary Search Bar */}
          <div ref={wrapperRef} className="relative w-full z-50">
            <form onSubmit={(e) => handleSubmit(e, false)} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e, false)}
                onFocus={() => input.length >= 2 && setShowSuggestions(true)}
                placeholder="Search City..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 pl-10 pr-10 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
              />
              <Search className="absolute left-3 top-2.5 text-slate-500 w-5 h-5" />

              {loading ? (
                <Loader2 className="absolute right-3 top-2.5 text-indigo-500 w-5 h-5 animate-spin" />
              ) : (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Go
                </button>
              )}
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                {suggestions.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city, false)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800/50 last:border-none transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {city.admin1}, India
                      </div>
                    </div>
                    <MapPin className="w-3 h-3 text-slate-600 group-hover:text-indigo-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compare Toggle Button */}
          {hasData && (
            <button
              onClick={toggleCompareMode}
              className={clsx(
                "p-2 rounded-lg border transition-all shrink-0",
                isComparing
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200"
              )}
              title="Compare with another city"
            >
              <Split className="w-5 h-5" />
            </button>
          )}

          {/* Comparison Search Bar */}
          {isComparing && (
            <div
              ref={compareWrapperRef}
              className="relative w-full z-40 animate-in fade-in slide-in-from-left-4 duration-300"
            >
              <form
                onSubmit={(e) => handleSubmit(e, true)}
                className="relative"
              >
                <input
                  type="text"
                  value={compareInput}
                  onChange={(e) => handleInputChange(e, true)}
                  onFocus={() =>
                    compareInput.length >= 2 && setShowCompareSuggestions(true)
                  }
                  placeholder="Compare with..."
                  className="w-full bg-slate-950 border border-indigo-900/50 text-slate-100 pl-10 pr-10 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 text-indigo-500/50 w-5 h-5" />

                {compareLoading ? (
                  <Loader2 className="absolute right-3 top-2.5 text-indigo-500 w-5 h-5 animate-spin" />
                ) : (
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Go
                  </button>
                )}
              </form>

              {/* Compare Suggestions Dropdown */}
              {showCompareSuggestions && compareSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                  {compareSuggestions.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city, true)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800/50 last:border-none transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {city.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {city.admin1}, India
                        </div>
                      </div>
                      <MapPin className="w-3 h-3 text-slate-600 group-hover:text-indigo-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 self-end md:self-center shrink-0">
          <button
            onClick={() => toggleFavorite(currentCity)}
            className={clsx(
              "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all",
              isFav
                ? "bg-amber-900/20 border-amber-700/50 text-amber-400"
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200"
            )}
          >
            <Star className={clsx("w-4 h-4", isFav && "fill-amber-400")} />
            {isFav ? "Saved" : "Save"}
          </button>

          {hasData && onDownload && (
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 transition-all">
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button
                  onClick={() => onDownload("csv")}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-t-lg"
                >
                  CSV
                </button>
                <button
                  onClick={() => onDownload("xlsx")}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-b-lg"
                >
                  XLSX
                </button>
              </div>
            </div>
          )}

          {/* User Profile Button */}
          {isAuthenticated && onProfileClick && (
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-slate-300 hidden md:block group-hover:text-slate-100 transition-colors">
                {user?.fullName || 'Profile'}
              </span>
            </button>
          )}

          <div className="w-px h-8 bg-slate-800 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-400">System Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

SearchHeader.propTypes = {
  currentCity: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  favorites: PropTypes.arrayOf(PropTypes.string).isRequired,
  toggleFavorite: PropTypes.func.isRequired,
  onDownload: PropTypes.func,
  hasData: PropTypes.bool,
  onCompare: PropTypes.func,
  comparisonCity: PropTypes.string,
  onClearComparison: PropTypes.func,
  comparisonMode: PropTypes.bool,
  setComparisonMode: PropTypes.func,
};
