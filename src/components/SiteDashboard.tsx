/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Zap, Thermometer, Radio, Brain, AlertCircle, Play, Pause, GitBranch, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { SiteState, AIReasoning, TelemetryPoint } from '../types';
import { cn } from '../lib/utils';
import { simulation } from '../lib/simulation';
import { performSiteAnalysis } from '../lib/gemini';
import { StatusBadge } from './StatusBadge';
import { TelemetryChart } from './TelemetryChart';
import { ResearchRoadmap } from './ResearchRoadmap';
import { ExperimentLedger } from './ExperimentLedger';
import { ScenarioLibrary } from './ScenarioLibrary';
import { AgentCouncil } from './AgentCouncil';
import { EvalHarness } from './EvalHarness';
import { AlarmDataGrid } from './AlarmDataGrid';
import { OversightPanel } from './OversightPanel';
import { OmniscientNarrative } from './OmniscientNarrative';
import { SubsystemsPanel } from './SubsystemsPanel';
import { InfraMetricRow } from './InfraMetricRow';

export default function SiteDashboard() {
  const [state, setState] = useState<SiteState>(simulation.getState());
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'LEDGER' | 'LIBRARY' | 'EVAL' | 'OVERSIGHT' | 'NARRATIVE' | 'SUBSYSTEMS'>('TELEMETRY');

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESOLVED' | 'UNRESOLVED'>('ALL');

  // Timeline State
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [historyLength, setHistoryLength] = useState(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        if (playbackIndex === -1) {
          // Live simulation
          setState(simulation.update());
          setHistoryLength(simulation.getHistory().length);
        } else {
          // Playback from history
          setPlaybackIndex((prev) => {
            const nextIdx = prev + 1;
            if (nextIdx >= simulation.getHistory().length - 1) {
              return -1; // return to live
            }
            return nextIdx;
          });
        }
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackIndex]);

  useEffect(() => {
    if (playbackIndex !== -1) {
      const hist = simulation.getHistory();
      if (hist[playbackIndex]) {
        setState(hist[playbackIndex].state);
      }
    } else {
      const hist = simulation.getHistory();
      if (hist.length > 0) {
        setState(hist[hist.length - 1].state);
      }
    }
  }, [playbackIndex]);

  const handleBranchScenario = () => {
    if (playbackIndex !== -1) {
      const hist = simulation.getHistory();
      if (hist[playbackIndex]) {
        simulation.branchFromFrame(hist[playbackIndex]);
        setHistoryLength(simulation.history.length);
        setPlaybackIndex(-1);
        setIsPlaying(true);
      }
    }
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
              onClick={() => setActiveTab('SUBSYSTEMS')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'SUBSYSTEMS' ? "bg-brand-amber/10 text-brand-amber border border-brand-amber/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Subsystems
            </button>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'LEDGER' ? "bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Exp. Ledger
            </button>
            <button
              onClick={() => setActiveTab('LIBRARY')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'LIBRARY' ? "bg-brand-purple/10 text-brand-purple border border-brand-purple/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Scenarios
            </button>
            <button
              onClick={() => setActiveTab('EVAL')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'EVAL' ? "bg-brand-purple/10 text-brand-purple border border-brand-purple/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Eval Harness
            </button>
            <button
              onClick={() => setActiveTab('OVERSIGHT')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'OVERSIGHT' ? "bg-brand-red/10 text-brand-red border border-brand-red/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Oversight
            </button>
            <button
              onClick={() => setActiveTab('NARRATIVE')}
              className={cn("text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-md transition-all",
                activeTab === 'NARRATIVE' ? "bg-[#e879f9]/10 text-[#e879f9] border border-[#e879f9]/20" : "text-slate-500 hover:text-slate-300 border border-transparent"
              )}
            >
              Narrative
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
        </div>
      </header>

      {activeTab === 'TELEMETRY' ? (
        <div className="flex flex-col flex-1 overflow-hidden h-full">
          {/* Timeline Controls */}
          <div className="flex flex-col gap-2 bg-bg-card/40 border border-border-subtle p-3 rounded-lg mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest"><RotateCcw size={10} className="inline mr-1" /> Phase 1.2 Timeline Engine</span>
              <span className="text-[10px] font-mono text-brand-cyan">SCENARIO: {playbackIndex === -1 ? 'LIVE' : `FRAME ${playbackIndex}`}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-white/5 hover:bg-brand-cyan/20 text-brand-cyan rounded transition-colors"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max={historyLength - 1}
                  value={playbackIndex === -1 ? historyLength - 1 : playbackIndex}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setIsPlaying(false);
                    setPlaybackIndex(val >= historyLength - 1 ? -1 : val);
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBranchScenario}
                  disabled={playbackIndex === -1}
                  title="Branch scenario from this historical frame"
                  className={cn("text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 px-3 py-1.5 rounded transition-colors",
                    playbackIndex !== -1 ? "bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 border border-brand-purple/50" : "bg-white/5 text-slate-600 border border-transparent")}
                >
                  <GitBranch size={12} /> Scenario Branch
                </button>
                {/* Event Injection only allowed in LIVE mode or after branching (which sets it to LIVE) */}
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                  onClick={() => simulation.injectEvent('POWER_SPIKE')}
                  disabled={playbackIndex !== -1}
                  className="text-[9px] uppercase font-bold tracking-widest px-2 py-1.5 rounded transition-colors bg-brand-amber/10 text-brand-amber hover:bg-brand-amber/20 border border-brand-amber/30 disabled:opacity-30"
                >
                  <Zap size={10} className="inline mr-1"/> Pwr Drop
                </button>
                <button
                  onClick={() => simulation.injectEvent('HVAC_FAILURE')}
                  disabled={playbackIndex !== -1}
                  className="text-[9px] uppercase font-bold tracking-widest px-2 py-1.5 rounded transition-colors bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/30 disabled:opacity-30"
                >
                  <Thermometer size={10} className="inline mr-1"/> HVAC Fail
                </button>
                <button
                  onClick={() => simulation.injectEvent('STORM')}
                  disabled={playbackIndex !== -1}
                  className="text-[9px] uppercase font-bold tracking-widest px-2 py-1.5 rounded transition-colors bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 border border-brand-cyan/30 disabled:opacity-30"
                >
                  <Activity size={10} className="inline mr-1"/> Storm
                </button>
              </div>
            </div>
            {simulation.injectedEventsLog.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border-subtle flex flex-wrap gap-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest self-center mr-2">Injected Events:</span>
                {simulation.injectedEventsLog.map((ev, i) => (
                  <div key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white">{ev.type}</span>
                    <span className="text-[9px] font-mono text-slate-400">@ Tick {ev.tick} ({ev.timeStr})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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

                  {sub.telemetry.txPower && sub.telemetry.rxNoise ? (
                    <>
                      <div key="TxRxGroup">
                        <TelemetryChart 
                          name="TX Power vs RX Noise"
                          series={[
                            { name: 'txPower', color: '#38bdf8', data: sub.telemetry.txPower },
                            { name: 'rxNoise', color: '#f59e0b', data: sub.telemetry.rxNoise }
                          ]} 
                        />
                      </div>
                      {Object.entries(sub.telemetry)
                        .filter(([k]) => k !== 'txPower' && k !== 'rxNoise')
                        .map(([key, points]) => (
                          <div key={key}>
                            <TelemetryChart data={points as TelemetryPoint[]} name={key} />
                          </div>
                      ))}
                    </>
                  ) : (
                    Object.entries(sub.telemetry).map(([key, points]) => (
                      <div key={key}>
                        <TelemetryChart data={points as TelemetryPoint[]} name={key} />
                      </div>
                    ))
                  )}
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
                      <InfraMetricRow key={key} label={key} value={Number(val)} />
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="p-3 border border-brand-amber/20 rounded bg-brand-amber/[0.03]">
                <h3 className="text-[10px] font-bold text-brand-amber/80 uppercase tracking-widest mb-2">Environmental</h3>
                <div className="flex flex-col gap-2">
                  <InfraMetricRow label="External TEMP" value={state.environment.externalTemp * 9 / 5 + 32} />
                  <InfraMetricRow label="HUMIDITY" value={state.environment.humidity} />
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
              <div className="flex gap-4 items-center">
                <div className="flex gap-2 mr-2">
                  <div className="px-2 py-1 bg-slate-800/50 border border-slate-700 text-slate-400 text-[10px] font-mono rounded flex items-center">
                    L: {filteredAlarms.filter(a => a.severity === 'LOW').length}
                  </div>
                  <div className="px-2 py-1 bg-brand-amber/5 border border-brand-amber/10 text-brand-amber text-[10px] font-mono rounded flex items-center">
                    M: {filteredAlarms.filter(a => a.severity === 'MEDIUM').length}
                  </div>
                  <div className="px-2 py-1 bg-brand-amber/10 border border-brand-amber/30 text-brand-amber text-[10px] font-mono rounded flex items-center">
                    H: {filteredAlarms.filter(a => a.severity === 'HIGH').length}
                  </div>
                  <div className="px-2 py-1 bg-brand-red/10 border border-brand-red/30 text-brand-red text-[10px] font-mono rounded flex items-center">
                    C: {filteredAlarms.filter(a => a.severity === 'CRITICAL').length}
                  </div>
                </div>
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

            <div className="flex-1 min-h-0 overflow-hidden">
               <AlarmDataGrid alarms={filteredAlarms} />
            </div>
          </section>
        </div>

        {/* Right Section: Multi-Agent Observer Council */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          <section className="glass-card flex-1 flex flex-col overflow-hidden p-4">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500 mb-4 flex items-center gap-2 flex-shrink-0">
              <div className="heading-accent bg-cyan-500" />
              Phase 5: Agent Council
            </h2>
            <AgentCouncil report={state.councilReport} />
          </section>
          
          <section className="h-32 flex-shrink-0 bg-bg-card/80 border border-brand-cyan/20 rounded-xl p-4 flex flex-col justify-center items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.1)_0%,_transparent_70%)]"></div>
            <div className="flex gap-4 items-end h-10 items-center relative z-10">
              <div className="w-1 h-4 bg-brand-cyan/20"></div>
              <div className="w-1 h-6 bg-brand-cyan/40"></div>
              <div className="w-1 h-10 bg-brand-cyan animate-pulse"></div>
              <div className="w-1 h-8 bg-brand-cyan/60"></div>
              <div className="w-1 h-3 bg-brand-cyan/20"></div>
            </div>
            <span className="text-[9px] relative z-10 font-mono text-brand-cyan uppercase tracking-[0.3em] font-bold opacity-70">DSP Signal Analysis Active</span>
          </section>
        </div>
      </main>
      </div>
      ) : activeTab === 'SUBSYSTEMS' ? (
        <div className="flex-1 overflow-hidden min-h-0">
          <SubsystemsPanel subsystems={state.subsystems} />
        </div>
      ) : activeTab === 'LEDGER' ? (
        <ExperimentLedger />
      ) : activeTab === 'LIBRARY' ? (
        <ScenarioLibrary onLoadScenario={() => {
           setPlaybackIndex(-1);
           setHistoryLength(1);
           setIsPlaying(true);
           setActiveTab('TELEMETRY');
        }} />
      ) : activeTab === 'EVAL' ? (
        <EvalHarness />
      ) : activeTab === 'OVERSIGHT' ? (
        <div className="flex-1 overflow-hidden">
          <OversightPanel report={simulation.getActiveExperimentEntry().oversightReport} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <OmniscientNarrative 
            report={simulation.getActiveExperimentEntry().finalCouncilReport}
            evalMetrics={simulation.getActiveExperimentEntry().evalMetrics}
            oversightReport={simulation.getActiveExperimentEntry().oversightReport}
            state={state}
          />
        </div>
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
