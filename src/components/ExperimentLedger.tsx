import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { simulation } from '../lib/simulation';
import { ExperimentLedgerEntry } from '../types';
import { FileDown, GitBranch, Share2, Target, Zap, Waves, ActivitySquare, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2 rounded text-[10px] font-mono shadow-xl z-50">
        <p className="text-slate-400 mb-1">Tick: {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ExperimentLedger() {
  const ledger = simulation.ledger;
  const activeEntry = simulation.getActiveExperimentEntry();
  
  const allEntries = [...ledger, activeEntry];
  const [expandedId, setExpandedId] = useState<string | null>(activeEntry.id);

  // We need the raw history of the experiment to paint the Horizon/Heatmap.
  // For historical ledgers, we don't have the full history frames stored in the ledger object yet.
  // Wait! The ledger object DOES NOT have the `history` frames, only the aggregated results.
  // If we want a heatmap for each run, we need to save the summarized timeline data array in `ExperimentLedgerEntry`.

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <div className="w-1.5 h-1.5 bg-[#00f5ff] rotate-45 animate-pulse" />
        <h2 className="text-xl font-serif italic text-white tracking-widest leading-none">Research Observatory</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-brand-cyan/30 to-transparent ml-4" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12 flex flex-col gap-6">
        {allEntries.map((entry, idx) => {
          const isActive = entry.id === activeEntry.id && idx === allEntries.length - 1;
          
          return (
            <div key={entry.id + idx} className={cn("rounded-xl border p-5 relative overflow-hidden bg-bg-card/40 transition-all", isActive ? "border-brand-cyan/40" : "border-border-subtle")}>
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={cn("text-[13px] font-mono font-bold tracking-widest", isActive ? "text-brand-cyan" : "text-white")}>
                      {entry.id}
                    </span>
                    {isActive && <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded border border-brand-cyan/30 uppercase tracking-widest animate-pulse">Running</span>}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 tracking-wider">
                    <span>SEED: {entry.seed}</span>
                    {entry.branchParentId && (
                      <span className="flex items-center gap-1 text-brand-purple">
                        <GitBranch size={10} /> {entry.branchParentId}
                      </span>
                    )}
                    <span>DURATION: {entry.durationTicks} ticks</span>
                    {entry.oversightReport && (
                      <span className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
                        entry.oversightReport.posture === 'PASS' ? "bg-brand-green/10 text-brand-green border-brand-green/20" :
                        entry.oversightReport.posture === 'WATCH' ? "bg-brand-amber/10 text-brand-amber border-brand-amber/20" :
                        "bg-brand-red/10 text-brand-red border-brand-red/20"
                      )}>
                        K-POSTURE: {entry.oversightReport.posture}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entry, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `${entry.id}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-400" 
                    title="Export JSON"
                  >
                    <FileDown size={14} />
                  </button>
                  <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-400" title="Share Scenario">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scenario Metadata */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 border-b border-border-subtle pb-1">Scenario Parameters</h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-600 uppercase">Environment</span>
                      <span className="text-[10px] font-mono text-slate-300 border-l border-brand-cyan/30 pl-2">Hum: {entry.metadata.environment.humidity} | Rain: {entry.metadata.environment.rain}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-600 uppercase">Infrastructure</span>
                      <span className="text-[10px] font-mono text-slate-300 border-l border-brand-amber/30 pl-2">Pwr: {entry.metadata.infrastructure.generatorState} | HVAC: {entry.metadata.infrastructure.hvacStatus}</span>
                    </div>
                    <div className="flex flex-col col-span-2 mt-1">
                      <span className="text-[8px] text-slate-600 uppercase">Injected Events</span>
                      <div className="flex gap-2 mt-1">
                        {entry.scenarioEvents.length === 0 ? (
                          <span className="text-[10px] font-mono text-slate-500 italic">None</span>
                        ) : (
                          entry.scenarioEvents.map((evt, i) => (
                            <span key={i} className="text-[9px] font-mono bg-brand-red/10 text-brand-red px-2 py-0.5 rounded border border-brand-red/30">
                              {evt}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Metrics */}
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-border-subtle pb-1">
                    <h3 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Evaluated Perception</h3>
                    {entry.branchParentId && (
                      <span className="text-[8px] uppercase tracking-widest text-slate-500">Diff vs {entry.branchParentId}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const parent = allEntries.find(e => e.id === entry.branchParentId);
                      
                      const renderMetric = (label: string, icon: React.ReactNode, val: number, parentVal: number | undefined, isLowerBetter: boolean) => {
                        let diffStr = null;
                        if (parentVal !== undefined) {
                          const diff = val - parentVal;
                          const diffAbs = Math.abs(diff);
                          const isPositive = diff > 0;
                          
                          // Determine color based on whether lower is better
                          let colorClass = "text-slate-500";
                          if (diffAbs > 0.01 || diffAbs > 0.1) { // some threshold
                            if (isLowerBetter) {
                              colorClass = diff > 0 ? "text-brand-red" : "text-brand-green";
                            } else {
                              colorClass = diff > 0 ? "text-brand-green" : "text-brand-red";
                            }
                          }

                          diffStr = (
                            <span className={cn("text-[10px] ml-1.5", colorClass)}>
                              {diff > 0 ? '+' : diff < 0 ? '-' : ''}{diffAbs.toFixed(1)}{label.includes('%') || label.includes('Rate') || label.includes('Integrity') || label.includes('Stable') || label.includes('Conf') ? '%' : ''}
                            </span>
                          );
                        }

                        return (
                          <div className={cn("p-2 rounded border", label.includes('Ghost') ? "bg-brand-red/5 border-brand-red/20" : "bg-white/5 border-white/5")}>
                            <div className={cn("text-[8px] uppercase tracking-widest flex items-center gap-1", label.includes('Ghost') ? "text-brand-red" : "text-slate-400")}>{icon} {label}</div>
                            <div className="flex items-baseline mt-1">
                              <span className={cn("text-sm font-mono", label.includes('Ghost') ? "text-brand-red" : "text-white")}>{val.toFixed(1)}%</span>
                              {diffStr}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderMetric("Avg Conf. Error", <Target size={10}/>, entry.results.avgConfidenceError * 100, parent ? parent.results.avgConfidenceError * 100 : undefined, true)}
                          {renderMetric("Peak Ghost Rate", <Target size={10}/>, entry.results.peakGhostRate * 100, parent ? parent.results.peakGhostRate * 100 : undefined, true)}
                          {renderMetric("Avg Track Stable", <ActivitySquare size={10}/>, entry.results.avgTrackingStability, parent ? parent.results.avgTrackingStability : undefined, false)}
                          {renderMetric("Lowest Sig Integrity", <Waves size={10}/>, entry.results.lowestSignalIntegrity, parent ? parent.results.lowestSignalIntegrity : undefined, false)}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Council Summary */}
              {entry.finalCouncilReport && (
                <div className="mt-4 p-3 rounded-lg border border-border-subtle bg-bg-deep/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Agent Council Conclusion</span>
                    <span className={cn("text-[9px] font-mono",
                       entry.finalCouncilReport.coordinator.status === 'CRITICAL' ? "text-brand-red" :
                       entry.finalCouncilReport.coordinator.status === 'CONCERN' ? "text-brand-amber" :
                       "text-brand-green"
                    )}>
                      {entry.finalCouncilReport.coordinator.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed border-l-2 border-white/10 pl-2">
                    {entry.finalCouncilReport.coordinator.summary}
                  </p>
                  {entry.finalCouncilReport.coordinator.commonCause && (
                    <div className="text-[10px] font-mono text-brand-red mt-1">
                      Common Cause: {entry.finalCouncilReport.coordinator.commonCause}
                    </div>
                  )}
                </div>
              )}

              {/* Expandable Horizon visualization */}
              <div className="mt-4 border-t border-border-subtle/50 pt-4">
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="flex items-center gap-2 text-[10px] uppercase font-mono text-slate-500 hover:text-white transition-colors w-full p-2 bg-white/5 rounded border border-transparent hover:border-white/10"
                >
                  {expandedId === entry.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Signal Integrity Horizon {entry.timelineData.length > 0 ? '' : '(No Data)'}
                </button>

                <div className={cn("overflow-hidden transition-all duration-300", expandedId === entry.id ? "h-[200px] mt-4 opacity-100" : "h-0 opacity-0")}>
                  {entry.timelineData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={entry.timelineData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorGhost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff0044" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ff0044" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="tick" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 9 }} tickLine={false} />
                        <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 9 }} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="signalIntegrity" name="Signal Integrity" stroke="#00f5ff" fillOpacity={1} fill="url(#colorTarget)" strokeWidth={1} />
                        <Area type="monotone" dataKey="ghostRate" name="Ghost Rate" stroke="#ff0044" fillOpacity={1} fill="url(#colorGhost)" strokeWidth={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
