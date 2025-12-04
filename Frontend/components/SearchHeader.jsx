import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, MapPin, Star, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { searchCitySuggestions } from '../services/weatherService';

export const SearchHeader = ({ currentCity, onSearch, favorites, toggleFavorite }) => {
  const [input, setInput] = useState(currentCity);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const isFav = favorites.includes(currentCity);

  // Update input when currentCity changes (e.g., from map click)
  useEffect(() => {
    setInput(currentCity);
  }, [currentCity]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.length >= 2) {
      setLoading(true);
      setShowSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        const results = await searchCitySuggestions(val);
        setSuggestions(results);
        setLoading(false);
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    setInput(city.name);
    onSearch(city.name);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input);
      setShowSuggestions(false);
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
            <h1 className="text-xl font-bold tracking-tight text-white">EcoSense<span className="text-indigo-400">India</span></h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Multi-Source Intelligence</p>
          </div>
        </div>

        {/* Search Bar */}
        <div ref={wrapperRef} className="relative w-full md:max-w-md z-50">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={() => input.length >= 2 && setShowSuggestions(true)}
              placeholder="Search Indian City (e.g. Pune, Jaipur)..."
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
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800/50 last:border-none transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">{city.name}</div>
                    <div className="text-xs text-slate-500">{city.admin1}, India</div>
                  </div>
                  <MapPin className="w-3 h-3 text-slate-600 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 self-end md:self-center">
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
            {isFav ? 'Saved' : 'Save'}
          </button>
          
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
};