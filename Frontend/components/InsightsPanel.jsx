import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, TrendingUp, History, Info } from 'lucide-react';
import clsx from 'clsx';

export const InsightsPanel = ({ insights }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, idx) => {
        let Icon = Info;
        let colorClass = "text-blue-400";
        let bgClass = "bg-blue-900/20 border-blue-800";

        if (insight.type === 'alert') {
          Icon = AlertTriangle;
          if (insight.severity === 'critical') {
            colorClass = "text-red-400";
            bgClass = "bg-red-900/20 border-red-800";
          } else {
            colorClass = "text-amber-400";
            bgClass = "bg-amber-900/20 border-amber-800";
          }
        } else if (insight.type === 'record') {
          Icon = History;
          colorClass = "text-purple-400";
          bgClass = "bg-purple-900/20 border-purple-800";
        } else if (insight.type === 'trend') {
          Icon = TrendingUp;
          colorClass = "text-emerald-400";
          bgClass = "bg-emerald-900/20 border-emerald-800";
        }

        return (
          <div key={idx} className={clsx("p-4 rounded-xl border flex items-start gap-3 shadow-sm", bgClass)}>
            <div className={clsx("p-2 rounded-lg bg-slate-950/30 shrink-0", colorClass)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                 <span className={clsx("text-xs font-bold uppercase tracking-wider", colorClass)}>
                   {insight.type}
                 </span>
                 <span className="text-[10px] text-slate-400">{insight.timestamp}</span>
              </div>
              <p className="text-sm text-slate-200 leading-snug">
                {insight.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

InsightsPanel.propTypes = {
  insights: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['record', 'alert', 'trend']).isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['info', 'warning', 'critical']).isRequired,
    timestamp: PropTypes.string.isRequired,
  })).isRequired,
};
