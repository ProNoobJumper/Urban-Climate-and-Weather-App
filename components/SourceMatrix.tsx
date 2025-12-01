import React, { useState, useMemo } from 'react';
import { MetricRow, SourceData, CityData, MetricUnit } from '../types';
import { CheckCircle, XCircle, Clock, ShieldCheck, X, Maximize2, Wind, Thermometer, Droplets, Gauge } from 'lucide-react';
import clsx from 'clsx';

interface MetricGridProps {
  matrix: MetricRow[];
  aqiData: CityData['aqiBreakdown'];
}

// --- Icons Helper ---
const getIconForMetric = (id: string) => {
  if (id.includes('temp')) return <Thermometer className="w-5 h-5 text-amber-400" />;
  if (id.includes('humid')) return <Droplets className="w-5 h-5 text-cyan-400" />;
  if (id.includes('press')) return <Gauge className="w-5 h-5 text-purple-400" />;
  if (id.includes('pm') || id.includes('aqi') || id.includes('no2')) return <Wind className="w-5 h-5 text-emerald-400" />;
  return <ShieldCheck className="w-5 h-5 text-slate-400" />;
};

// --- Sub-components ---

const SourceBadge = ({ source }: { source: SourceData }) => {
  if (source.status === 'unavailable' || source.status === 'error_timeout') {
    return (
      <div className="flex items-center text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3 mr-1" />
        Unavailable
      </div>
    );
  }
  return (
    <div className="flex items-center text-emerald-400 text-xs font-medium">
      <CheckCircle className="w-3 h-3 mr-1" />
      Active
    </div>
  );
};

const MetricCard = ({ row, onClick }: { row: MetricRow; onClick: () => void }) => {
  // Logic to find the "Best" source to display on the card
  // Priority: Official & Active > Active > Any
  const activeOfficial = row.data.find(d => d.isOfficial && d.status === 'active');
  const anyActive = row.data.find(d => d.status === 'active');
  const displaySource = activeOfficial || anyActive || row.data[0];

  const hasMultipleSources = row.data.length > 1;

  return (
    <button
      onClick={onClick}
      className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900/80 rounded-xl p-4 flex flex-col justify-between transition-all text-left h-36 w-full shadow-sm hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <div className="w-full flex items-start justify-between">
        <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
             {getIconForMetric(row.metricId)}
           </div>
           <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">{row.label}</span>
        </div>
        {hasMultipleSources && (
          <Maximize2 className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" />
        )}
      </div>

      <div className="mt-2">
        {displaySource.value !== null ? (
          <div className="text-3xl font-bold text-slate-100 tracking-tight">
            {displaySource.value}
            <span className="text-base font-normal text-slate-500 ml-1">{displaySource.unit}</span>
          </div>
        ) : (
          <div className="text-xl font-mono text-slate-600">--</div>
        )}
      </div>

      <div className="mt-auto w-full flex items-center justify-between pt-2 border-t border-slate-800/50">
        <div className="flex items-center gap-2">
           <span className={clsx(
             "text-[10px] px-1.5 py-0.5 rounded border font-semibold",
             displaySource.isOfficial 
               ? "bg-blue-900/30 text-blue-300 border-blue-800/50" 
               : "bg-slate-800 text-slate-400 border-slate-700"
           )}>
             {displaySource.displayName}
           </span>
           <span className="text-[10px] text-slate-500 flex items-center">
             <Clock className="w-3 h-3 mr-1" />
             {displaySource.lastUpdated}
           </span>
        </div>
        {hasMultipleSources && (
           <span className="text-[10px] text-indigo-400 font-medium opacity-60 group-hover:opacity-100">
             +{row.data.length - 1} more
           </span>
        )}
      </div>
    </button>
  );
};

const DetailModal = ({ row, onClose }: { row: MetricRow; onClose: () => void }) => {
  // Comparison Logic from original SourceMatrix
  const validValues = row.data.map(d => d.value).filter((v): v is number => v !== null);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-indigo-900/20 border border-indigo-800/50">
                {getIconForMetric(row.metricId)}
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-100">{row.label} Consensus</h3>
               <p className="text-xs text-slate-400">Comparing data from {row.data.length} sources</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/30">
                <th className="p-4 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800">Source</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800 text-right">Value</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800">Status</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800 text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {row.data.map((source, idx) => {
                const isMax = source.value === max && validValues.length > 1;
                const isMin = source.value === min && validValues.length > 1;
                
                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{source.displayName}</span>
                        {source.isOfficial && (
                          <span className="bg-blue-900/50 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-800">
                            GOVT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                       <span className={clsx(
                         "font-mono font-bold text-lg",
                         isMax && "text-amber-400",
                         isMin && "text-cyan-400",
                         !isMax && !isMin && "text-slate-200",
                         source.value === null && "text-slate-600"
                       )}>
                         {source.value !== null ? source.value : '--'}
                         <span className="text-sm font-normal text-slate-500 ml-1">{source.unit}</span>
                       </span>
                    </td>
                    <td className="p-4">
                      <SourceBadge source={source} />
                    </td>
                    <td className="p-4 text-right text-xs text-slate-500 font-mono">
                      {source.lastUpdated}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Legend */}
        <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex gap-4 text-[10px] text-slate-500 justify-center">
            <div className="flex items-center">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5"></span> Highest Report
            </div>
            <div className="flex items-center">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1.5"></span> Lowest Report
            </div>
            <div className="flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span> Govt Source
            </div>
        </div>

      </div>
    </div>
  );
};

// --- Main Component ---

export const SourceMatrix: React.FC<MetricGridProps> = ({ matrix, aqiData }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricRow | null>(null);

  // Normalize AQI data into MetricRows
  const combinedMetrics = useMemo(() => {
    // Helper to create a source entry
    const makeSource = (name: string, val: number | null, unit: MetricUnit, isGovt: boolean = false): SourceData => ({
      source: name,
      displayName: name,
      isOfficial: isGovt,
      value: val,
      unit,
      status: 'active', // Assuming active for AQI mock for now
      lastUpdated: '5m ago'
    });

    const aqiRow: MetricRow = {
      metricId: 'aqi',
      label: 'Air Quality (AQI)',
      data: aqiData.map(d => makeSource(d.source, d.aqiValue, 'AQI'))
    };

    const pm25Row: MetricRow = {
      metricId: 'pm25',
      label: 'PM 2.5',
      data: aqiData.map(d => makeSource(d.source, d.pm25, 'µg/m³'))
    };

    const pm10Row: MetricRow = {
      metricId: 'pm10',
      label: 'PM 10',
      data: aqiData.map(d => makeSource(d.source, d.pm10, 'µg/m³'))
    };
    
    const no2Row: MetricRow = {
      metricId: 'no2',
      label: 'NO2 Levels',
      data: aqiData.map(d => makeSource(d.source, d.no2, 'µg/m³'))
    };

    return [...matrix, aqiRow, pm25Row, pm10Row, no2Row];
  }, [matrix, aqiData]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {combinedMetrics.map((row) => (
          <MetricCard 
            key={row.metricId} 
            row={row} 
            onClick={() => setSelectedMetric(row)} 
          />
        ))}
      </div>

      {selectedMetric && (
        <DetailModal 
          row={selectedMetric} 
          onClose={() => setSelectedMetric(null)} 
        />
      )}
    </>
  );
};
