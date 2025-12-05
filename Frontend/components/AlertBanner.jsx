import React from 'react';
import { AlertTriangle, AlertOctagon, X } from 'lucide-react';

export const AlertBanner = ({ alerts, onClose }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6 animate-in slide-in-from-top duration-300">
      {alerts.map((alert, index) => (
        <div 
          key={index}
          className={`
            relative flex items-start gap-3 p-4 rounded-xl border
            ${alert.level === 'critical' 
              ? 'bg-red-500/10 border-red-500/30 text-red-200' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }
          `}
        >
          <div className={`
            p-2 rounded-lg shrink-0
            ${alert.level === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'}
          `}>
            {alert.level === 'critical' ? (
              <AlertOctagon className={`w-5 h-5 ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
            ) : (
              <AlertTriangle className={`w-5 h-5 ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
            )}
          </div>
          
          <div className="flex-1 pt-1">
            <h4 className={`font-bold text-sm mb-1 ${alert.level === 'critical' ? 'text-red-100' : 'text-amber-100'}`}>
              {alert.type}
            </h4>
            <p className="text-sm opacity-90">
              {alert.message}
            </p>
          </div>

          {onClose && (
            <button 
              onClick={() => onClose(index)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
