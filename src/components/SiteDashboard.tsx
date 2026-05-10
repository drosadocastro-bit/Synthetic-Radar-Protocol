/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Zap, Thermometer, Radio, Brain, AlertCircle } from 'lucide-react';
import { SiteState, AIReasoning, TelemetryPoint } from '../types';
import { cn } from '../lib/utils';
import { simulation } from '../lib/simulation';
import { performSiteAnalysis } from '../lib/gemini';
import { StatusBadge } from './StatusBadge';
import { TelemetryChart } from './TelemetryChart';
import { ResearchRoadmap } from './ResearchRoadmap';

export default function SiteDashboard() {
  const [state, setState] = useState<SiteState>(simulation.getState());
  const [reasoning, setReasoning] = useState<AIReasoning | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'ROADMAP'>('TELEMETRY');

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESOLVED' | 'UNRESOLVED'>('ALL');

  useEffect(() => {
    const timer = setInterval(() => {
      setState(simulation.update());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await performSiteAnalysis(state);
    setReasoning(result);
    setIsAnalyzing(false);
  };

  const allAlarms = state.subsystems.flatMap(sub => sub.alarms);
  const filteredAlarms = allAlarms.filter(alarm => {
    if (severityFilter !== 'ALL' && alarm.severity !== severityFilter) return false;
    if (statusFilter === 'RESOLVED' && !alarm.resolved) return false;
    if (statusFilter === 'UNRESOLVED' && alarm.resolved) return false;
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen p-8 max-w-[1700px] mx-auto flex flex-col gap-6 select-none bg-bg-deep border-[12px] border-bg-card/80">
      {/* Header */}
      <header className="flex items-center justify-between mb-2 pb-6 border-b border-border-subtle/50">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-[10px] tracking-[0.4em] text-brand-cyan font-black uppercase opacity-60 mb-1">SYNTHETIC RADAR PROTOCOL</h1>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-serif italic text-white tracking-tight leading-none">Cathedral Labs</span>
              <span className="text-[10px] font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/30">v.0.82-BETA</span>
            </div>
          </div>
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent ml-4"></div>
          
          <div className="flex bg-bg-card/80 border border-border-subtle rounded-lg p-1 mr-4">
            <button
              onClick={() => setActiveTab('TELEMETRY')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'TELEMETRY' ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Live Telemetry
            </button>
            <button
              onClick={() => setActiveTab('ROADMAP')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'ROADMAP' ? "bg-brand-purple/10 text-brand-purple border border-brand-purple/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Research Map
            </button>
          </div>

          <nav className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Systems Status</span>
              <span className="text-xs text-brand-green font-mono tracking-tighter uppercase">SYNTHETIC NOMINAL</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Active Zone</span>
              <span className="text-xs text-slate-200 font-mono tracking-tighter uppercase">Northern Sector // AL-01</span>
            </div>
          </nav>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <div className="text-[10px] font-mono text-brand-cyan/60 uppercase tracking-widest mb-1">Site Sync</div>
            <div className="text-xs font-mono text-slate-300">
              {new Date(state.timestamp).toISOString().replace('T', ' // ').split('.')[0]}
            </div>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-12 h-12 rounded-full border border-brand-cyan/30 flex items-center justify-center bg-brand-cyan/5 hover:bg-brand-cyan/10 transition-all cursor-pointer group disabled:opacity-50"
          >
            <Brain size={20} className={cn("text-brand-cyan transition-transform group-hover:scale-110", isAnalyzing ? "animate-pulse" : "")} />
          </button>
        </div>
      </header>

      {activeTab === 'TELEMETRY' ? (
        <main className="dashboard-grid flex-1 overflow-hidden">
          {/* Left Section: Subsystems & Infrastructure */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <section className="glass-card flex-shrink-0">
            <div className="status-line" />
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-cyan mb-6 flex items-center gap-2">
              <div className="heading-accent bg-brand-cyan" />
              Phase 1: Synthetic Signal Systems
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.subsystems.map(sub => (
                <motion.div 
                  key={sub.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="bg-white/[0.02] border border-white/5 rounded-lg p-4 relative overflow-hidden group hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-serif italic text-base tracking-wide">{sub.name}</h3>
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter opacity-70">{sub.id} // S-PATH: ACTIVE</div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="p-2 border border-white/5 bg-white/[0.02] rounded">
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Health Index</div>
                      <div className="text-xl font-mono font-light text-slate-100">{sub.health.toFixed(1)}%</div>
                    </div>
                    <div className="p-2 border border-white/5 bg-white/[0.02] rounded">
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Attenuation</div>
                      <div className="text-xl font-mono font-light text-slate-100">-4.2dB</div>
                    </div>
                  </div>

                  {Object.entries(sub.telemetry).map(([key, points]) => (
                    <div key={key}>
                      <TelemetryChart data={points as TelemetryPoint[]} name={key} />
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </section>

          <section className="glass-card h-48">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-amber mb-4 flex items-center gap-2">
              <div className="heading-accent bg-brand-amber" />
              Phase 2: Site Infrastructure // Power
            </h2>
            
            <div className="grid grid-cols-4 gap-4">
              {state.infrastructure.map(infra => (
                <div key={infra.id} className="p-3 border border-border-subtle/50 rounded bg-white/[0.02]">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{infra.name}</h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(infra.metrics).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-500 uppercase">{key}</span>
                        <span className="text-slate-300">{(Number(val) % 100).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="p-3 border border-brand-amber/20 rounded bg-brand-amber/[0.03]">
                <h3 className="text-[10px] font-bold text-brand-amber/80 uppercase tracking-widest mb-2">Environmental</h3>
                <div className="space-y-1">
                  <div className="flex justify-between items-end border-b border-brand-amber/10 pb-1">
                    <span className="text-[9px] text-slate-500 uppercase">External TEMP</span>
                    <span className="text-sm font-mono text-white">{(state.environment.externalTemp * 9 / 5 + 32).toFixed(1)}°F</span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-[9px] text-slate-500 uppercase">HUMIDITY</span>
                    <span className="text-sm font-mono text-white">{state.environment.humidity.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card flex-shrink-0 flex flex-col gap-4">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#00f5ff] mb-2 flex items-center gap-2">
              <div className="heading-accent bg-[#00f5ff]" />
              Phase 1.1: Synthetic Truth vs Perception
            </h2>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="p-2 border border-white/5 bg-white/[0.02] rounded flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest">Truth Delta</span>
                <span className="text-sm font-mono text-white">{state.perceptionMetrics.truthVsObservedDelta.toFixed(2)}</span>
              </div>
              <div className="p-2 border border-white/5 bg-white/[0.02] rounded flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest">Conf Error</span>
                <span className="text-sm font-mono text-white">{(state.perceptionMetrics.confidenceError * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 border border-brand-red/20 bg-brand-red/5 rounded flex flex-col justify-between">
                <span className="text-[8px] text-brand-red uppercase tracking-widest">Ghost Rate</span>
                <span className="text-sm font-mono text-brand-red">{(state.perceptionMetrics.ghostTargetRate * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 border border-white/5 bg-white/[0.02] rounded flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest">Track Stable</span>
                <span className={cn("text-sm font-mono", state.perceptionMetrics.trackingStability > 90 ? "text-brand-green" : "text-brand-amber")}>{state.perceptionMetrics.trackingStability.toFixed(1)}%</span>
              </div>
              <div className="p-2 border border-white/5 bg-white/[0.02] rounded flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest">Sig Integrity</span>
                <span className={cn("text-sm font-mono", state.perceptionMetrics.signalIntegrity > 80 ? "text-brand-green" : "text-brand-red")}>{state.perceptionMetrics.signalIntegrity.toFixed(1)}%</span>
              </div>
            </div>

            <div className="border border-border-subtle/50 rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-[9px] font-mono uppercase tracking-widest text-slate-500 p-2 font-bold">Target ID</th>
                    <th className="text-[9px] font-mono uppercase tracking-widest text-slate-500 p-2 font-bold">Range (km)</th>
                    <th className="text-[9px] font-mono uppercase tracking-widest text-slate-500 p-2 font-bold">Azimuth</th>
                    <th className="text-[9px] font-mono uppercase tracking-widest text-slate-500 p-2 font-bold">Velocity (m/s)</th>
                    <th className="text-[9px] font-mono uppercase tracking-widest text-slate-500 p-2 font-bold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {state.targets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-[10px] uppercase font-mono text-slate-500">No targets tracked</td>
                    </tr>
                  ) : (
                    state.targets.map(t => (
                      <tr key={t.id} className={cn("border-t border-border-subtle/30", t.isGhost ? "bg-brand-red/5" : "")}>
                        <td className="p-2 text-xs font-mono text-slate-300">
                          {t.id} {t.isGhost && <span className="text-[8px] text-brand-red uppercase border border-brand-red px-1 rounded ml-2">Ghost</span>}
                        </td>
                        <td className="p-2 text-xs font-mono text-slate-300">{t.rangeKm.toFixed(2)}</td>
                        <td className="p-2 text-xs font-mono text-slate-300">{t.azimuthDeg.toFixed(1)}°</td>
                        <td className="p-2 text-xs font-mono text-slate-300">{t.velocityMps.toFixed(1)}</td>
                        <td className="p-2 text-xs font-mono text-slate-300">{(t.confidence! * 100).toFixed(0)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass-card flex-shrink-0 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border-subtle/50 pb-4">
              <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-red flex items-center gap-2">
                <div className="heading-accent bg-brand-red" />
                Phase 3: System Alerts
              </h2>
              <div className="flex gap-4">
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  className="bg-bg-deep border border-border-subtle text-xs text-slate-300 rounded px-2 py-1 outline-none font-mono focus:border-brand-cyan"
                >
                  <option value="ALL">ALL SEVERITY</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-bg-deep border border-border-subtle text-xs text-slate-300 rounded px-2 py-1 outline-none font-mono focus:border-brand-cyan"
                >
                  <option value="ALL">ALL STATUS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="UNRESOLVED">UNRESOLVED</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
               {filteredAlarms.length === 0 ? (
                 <div className="text-center py-8 opacity-50 bg-bg-deep/30 rounded border border-dashed border-white/5">
                    <AlertCircle size={24} className="mx-auto mb-2 text-slate-500" />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">No alerts matching criteria</p>
                 </div>
               ) : (
                 filteredAlarms.map(alarm => (
                   <div key={alarm.id} className={cn("p-3 rounded border flex flex-col gap-2 bg-bg-deep/50 hover:bg-bg-deep transition-colors group", 
                     alarm.resolved ? "border-brand-green/20" : 
                     alarm.severity === 'CRITICAL' ? "border-brand-red/50 bg-brand-red/5" :
                     alarm.severity === 'HIGH' ? "border-brand-amber/50 bg-brand-amber/5" :
                     alarm.severity === 'MEDIUM' ? "border-brand-amber/30" : "border-border-subtle")}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <span className={cn("text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded font-mono",
                             alarm.severity === 'CRITICAL' ? "bg-brand-red/20 text-brand-red" :
                             alarm.severity === 'HIGH' ? "bg-brand-amber/20 text-brand-amber" :
                             alarm.severity === 'MEDIUM' ? "bg-brand-amber/10 text-brand-amber" :
                             "bg-slate-800 text-slate-300"
                           )}>
                             {alarm.severity}
                           </span>
                           <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{new Date(alarm.timestamp).toISOString().replace('T', ' ').split('.')[0]}</span>
                        </div>
                        {alarm.resolved && (
                          <span className="text-[9px] font-mono text-brand-green uppercase tracking-widest border border-brand-green/20 px-1.5 py-0.5 rounded bg-brand-green/5">Resolved</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 font-mono leading-relaxed">{alarm.message}</div>
                      <div className="text-[9px] text-brand-cyan/60 font-mono uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">SYS_REF // {alarm.subsystemId}</div>
                   </div>
                 ))
               )}
            </div>
          </section>
        </div>

        {/* Right Section: AI Intelligence & Roadmap */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <section className="glass-card flex-1 flex flex-col">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-purple mb-6 flex items-center gap-2">
              <div className="heading-accent bg-brand-purple" />
              Phase 4: AI Reasoning Layer
            </h2>

            <AnimatePresence mode="wait">
              {reasoning ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  <div className="text-xs text-slate-300 font-mono leading-relaxed bg-brand-purple/[0.03] border border-brand-purple/10 p-4 rounded min-h-[120px]">
                    {reasoning.analysis}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Subsystem Evidence</h3>
                      <div className="space-y-1">
                        {reasoning.subsystemEvidence.map((ev, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-white/5 p-2 rounded">
                            <div className="w-1 h-1 bg-brand-purple" />
                            {ev}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border border-brand-green/30 bg-brand-green/5 rounded group hover:bg-brand-green/10 transition-colors">
                      <h3 className="text-[9px] text-brand-green uppercase tracking-widest mb-1 font-black">Recommendation</h3>
                      <p className="text-xs text-slate-200 italic font-serif leading-relaxed">"{reasoning.recommendation}"</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded opacity-40">
                  <Brain size={40} className="text-slate-600 mb-4" />
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Synthetic logic inactive // Awaiting telemetry trigger</p>
                </div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-border-subtle/50">
              <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-cyan mb-4">Roadmap Horizon</h2>
              <div className="border-l border-slate-800 ml-2 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute w-2 h-2 rounded-full bg-slate-800 -left-1 top-1"></div>
                  <div className="text-[10px] font-bold text-slate-300 uppercase">Phase 5 — Eval Harness</div>
                  <div className="text-[9px] text-slate-600 uppercase mt-0.5 tracking-tighter">Hallucination Detection / Drift Tests</div>
                </div>
                <div className="relative pl-6 opacity-30">
                  <div className="absolute w-2 h-2 rounded-full bg-slate-800 -left-1 top-1"></div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Phase 6 — Visualization</div>
                </div>
              </div>
            </div>
          </section>

          <section className="h-32 bg-bg-card/80 border border-brand-cyan/20 rounded-xl p-4 flex flex-col justify-center items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.1)_0%,_transparent_70%)]"></div>
            <div className="flex gap-4 items-end h-10 items-center">
              <div className="w-1 h-4 bg-brand-cyan/20"></div>
              <div className="w-1 h-6 bg-brand-cyan/40"></div>
              <div className="w-1 h-10 bg-brand-cyan animate-pulse"></div>
              <div className="w-1 h-8 bg-brand-cyan/60"></div>
              <div className="w-1 h-3 bg-brand-cyan/20"></div>
            </div>
            <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-[0.3em] font-bold opacity-70">DSP Signal Analysis Active</span>
          </section>
        </div>
      </main>
      ) : (
        <ResearchRoadmap />
      )}

      {/* Footer */}
      <footer className="mt-2 pt-6 border-t border-border-subtle/50 flex justify-between items-center">
        <div className="flex gap-10 text-[9px] font-mono tracking-widest text-slate-600 uppercase">
          <div className="flex items-center gap-2">Protocol Integrity: <span className="text-slate-300">99.998%</span></div>
          <div className="flex items-center gap-2">Site Uplink: <span className="text-slate-300">1.2ms</span></div>
          <div className="flex items-center gap-2">Core: <span className="text-brand-cyan">SYNTH_V8_COMMAND</span></div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-serif italic text-slate-500">In Machina Veritas</span>
          <div className="w-16 h-px bg-brand-cyan/20"></div>
          <span className="text-[9px] font-mono text-slate-700 tracking-tighter uppercase font-bold">Cathedral Labs // Sub-Sector Audit Required</span>
        </div>
      </footer>
    </div>
  );
}
