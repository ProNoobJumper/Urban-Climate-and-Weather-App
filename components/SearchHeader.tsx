import React, { useState } from 'react';
import { Search, MapPin, Star, Menu } from 'lucide-react';
import clsx from 'clsx';

interface SearchHeaderProps {
  currentCity: string;
  onSearch: (city: string) => void;
  favorites: string[];
  toggleFavorite: (city: string) => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ currentCity, onSearch, favorites, toggleFavorite }) => {
  const [input, setInput] = useState(currentCity);
  const isFav = favorites.includes(currentCity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSearch(input);
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
        <form onSubmit={handleSubmit} className="relative w-full md:max-w-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search Indian City (e.g. Bengaluru, Delhi)..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
          />
          <Search className="absolute left-3 top-2.5 text-slate-500 w-5 h-5" />
          <button 
            type="submit" 
            className="absolute right-1.5 top-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Go
          </button>
        </form>

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