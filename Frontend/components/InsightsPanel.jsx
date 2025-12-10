
import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, TrendingUp, History, Info } from 'lucide-react';
import clsx from 'clsx';

export const InsightsPanel = ({ insights, error }) => {
  // Show error state if API failed
  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-300 mb-2">AI Insights Unavailable</h3>
            <p className="text-sm text-slate-300">{error}</p>
            {error.includes('quota') && (
              <a 
                href="https://platform.openai.com/account/billing" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Manage OpenAI Billing →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Limit to 4 insights, keep ALL sources for now (until API key is fixed)
  const filteredInsights = insights
    .filter(i => i.message && i.message.trim().length > 0)
    .slice(0, 4); // Limit to exactly 4 insights

  if (filteredInsights.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
        <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400">No insights available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredInsights.map((insight, idx) => {
        let Icon = Info;
        let colorClass = "text-blue-400"; 
        let bgClass = "bg-blue-900/30 border-blue-700";
        let label = "CLIMATE INSIGHT"; // Better than "INFO"

        if (insight.type === 'alert') {
          Icon = AlertTriangle;
          label = "LIVE ALERT";
          if (insight.severity === 'critical') {
            colorClass = "text-red-500";
            bgClass = "bg-red-950/40 border-red-800";
          } else if (insight.severity === 'warning') {
            colorClass = "text-orange-500";
            bgClass = "bg-orange-950/40 border-orange-800";
          } else {
            colorClass = "text-green-500";
            bgClass = "bg-green-950/40 border-green-800";
          }
        } else if (insight.type === 'record') {
          Icon = History;
          // Different colors based on timestamp type
          const timestamp = insight.timestamp || '';
          if (timestamp.includes('Typical')) {
            label = "VS TYPICAL";
            colorClass = "text-cyan-500";
            bgClass = "bg-cyan-950/40 border-cyan-800";
          } else if (timestamp.includes('Historical')) {
            label = "HISTORICAL";
            colorClass = "text-purple-500";
            bgClass = "bg-purple-950/40 border-purple-800";
          } else {
            label = "RECORD";
            colorClass = "text-indigo-500";
            bgClass = "bg-indigo-950/40 border-indigo-800";
          }
        } else if (insight.type === 'trend') {
          Icon = TrendingUp;
          label = "WEATHER TREND";
          colorClass = "text-emerald-500";
          bgClass = "bg-emerald-950/40 border-emerald-800";
        }

        return (
          <div key={idx} className={clsx("p-4 rounded-xl border flex items-start gap-3 shadow-lg hover:shadow-xl transition-shadow", bgClass)}>
            <div className={clsx("p-2 rounded-lg bg-slate-950/50 shrink-0", colorClass)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                 <span className={clsx("text-xs font-bold uppercase tracking-wider", colorClass)}>
                   {label}
                 </span>
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] text-slate-400">{insight.timestamp || 'N/A'}</span>
                   {insight.source && insight.source !== 'System' && (
                     <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold tracking-wide">
                       {insight.source}
                     </span>
                   )}
                 </div>
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
