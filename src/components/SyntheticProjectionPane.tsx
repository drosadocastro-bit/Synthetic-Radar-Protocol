import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Database, RefreshCw, Trash2, ShieldAlert, Play, Pause, Radio, Activity, Sparkles, ShieldAlert as AlertIcon } from 'lucide-react';
import { SiteState } from '../types';
import { cn } from '../lib/utils';

interface SyntheticProjectionPaneProps {
  state: SiteState;
  onCriticalAlert?: (alert: {
    id: string;
    subsystem: string;
    message: string;
    timestamp: string;
    confidence: number;
    severity: 'HIGH' | 'CRITICAL';
  }) => void;
}

interface ScanLog {
  id: string;
  timestamp: string;
  subsystem: string;
  message: string;
  status: 'NOMINAL' | 'DRIFT' | 'ADJUSTED' | 'EVALUATING' | 'SIGNAL_ALERT';
  confidence: number;
}

const SCAN_TEMPLATES = [
  {
    subsystem: 'Antenna Array Alpha-3',
    message: 'Phase shift coherence check on beamformers. Waveguide path attenuation predicted at -14.2dB (nominal).',
    status: 'NOMINAL' as const,
    confidence: 0.94,
  },
  {
    subsystem: 'Sector 2 Sweeper',
    message: 'Completed azimuth sweep [12° - 45°]. Multi-path reflections evaluated. Ghost target probability is negligible (<0.02).',
    status: 'NOMINAL' as const,
    confidence: 0.98,
  },
  {
    subsystem: 'Waveguide Predictor',
    message: 'Sub-surface waveguide thermal expansion calculated at +0.12mm. Digital phase compensator engaged.',
    status: 'ADJUSTED' as const,
    confidence: 0.89,
  },
  {
    subsystem: 'Atmospheric Lens',
    message: 'Sector 4 relative humidity fluctuation detected. Atmospheric refraction index updated. Path loss estimation: -1.2dB/km.',
    status: 'NOMINAL' as const,
    confidence: 0.91,
  },
  {
    subsystem: 'DSP Core Freq-Hop',
    message: 'Simulated sweep of dynamic band selection from 5.25GHz to 5.40GHz. Clutter interference profile is low.',
    status: 'NOMINAL' as const,
    confidence: 0.93,
  },
  {
    subsystem: 'Doppler Pipeline',
    message: 'Coherent Integration Time adjusted from 12ms to 16ms to process high-velocity synthetic return path.',
    status: 'ADJUSTED' as const,
    confidence: 0.87,
  },
  {
    subsystem: 'Pedestal 1B Power',
    message: 'Simulating transient voltage load switching. Dynamic bus ripple predicted at <120mV. Ripple breaker margin: Safe.',
    status: 'EVALUATING' as const,
    confidence: 0.95,
  },
  {
    subsystem: 'Clutter Matrix',
    message: 'Phase-array sidelobe density evaluated. Coherent signal cancellation factor predicted at -32.4dB.',
    status: 'NOMINAL' as const,
    confidence: 0.96,
  },
  {
    subsystem: 'Aux Guard Channels',
    message: 'Sidelobe-to-mainlobe ratio check: -24.5dB detected. Estimating signal guard margin on external transmitter.',
    status: 'NOMINAL' as const,
    confidence: 0.92,
  },
  {
    subsystem: 'Target Injector',
    message: 'Prototyping dynamic test signals at coordinate grid [42.1km, 185° azimuth]. High correlation with track filter lock.',
    status: 'EVALUATING' as const,
    confidence: 0.97,
  },
  {
    subsystem: 'Exciter Phase Lock',
    message: 'Local oscillator cycle-to-cycle jitter predicted at 12fs. Thermal stability margin aligns with decay envelopes.',
    status: 'NOMINAL' as const,
    confidence: 0.99,
  },
  {
    subsystem: 'Interference Audit',
    message: 'Noise-floor power density scan complete. Cross-channel leakage margins checked. Zero active frequency jams.',
    status: 'NOMINAL' as const,
    confidence: 0.95,
  },
  {
    subsystem: 'Sector 4 Receiver',
    message: 'Precipitation attenuation analysis running. Signal drift profile suggests 0.45dB degradation from heavy cloud cover.',
    status: 'DRIFT' as const,
    confidence: 0.82,
  },
  {
    subsystem: 'Aperture Synchronizer',
    message: 'Clock synchronization jitter audit on remote receivers. Sync delta calculated at 4.2ps. Phase margin is secure.',
    status: 'NOMINAL' as const,
    confidence: 0.96,
  },
  {
    subsystem: 'Radar Signal Solver',
    message: 'High signal clutter correlation detected in Sector 3. Initiating clutter suppression filters.',
    status: 'SIGNAL_ALERT' as const,
    confidence: 0.88,
  },
  {
    subsystem: 'Antenna Array Alpha-3',
    message: 'CRITICAL THRESHOLD BREACH: Phase-shift misalignment detected on dynamic beamformer. Transmit power loss predicted at -38.5dB (safety limit: -25.0dB).',
    status: 'SIGNAL_ALERT' as const,
    confidence: 0.97,
  },
  {
    subsystem: 'Waveguide Predictor',
    message: 'CRITICAL THRESHOLD BREACH: Thermal expansion on sub-surface waveguide exceeded safe limit of 0.80mm. Local oscillator sync drift warning detected.',
    status: 'SIGNAL_ALERT' as const,
    confidence: 0.95,
  }
];

