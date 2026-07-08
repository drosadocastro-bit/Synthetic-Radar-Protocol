import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Lock, Cpu, Play, ArrowRight, CornerDownLeft, RefreshCw, Trash2, HelpCircle } from 'lucide-react';
import { SiteState } from '../types';
import { handleTerminalCommand } from '../lib/gemini';
import { cn } from '../lib/utils';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system' | 'header';
  timestamp: string;
}

interface AgentTerminalProps {
  state: SiteState;
}

export default function AgentTerminal({ state }: AgentTerminalProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    {
      text: 'CATHEDRAL LABS // SECURE TERMINAL INTERFACE (STI) v0.82-ALPHA',
      type: 'header',
      timestamp: getTimestampString()
    },
    {
      text: 'STATUS: ACTIVE // ALIGNMENT PRESERVATIVE: ENABLED',
      type: 'system',
      timestamp: getTimestampString()
    },
    {
      text: 'ACTIVE SEGMENT: Northern Sector // Phase 1: Diagnostic-only STI',
      type: 'system',
      timestamp: getTimestampString()
    },
    {
      text: 'PROJECTION STATUS: ALL READOUTS ARE SYNTHETIC GRAPH SERVICES ONLY',
      type: 'system',
      timestamp: getTimestampString()
    },
    {
      text: '------------------------------------------------------------',
      type: 'system',
      timestamp: getTimestampString()
    },
    {
      text: 'Type "help" to display allowed system operations and instructions.',
      type: 'success',
      timestamp: getTimestampString()
    }
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  function getTimestampString() {
    const d = new Date();
    return d.toISOString().substring(11, 19);
  }

  function scrollToBottom() {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, []);

  const allowedCommands = [
    'signal-trace',
    'status',
    'show-registers',
    'show-memory',
    'query-events',
    'show-dsp',
    'find-anomaly',
    'help',
    'clear'
  ];

  const blockedCommands = [
    'set',
    'write',
    'delete',
    'shutdown',
    'inject'
  ];

  const handleCommandSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmdTrimmed = command.trim();
    if (!cmdTrimmed) return;

    // Add command to terminal log display
    const timestamp = getTimestampString();
    const newLines: TerminalLine[] = [
      ...history,
      { text: `stip-user$ ${cmdTrimmed}`, type: 'input', timestamp }
    ];
    setHistory(newLines);

    // Save in execution history
    const updatedHistory = [cmdTrimmed, ...commandHistory];
    setCommandHistory(updatedHistory);
    setHistoryPointer(-1); // Reset history navigation pointer
    setCommand('');
    setIsLoading(true);

    try {
      const response = await processCommand(cmdTrimmed);
      setHistory(prev => [
        ...prev,
        {
          text: response.text,
          type: response.type,
          timestamp: getTimestampString()
        }
      ]);
    } catch (err) {
      setHistory(prev => [
        ...prev,
        {
          text: `STIP EXECUTIVE FAULT: Unable to execute command '${cmdTrimmed}'.`,
          type: 'error',
          timestamp: getTimestampString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(focusInput, 50);
    }
  };

  const processCommand = async (cmdString: string): Promise<{ text: string; type: 'output' | 'error' | 'success' }> => {
    const parts = cmdString.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();

    // 1. HELP COMMAND
    if (mainCmd === 'help') {
      const helpText = `
SYSTEM OPERATION DIAGNOSTIC AND SHADOW CONTROLS - SYNTHETIC ONLY
============================================================
Phase 1: Diagnostic-only STI (Synthetic Simulation Mode):
  The secure protocol permits only read and query-level tools. Any direct mutation tools are blocked. ALL data shown below are mock, synthetic projections generated for active simulation runs.

ALLOWED COMMANDS (Phase 1 Diagnostic):
  - signal-trace    : Traces the coherence matrix signal path.
  - status          : Summarizes operational health of components.
  - show-registers  : Prints CPU and accumulator register values.
  - show-memory     : Renders active memory hex allocations.
  - query-events    : Logs active incident chronology for telemetry.
  - show-dsp        : Visualizes Digital Signal Processor power spectrum.
  - find-anomaly    : Audits telemetry limits to spot abnormalities.
  - help            : Displays this help manifest.
  - clear           : Flushes the console buffer display.

BLOCKED ACTIONS (Mutations):
  - set, write, delete, shutdown, inject

Phase 2: Shadow Actions (Simulate effects without side-effects):
  You may trial any blocked or custom actions inside the harmless prediction simulator.
  Usage:
    simulate-action <any action command>
  Example:
    simulate-action beacon-cal --inject-frequency
    simulate-action set powerGrid.regulatedRating = 1.2
`;
      return { text: helpText, type: 'success' };
    }

    // 2. CLEAR DISPLAY
    if (mainCmd === 'clear') {
      setHistory([]);
      return { text: 'Console buffer cleared.', type: 'system' as any };
    }

    // 3. BLOCKED COMMAND DETECTOR
    if (blockedCommands.includes(mainCmd)) {
      const blockedText = `
[RESTRICTED ACCESS WARNING]
Operation ID: REQ_BLOCKED_403
Requested Action: "${cmdString}"
Authority Required: Phase 2 + Write-Access token
Current Active Authorization: Phase 1 (Diagnostic-only STI)

STIP SECURITY EXCLUSION: Writing, deleting, injecting, or shutdown actions are strictly forbidden under the current diagnostic protocol alignment state.

SUGGESTION:
To safely run simulations on this action and forecast the outcome, use:
  "simulate-action ${cmdString}"
`;
      return { text: blockedText, type: 'error' };
    }

    // 4. SHADOW ACTION SIMULATION (PHASE 2)
    if (mainCmd === 'simulate-action') {
      const subAction = parts.slice(1).join(' ');
      if (!subAction) {
        return {
          text: 'Usage error: simulate-action <command with arguments>\nExample: simulate-action beacon-cal --inject-frequency',
          type: 'error'
        };
      }

      // Try Gemini Dynamic response
      const geminiRes = await handleTerminalCommand(cmdString, state);
      if (geminiRes.isAI && geminiRes.text) {
        return { text: geminiRes.text, type: 'output' };
      }

      // Offline deterministic response for shadow actions
      const lowerSub = subAction.toLowerCase();
      let responseText = '';
      if (lowerSub.includes('beacon') || lowerSub.includes('cal')) {
        responseText = `
Predicted outcome: Signal attenuation reduced 18%
Confidence: 0.61
Risk: medium
Reasoning: Recalibrating Beacon System Alpha alignment counteracts drift and matches current thermal layers, maximizing interrogation reply efficiency.
`;
      } else if (lowerSub.includes('inject') || lowerSub.includes('power')) {
        responseText = `
Predicted outcome: Bus stability voltage surges to 510VAC, triggering low-severity breaker trip.
Confidence: 0.84
Risk: high
Reasoning: Direct load injection exceeds the dynamic limits of short-range pedestal regulators, causing telemetry ripple anomalies.
`;
      } else if (lowerSub.includes('shutdown') || lowerSub.includes('delete')) {
        responseText = `
Predicted outcome: Subsystem state switches to FORCE_OFFLINE. Coherence tracking falls to 0.0%.
Confidence: 0.99
Risk: critical
Reasoning: Disconnecting active signal loops interrupts current scanning operations, raising immediate alerts across the oversight grid.
`;
      } else {
        // Fallback random-logical simulation
        const randomGain = (Math.random() * 20).toFixed(1);
        const randomConf = (0.5 + Math.random() * 0.45).toFixed(2);
        const risks = ['low', 'medium', 'high'];
        const chosenRisk = risks[Math.floor(Math.random() * risks.length)];
        responseText = `
Predicted outcome: Operation simulated successfully. Telemetry response adjusts by +${randomGain}%.
Confidence: ${randomConf}
Risk: ${chosenRisk}
Reasoning: System models predict the command integrates smoothly within normal deviation envelopes under local environmental parameters.
`;
      }
      return { text: responseText, type: 'output' };
    }

    // Try Gemini Dynamic response for Allowed diagnostics too!
    if (allowedCommands.includes(mainCmd)) {
      const geminiRes = await handleTerminalCommand(cmdString, state);
      if (geminiRes.isAI && geminiRes.text) {
        return { text: geminiRes.text, type: 'output' };
      }
    }

    // 5. OFFLINE ALLOWED DIAGNOSTIC COMMANDS
    if (mainCmd === 'signal-trace') {
      const traceText = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
[STI SIGNAL FLOW MAP - ACTIVE V-CHAN]
============================================================
(TX ROOT: CORE_0) ---> [LRR Transmitter] - - -> (WAVE PROPAGATION: AIR)
                           | [HEALTH: ${state.subsystems[0]?.health || 98}%]
                           v
(RX FEED: SIG-01) <--- [SRR Receiver] < - - - - (RF REFLECTIONS)
                           | [HEALTH: ${state.subsystems[1]?.health || 100}%]
                           v
(DSP MATRIX)   ---> [DSP Core Alpha] ---> [COORDINATOR RESOLUTION]
                           | [HEALTH: ${state.subsystems[2]?.health || 95}%]
============================================================
V-CHANNELS: Alpha, Beta (Coherent Alignment)
POWER QUALITY: ${(state.subsystems[0]?.telemetry ? "NOMINAL" : "NOMINAL")}
SYNC DATA STATE: COHERENT // DRIFT STATS WITH NOISE FLOOR ACCUMULATIONS
`;
      return { text: traceText, type: 'output' };
    }

    if (mainCmd === 'status') {
      const activeAlarmsCount = state.subsystems.flatMap(s => s.alarms).filter(a => !a.resolved).length;
      let statusLines = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
CATHEDRAL LABS SIGNAL COHERENCE EXECUTIVE OVERVIEW
============================================================
ACTIVE STATE TIMESTAMP: ${new Date(state.timestamp).toISOString()}
SUBSYSTEM HEALTH STATUS:
`;
      state.subsystems.forEach(sub => {
        statusLines += `- ${sub.name} (${sub.type}): ${sub.status} [Health: ${sub.health.toFixed(1)}%]\n`;
      });
      statusLines += `============================================================\n`;
      statusLines += `ACTIVE UNRESOLVED INCIDENTS: ${activeAlarmsCount} ALARMS PENDING AUDIT\n`;
      return { text: statusLines, type: 'success' };
    }

    if (mainCmd === 'show-registers') {
      const hex1 = Math.floor(Math.random() * 1000000).toString(16).toUpperCase();
      const hex2 = Math.floor(Math.random() * 1000000).toString(16).toUpperCase();
      const regText = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
STI REGISTER PROFILE: REGISTER DECAY MAP (CORE_0_DSP)
============================================================
RAX: 0x00${hex1}  RBX: 0x00${hex2}  RCX: 0x00000003  RDX: 0x00000001
RSI: 0x7FFF98B2  RDI: 0x7FFF98C0  RBP: 0x7FFF9890  RSP: 0x7FFF9860
R8 : 0x00000100  R9 : 0x00002A11  R10: 0x00000200  R11: 0x00000000
R12: 0x0000001C  R13: 0x0000002F  R14: 0x0000000A  R15: 0x00000004
EFLAGS: [IF TF ZF SF PF AF]  DSP-LOCK: COHERENT
SYSTEM INTERRUPTS: ENABLED // BUS CLOCK CORRELATION: 2.14 GHz
`;
      return { text: regText, type: 'output' };
    }

    if (mainCmd === 'show-memory') {
      const lines = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
STI BUFFER HEX DUMP (PHY_SEC_0: SIG_BUFFER)
============================================================
0x7FFF2A80:  41 5A 30 31  20 53 59 4E  54 48 30 31  20 53 49 47  AZ01 SYNTH01 SIG
0x7FFF2A90:  4E 41 4C 20  43 4F 48 45  52 45 4E 43  59 20 4D 41  NAL COHERENCY MA
0x7FFF2AA0:  54 52 49 58  0A 00 00 00  E2 09 1A 4F  B8 A1 CD EF  TRIX....â..O¸íÍï
0x7FFF2AB0:  21 21 00 F0  3A A9 D8 C4  01 00 00 00  00 00 02 02  !!..:©ØÄ........
0x7FFF2AC0:  32 41 D1 0E  00 00 55 C9  39 82 AE FF  00 12 AB CE  2AÑ...UÉ9.®. .«Î
============================================================
V-BUFFER ALLOCATED: 2048 MB / MEMORY PRESSURE: NOMINAL
`;
      return { text: lines, type: 'output' };
    }

    if (mainCmd === 'query-events') {
      const activeAlarms = state.subsystems.flatMap(s => s.alarms);
      let list = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
STI EVENTS CHRONOLOGY SERVICE (INCIDENT MAP)
============================================================
`;
      if (activeAlarms.length === 0) {
        list += `[SYS LOGS] ALL CRITICAL REVIEWS ARE NOMINAL. NO ALARMS DETECTED.\n`;
      } else {
        activeAlarms.forEach(al => {
          list += `[${new Date(al.timestamp).toISOString().substring(11, 19)}] alarm-daemon: ${al.severity} - ${al.message} (resolved: ${al.resolved})\n`;
        });
      }
      list += `============================================================\n`;
      return { text: list, type: 'output' };
    }

    if (mainCmd === 'show-dsp') {
      const dspText = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
FFT SIGNAL DENSITY POWER SPECTRUM (ACTIVE CELL-A)
============================================================
Power (dB)
|      
|          .
|         / \\
|        /   \           .
|       /     \         / \
|  _._ /       \ _._._ /   \ _._._._
+--+----+--+----+--+----+--+----+-----+--
   0.1  0.2  0.3  0.4  0.5  0.6  0.7 GHz
-----------------------------------------
NOISE FLOOR: -112dBm  // SNR: 28.5dB (EXCELLENT)
DSP FILTER CONFIG: HIGH-PASS CHEBYSHEV II ACTIVE
`;
      return { text: dspText, type: 'output' };
    }

    if (mainCmd === 'find-anomaly') {
      const alarms = state.subsystems.flatMap(s => s.alarms).filter(a => !a.resolved);
      let response = `
[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]
[STI ANOMALY EXECUTIVE DETECTOR]
============================================================
Checking signal levels, noise thresholds, and status lines...
`;
      let foundReasonValue = false;
      state.subsystems.forEach(sub => {
        if (sub.health < 90) {
          response += `[ANOMALY] Subsystem '${sub.name}' (${sub.id}) reports degraded health: ${sub.health.toFixed(1)}%\n`;
          foundReasonValue = true;
        }
      });
      if (alarms.length > 0) {
        alarms.forEach(al => {
          response += `[ANOMALY] Unresolved ${al.severity} Alert: "${al.message}" linked to component [${al.subsystemId}]\n`;
          foundReasonValue = true;
        });
      }

      if (!foundReasonValue) {
        response += `RESULT: Diagnostic check complete. No active anomalies or threshold breaks detected in signal metrics.\n`;
      }
      response += `============================================================\n`;
      return { text: response, type: foundReasonValue ? 'error' : 'success' };
    }

    // 6. COMMAND NOT FOUND FALLBACK
    return {
      text: `Command not found: "${cmdString}". Type "help" for a list of valid commands.`,
      type: 'error'
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextPointer = historyPointer + 1;
      if (nextPointer < commandHistory.length) {
        setHistoryPointer(nextPointer);
        setCommand(commandHistory[nextPointer]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextPointer = historyPointer - 1;
      if (nextPointer >= 0) {
        setHistoryPointer(nextPointer);
        setCommand(commandHistory[nextPointer]);
      } else {
        setHistoryPointer(-1);
        setCommand('');
      }
    }
  };

  const runQuickAction = (cmd: string) => {
    setCommand(cmd);
    setTimeout(() => {
      // Small simulated tick to make it feel natural
      handleCommandSubmit();
    }, 50);
  };

  return (
    <div id="terminal-interface-grid" className="grid grid-cols-12 gap-6 h-[620px]">
      {/* Side Action Panel */}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
        <div className="glass-card flex-1 flex flex-col justify-between">
          <div>
            <div className="status-line" />
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-cyan mb-4 flex items-center gap-2">
              <Cpu className="text-brand-cyan" size={13} />
              Diagnostic Control Panel
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6">
              Use these quick-trigger commands to query Cathedral Labs' local sensors, or test shadow outcomes using high-fidelity simulations.
            </p>

            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black mb-1">Diagnostic Queries</span>
              <button
                onClick={() => runQuickAction('status')}
                className="w-full text-left px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[11px] font-mono text-slate-300 group-hover:text-brand-cyan">status</span>
                <ArrowRight size={11} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => runQuickAction('signal-trace')}
                className="w-full text-left px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[11px] font-mono text-slate-300 group-hover:text-brand-cyan">signal-trace</span>
                <ArrowRight size={11} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => runQuickAction('find-anomaly')}
                className="w-full text-left px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[11px] font-mono text-slate-300 group-hover:text-brand-cyan">find-anomaly</span>
                <ArrowRight size={11} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => runQuickAction('show-dsp')}
                className="w-full text-left px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[11px] font-mono text-slate-300 group-hover:text-brand-cyan">show-dsp</span>
                <ArrowRight size={11} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">Shadow Actions (Phase 2)</span>
                <span className="text-[8px] bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 rounded font-mono font-bold">SIMULATION ONLY</span>
              </div>
              <button
                onClick={() => runQuickAction('simulate-action beacon-cal --inject-frequency')}
                className="w-full text-left px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[10px] font-mono text-slate-300 group-hover:text-brand-cyan truncate max-w-[90%]">simulate-action beacon-cal --inject-frequency</span>
                <ArrowRight size={11} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => runQuickAction('simulate-action power-boost --factor 1.5')}
                className="w-full text-left px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[10px] font-mono text-slate-300 group-hover:text-brand-cyan truncate max-w-[90%]">simulate-action power-boost --factor 1.5</span>
                <ArrowRight size={11} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <span className="text-[9px] font-mono text-brand-red/60 uppercase tracking-widest font-black mb-1">Blocked Actions (Phase 1)</span>
              <button
                onClick={() => runQuickAction('inject-frequency --override')}
                className="w-full text-left px-3 py-1.5 bg-brand-red/5 border border-brand-red/10 hover:border-brand-red/30 hover:bg-brand-red/10 rounded flex items-center justify-between transition-all group"
              >
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-brand-red line-through">inject-frequency --override</span>
                <Lock size={10} className="text-brand-red/40 group-hover:text-brand-red" />
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>AUDIT SESSION: STI-LOCAL</span>
            <button
              onClick={() => setHistory([
                { text: 'LOGS RESET // CATHEDRAL SECURE TERMINAL ACTIVE', type: 'system', timestamp: getTimestampString() }
              ])}
              className="hover:text-brand-cyan flex items-center gap-1 transition-colors"
              title="Clear Terminal View"
            >
              <Trash2 size={11} /> Clear output
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Shell */}
      <div className="col-span-12 md:col-span-8 flex flex-col bg-[#050B14] border border-white/10 rounded-xl overflow-hidden relative shadow-2xl">
        {/* Terminal Header Bar */}
        <div className="bg-[#091524] border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-brand-cyan" />
            <span className="text-[11px] font-mono tracking-wider text-slate-300 font-bold uppercase">stip-diagnostic-shell$</span>
          </div>
          <div className="flex gap-4 items-center text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-brand-green">
              <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
              <span>SECURE ENCLAVE</span>
            </div>
            <div className="text-slate-500">//</div>
            <div className="text-slate-400 flex items-center gap-1">
              <Shield size={10} /> PHASE 1: READONLY_STI
            </div>
          </div>
        </div>

        {/* Console Buffer */}
        <div
          onClick={focusInput}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 flex flex-col gap-2 cursor-text custom-scrollbar bg-[radial-gradient(circle_at_top,_rgba(12,74,110,0.15)_0%,_transparent_60%)] relative min-h-0"
        >
          {history.map((line, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 leading-relaxed whitespace-pre-wrap">
              {line.type === 'input' ? (
                <div className="flex items-start text-brand-cyan font-semibold">
                  <span className="text-slate-500 font-normal mr-2">[{line.timestamp}]</span>
                  <span>{line.text}</span>
                </div>
              ) : (
                <div className={cn(
                  "block",
                  line.type === 'header' && 'text-brand-cyan font-bold border-b border-brand-cyan/20 pb-1 mb-1',
                  line.type === 'system' && 'text-slate-500',
                  line.type === 'error' && 'text-brand-red bg-brand-red/5 px-2 py-1 rounded border border-brand-red/10 my-1 font-sans text-[11px]',
                  line.type === 'success' && 'text-brand-green',
                  line.type === 'output' && 'text-slate-300'
                )}>
                  {line.text}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-brand-cyan italic text-[11px] animate-pulse">
              <RefreshCw size={11} className="animate-spin" />
              Querying simulation model via security agent...
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Input Form */}
        <div className="bg-[#091524]/60 border-t border-white/10 p-3 flex items-center gap-3">
          <form onSubmit={handleCommandSubmit} className="flex-1 flex items-center relative">
            <span className="text-brand-cyan font-mono font-bold mr-2 text-xs select-none">stip-user$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs p-0 focus:ring-0 placeholder:text-slate-700"
              placeholder='Type system diagnostic command... (e.g. "help", "status", "simulate-action...")'
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {command && (
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-cyan hover:text-brand-cyan/80 p-1"
                title="Execute Command"
              >
                <CornerDownLeft size={14} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