export default function SyntheticProjectionPane({ state, onCriticalAlert }: SyntheticProjectionPaneProps) {
  const [activeTab, setActiveTab] = useState<'PROBE' | 'STREAM'>('STREAM');
  const [activeQuery, setActiveQuery] = useState<'NONE' | 'REGISTERS' | 'MEMORY'>('NONE');
  const [terminalOutput, setTerminalOutput] = useState<string>('stip-user$ _\n\n[SYSTEM READY // STANDBY FOR SYNTHETIC QUERY]');
  const [isQuerying, setIsQuerying] = useState(false);

  // Background stream states
  const [isStreaming, setIsStreaming] = useState(true);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize stream with some cool starting entries
  useEffect(() => {
    const formatTimestamp = (offsetMs: number) => {
      const d = new Date(Date.now() - offsetMs);
      return d.toISOString().substring(11, 19);
    };

    setScanLogs([
      {
        id: 'initial-1',
        timestamp: formatTimestamp(30000),
        subsystem: 'Sector 2 Sweeper',
        message: 'Completed azimuth sweep [12° - 45°]. Multi-path reflections evaluated. Ghost target probability is negligible (<0.02).',
        status: 'NOMINAL',
        confidence: 0.98,
      },
      {
        id: 'initial-2',
        timestamp: formatTimestamp(20000),
        subsystem: 'Waveguide Predictor',
        message: 'Sub-surface waveguide thermal expansion calculated at +0.12mm. Digital phase compensator engaged.',
        status: 'ADJUSTED',
        confidence: 0.89,
      },
      {
        id: 'initial-3',
        timestamp: formatTimestamp(10000),
        subsystem: 'Aperture Synchronizer',
        message: 'Clock synchronization jitter audit on remote receivers. Sync delta calculated at 4.2ps. Phase margin is secure.',
        status: 'NOMINAL',
        confidence: 0.96,
      },
    ]);
  }, []);

  // Periodic scrolling updates
  useEffect(() => {
    if (!isStreaming || activeTab !== 'STREAM') return;

    const interval = setInterval(() => {
      triggerScanUpdate();
    }, 5500);

    return () => clearInterval(interval);
  }, [isStreaming, activeTab]);

  // Scroll stream container to bottom whenever new logs arrive
  useEffect(() => {
    if (activeTab === 'STREAM') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs, activeTab]);

  const triggerScanUpdate = () => {
    const template = SCAN_TEMPLATES[Math.floor(Math.random() * SCAN_TEMPLATES.length)];
    const d = new Date();
    const timestampStr = d.toISOString().substring(11, 19);

    const newLog: ScanLog = {
      id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: timestampStr,
      subsystem: template.subsystem,
      message: template.message,
      status: template.status,
      confidence: Number((template.confidence + (Math.random() * 0.04 - 0.02)).toFixed(2)),
    };

    setScanLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs

    if (newLog.message.includes('CRITICAL THRESHOLD BREACH') && onCriticalAlert) {
      onCriticalAlert({
        id: newLog.id,
        subsystem: newLog.subsystem,
        message: newLog.message,
        timestamp: newLog.timestamp,
        confidence: newLog.confidence,
        severity: 'CRITICAL',
      });
    }
  };

  const forceCriticalBreach = () => {
    const criticalTemplates = SCAN_TEMPLATES.filter(t => t.message.includes('CRITICAL THRESHOLD BREACH'));
    const template = criticalTemplates[Math.floor(Math.random() * criticalTemplates.length)];
    const d = new Date();
    const timestampStr = d.toISOString().substring(11, 19);

    const newLog: ScanLog = {
      id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: timestampStr,
      subsystem: template.subsystem,
      message: template.message,
      status: template.status,
      confidence: Number((template.confidence + (Math.random() * 0.04 - 0.02)).toFixed(2)),
    };

    setScanLogs(prev => [...prev, newLog].slice(-50));

    if (onCriticalAlert) {
      onCriticalAlert({
        id: newLog.id,
        subsystem: newLog.subsystem,
        message: newLog.message,
        timestamp: newLog.timestamp,
        confidence: newLog.confidence,
        severity: 'CRITICAL',
      });
    }
  };

  const getRegistersText = () => {
    const hex1 = Math.floor((state.timestamp % 10000000) + Math.random() * 1000).toString(16).toUpperCase().padStart(6, '0');
    const hex2 = Math.floor((state.timestamp % 5000000) + Math.random() * 500).toString(16).toUpperCase().padStart(6, '0');
    const hex3 = (state.subsystems[0]?.health || 98.4).toFixed(1).replace('.', '');
    
    return `[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
STI REGISTER PROFILE: REGISTER DECAY MAP (CORE_0_DSP)
============================================================
RAX: 0x00${hex1}  RBX: 0x00${hex2}  RCX: 0x00000${hex3}  RDX: 0x00000001
RSI: 0x7FFF98B2  RDI: 0x7FFF98C0  RBP: 0x7FFF9890  RSP: 0x7FFF9860
R8 : 0x00000100  R9 : 0x00002A11  R10: 0x00000200  R11: 0x00000000
R12: 0x0000001C  R13: 0x0000002F  R14: 0x0000000A  R15: 0x00000004
EFLAGS: [IF TF ZF SF PF AF]  DSP-LOCK: COHERENT
SYSTEM INTERRUPTS: ENABLED // BUS CLOCK CORRELATION: 2.14 GHz
============================================================
QUERY EXECUTION TICK: ${state.timestamp % 10000} // SIMULATION PREDICTOR ACTIVE`;
  };

  const getMemoryText = () => {
    const r1 = Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0');
    const r2 = Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0');
    const r3 = Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0');
    
    return `[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
STI BUFFER HEX DUMP (PHY_SEC_0: SIG_BUFFER)
============================================================
0x7FFF2A80:  41 5A 30 31  20 53 59 4E  54 48 30 31  20 53 49 47  AZ01 SYNTH01 SIG
0x7FFF2A90:  4E 41 4C 20  43 4F 48 45  52 45 4E 43  59 20 4D 41  NAL COHERENCY MA
0x7FFF2AA0:  54 52 49 58  0A 00 00 00  E2 09 1A 4F  B8 A1 ${r1} ${r2}  TRIX....â..O¸íÍï
0x7FFF2AB0:  21 21 00 F0  3A A9 D8 C4  01 00 00 00  00 00 02 02  !!..:©ØÄ........
0x7FFF2AC0:  32 41 D1 0E  00 00 55 C9  39 82 AE FF  00 12 ${r3} CE  2AÑ...UÉ9.®. .«Î
============================================================
V-BUFFER ALLOCATED: 2048 MB // MEMORY PRESSURE: NOMINAL (SYNTHETIC)
DATA INTEGRITY INDEX: ${(state.perceptionMetrics?.signalIntegrity || 99.1).toFixed(2)}%`;
  };

  const handleQuery = (type: 'REGISTERS' | 'MEMORY') => {
    if (isQuerying) return;
    setIsQuerying(true);
    setActiveQuery(type);
    
    const command = type === 'REGISTERS' ? 'show-registers' : 'show-memory';
    setTerminalOutput(`stip-user$ ${command}\n\n[PROBING SECURE GRAPH INTERFACES...]\n[GENERATING SYNTHETIC HARDWARE PROJECTION...]`);

    setTimeout(() => {
      setIsQuerying(false);
      if (type === 'REGISTERS') {
        setTerminalOutput(`stip-user$ show-registers\n\n` + getRegistersText());
      } else {
        setTerminalOutput(`stip-user$ show-memory\n\n` + getMemoryText());
      }
    }, 450);
  };

  const handleClearQuery = () => {
    setActiveQuery('NONE');
    setTerminalOutput('stip-user$ _\n\n[SYSTEM READY // STANDBY FOR SYNTHETIC QUERY]');
  };

  const handleClearStream = () => {
    setScanLogs([]);
  };

  return (
    <div id="synthetic-projection-pane" className="flex flex-col bg-bg-card/40 border border-border-subtle p-4 rounded-xl flex-shrink-0">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-cyan flex items-center gap-2 m-0">
          <Terminal size={12} className="text-brand-cyan animate-pulse" />
          <div className="heading-accent bg-brand-cyan" />
          Synthetic Projections
        </h2>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
          <ShieldAlert size={10} className="text-brand-amber animate-pulse" />
          <span className="text-slate-400">PROJECTIONS ONLY</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-1 bg-white/[0.02] border border-white/5 p-0.5 rounded-lg mb-3">
        <button
          onClick={() => setActiveTab('STREAM')}
          className={cn(
            "text-[9px] uppercase tracking-wider font-mono py-1 rounded transition-all flex items-center justify-center gap-1.5",
            activeTab === 'STREAM'
              ? "bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan shadow-sm"
              : "text-slate-500 hover:text-slate-300 border border-transparent"
          )}
        >
          <Activity size={10} className={cn(isStreaming && "animate-pulse text-brand-cyan")} />
          Scan Stream
        </button>
        <button
          onClick={() => setActiveTab('PROBE')}
          className={cn(
            "text-[9px] uppercase tracking-wider font-mono py-1 rounded transition-all flex items-center justify-center gap-1.5",
            activeTab === 'PROBE'
              ? "bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan shadow-sm"
              : "text-slate-500 hover:text-slate-300 border border-transparent"
          )}
        >
          <Cpu size={10} />
          Direct Probe
        </button>
      </div>

      {/* Tab 1: Direct Prober */}
      {activeTab === 'PROBE' && (
        <div className="flex flex-col animate-fadeIn">
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-3">
            Simulate hardware readouts from secure graph maps. Probe physical parameters without initiating direct system mutations.
          </p>

          {/* Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => handleQuery('REGISTERS')}
              disabled={isQuerying}
              className={cn(
                "text-[9px] uppercase tracking-widest font-mono py-1.5 px-2 border rounded flex items-center justify-center gap-1.5 transition-all",
                activeQuery === 'REGISTERS'
                  ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              )}
            >
              <Cpu size={10} />
              {isQuerying && activeQuery === 'REGISTERS' ? 'Probing...' : 'Registers'}
            </button>
            <button
              onClick={() => handleQuery('MEMORY')}
              disabled={isQuerying}
              className={cn(
                "text-[9px] uppercase tracking-widest font-mono py-1.5 px-2 border rounded flex items-center justify-center gap-1.5 transition-all",
                activeQuery === 'MEMORY'
                  ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              )}
            >
              <Database size={10} />
              {isQuerying && activeQuery === 'MEMORY' ? 'Probing...' : 'Memory'}
            </button>
            <button
              onClick={handleClearQuery}
              disabled={isQuerying}
              className="text-[9px] uppercase tracking-widest font-mono py-1.5 px-2 bg-white/[0.02] border border-white/5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 size={10} />
              Flush
            </button>
          </div>

          {/* Terminal Viewbox */}
          <div className="bg-[#03070C] border border-white/10 rounded-lg p-3 relative font-mono text-[10px] leading-relaxed text-slate-300 h-56 overflow-y-auto select-text custom-scrollbar">
            {/* Synthetic Watermark in background */}
            <div className="absolute right-3 top-3 select-none pointer-events-none opacity-10 flex flex-col items-end">
              <span className="text-[8px] font-black tracking-widest uppercase">STIP PROJECTION</span>
              <span className="text-[7px] tracking-tight">SYNTHETIC READOUT</span>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-slate-300">{terminalOutput}</pre>

            {isQuerying && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-brand-cyan animate-pulse">
                <RefreshCw size={10} className="animate-spin" />
                <span>SOLVING PROJECTION GRAPH...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Scan Stream */}
      {activeTab === 'STREAM' && (
        <div className="flex flex-col animate-fadeIn">
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-3">
            Real-time scrolling log representing dynamic synthetic assessments computed on background radar site scan operations.
          </p>

          {/* Controls toolbar */}
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-lg px-2.5 py-1.5 mb-3 text-[10px] font-mono">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all",
                  isStreaming 
                    ? "text-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/20" 
                    : "text-slate-500 bg-white/5 hover:bg-white/10"
                )}
                title={isStreaming ? "Pause scanning updates" : "Resume scanning updates"}
              >
                {isStreaming ? <Pause size={10} /> : <Play size={10} />}
                <span>{isStreaming ? 'STREAMING' : 'PAUSED'}</span>
              </button>

              <button
                onClick={triggerScanUpdate}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Trigger dynamic sweep immediately"
              >
                <Radio size={10} className={cn(isStreaming && "animate-pulse text-brand-cyan")} />
                <span>SWEEP NOW</span>
              </button>

              <button
                onClick={forceCriticalBreach}
                className="flex items-center gap-1 text-brand-red hover:text-red-400 hover:bg-brand-red/10 px-1.5 py-0.5 rounded transition-all border border-brand-red/20"
                title="Force a simulated critical telemetry breach alert"
              >
                <ShieldAlert size={10} className="animate-pulse text-brand-red" />
                <span>FORCE BREACH</span>
              </button>
            </div>

            <button
              onClick={handleClearStream}
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              title="Clear scan buffer history"
            >
              <Trash2 size={10} />
              <span>CLEAR</span>
            </button>
          </div>

          {/* Scrolling Logs Container */}
          <div className="bg-[#03070C] border border-white/10 rounded-lg p-3 relative h-56 overflow-y-auto select-text custom-scrollbar flex flex-col gap-3">
            {scanLogs.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-slate-600 font-mono text-[9px] uppercase tracking-widest gap-2">
                <Radio size={16} className="text-slate-700 animate-pulse" />
                <span>No scan logs in buffer</span>
              </div>
            ) : (
              scanLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="border-b border-white/[0.03] pb-2 last:border-0 last:pb-0 font-mono text-[10px] leading-relaxed animate-fadeIn"
                >
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-brand-cyan font-bold">[{log.timestamp}]</span>
                      <span className="text-[9px] uppercase text-slate-500 bg-white/5 px-1 py-0.5 rounded-sm font-black border border-white/5 truncate max-w-[130px]">
                        {log.subsystem}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-slate-500">conf: {(log.confidence * 100).toFixed(0)}%</span>
                      <span className={cn(
                        "text-[8px] px-1 rounded-sm font-bold uppercase",
                        log.status === 'NOMINAL' && 'bg-brand-green/10 text-brand-green border border-brand-green/20',
                        log.status === 'ADJUSTED' && 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20',
                        log.status === 'EVALUATING' && 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20',
                        log.status === 'DRIFT' && 'bg-brand-amber/20 text-brand-amber border border-brand-amber/40',
                        log.status === 'SIGNAL_ALERT' && 'bg-brand-red/10 text-brand-red border border-brand-red/20 animate-pulse'
                      )}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-slate-300 text-[10px] font-sans leading-relaxed">
                    <span className="text-slate-500 font-mono text-[9px] block mb-0.5 font-semibold">
                      [SYNTHETIC DIAGNOSTIC PROJECTION]
                    </span>
                    {log.message}
                  </p>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
