/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RadarSubsystem, TelemetryPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Brush, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { Radio, Activity, Zap, Cpu } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface SubsystemsPanelProps {
  subsystems: RadarSubsystem[];
}

export function SubsystemsPanel({ subsystems }: SubsystemsPanelProps) {
  const [selectedId, setSelectedId] = useState<string>(subsystems[0]?.id || '');

  const selectedSubsystem = subsystems.find(s => s.id === selectedId) || subsystems[0];

  if (!selectedSubsystem) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">No subsystems available</div>;
  }

  return (
    <div className="flex h-full border border-border-subtle rounded-xl overflow-hidden bg-bg-card/40">
      {/* Sidebar for Subsystem Selection */}
      <div className="w-64 border-r border-border-subtle bg-bg-deep/50 flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-brand-cyan">Grid Subsystems</h2>
        </div>
        <div className="flex flex-col p-2 space-y-1 overflow-y-auto">
          {subsystems.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedId(sub.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-2",
                selectedId === sub.id 
                  ? "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan shadow-[0_0_15px_rgba(56,189,248,0.1)]" 
                  : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-serif italic text-sm text-white">{sub.name}</span>
                <StatusBadge status={sub.status} />
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase">ID: {sub.id} | {sub.type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Detailed Telemetry */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="flex justify-between items-end border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Radio size={24} className="text-brand-cyan" />
              <h1 className="text-2xl font-serif italic text-white tracking-tight leading-none">{selectedSubsystem.name}</h1>
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Live Diagnostic Uplink &mdash; Health: {selectedSubsystem.health.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono px-2 py-1 bg-white/5 border border-border-subtle text-slate-400 rounded">
              TYPE: {selectedSubsystem.type}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedSubsystem.telemetry.txPower && selectedSubsystem.telemetry.rxNoise ? (
            <>
              <DetailedTelemetryChart 
                name="TX Power vs RX Noise" 
                multiData={[
                  { name: 'txPower', color: '#fbbf24', data: selectedSubsystem.telemetry.txPower },
                  { name: 'rxNoise', color: '#ef4444', data: selectedSubsystem.telemetry.rxNoise }
                ]} 
              />
              {Object.entries(selectedSubsystem.telemetry)
                .filter(([k]) => k !== 'txPower' && k !== 'rxNoise')
                .map(([key, points]) => (
                  <DetailedTelemetryChart key={key} name={key} data={points} />
                ))}
            </>
          ) : (
            Object.entries(selectedSubsystem.telemetry).map(([key, points]) => (
              <DetailedTelemetryChart key={key} name={key} data={points} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DetailedTelemetryChart({ name, data, multiData }: { name: string; data?: TelemetryPoint[], multiData?: {name: string, color: string, data: TelemetryPoint[]}[] }) {
  // Try to determine color and icon based on metric name
  let color = "#38bdf8"; // brand-cyan
  let Icon = Activity;
  
  if (name.toLowerCase().includes('power')) {
    color = "#fbbf24"; // brand-amber
    Icon = Zap;
  } else if (name.toLowerCase().includes('noise') || name.toLowerCase().includes('error') || name.toLowerCase().includes('clutter.density')) {
    color = "#ef4444"; // brand-red
    Icon = Activity;
  } else if (name.toLowerCase().includes('dsp')) {
    color = "#a855f7"; // brand-purple
    Icon = Cpu;
  }

  const chartData = React.useMemo(() => {
    if (multiData && multiData.length > 0) {
      const map = new Map<number, any>();
      multiData.forEach(s => {
        s.data.forEach(p => {
          if (!map.has(p.timestamp)) {
            map.set(p.timestamp, { timestamp: p.timestamp, time: new Date(p.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
          }
          map.get(p.timestamp)[s.name] = p.value;
        });
      });
      return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
    }
    return (data || []).map(d => ({
      ...d,
      time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
  }, [data, multiData]);

  const activeSeries = React.useMemo(() => {
    if (multiData && multiData.length > 0) {
      return multiData.map(s => ({ name: s.name, color: s.color, dataKey: s.name }));
    }
    return [{ name: name, color, dataKey: 'value' }];
  }, [multiData, name, color]);

  return (
    <div className="bg-bg-deep border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg border bg-white/5 border-border-subtle" style={{ color: multiData ? '#38bdf8' : color }}>
          <Icon size={14} />
        </div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300">{name.replace(/([A-Z])/g, ' $1').trim()}</h3>
      </div>
      
      <div className="h-48 w-full flex flex-col">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={10} 
              tickMargin={10}
              minTickGap={20}
              fontFamily="monospace"
            />
            <YAxis 
              stroke="#475569" 
              fontSize={10}
              tickFormatter={(v) => Number.isInteger(v) ? v : v.toFixed(2)}
              width={40}
              fontFamily="monospace"
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            {multiData && multiData.length > 0 && (
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            )}
            {activeSeries.map((s, i) => (
              <Line 
                key={s.dataKey}
                type="monotone" 
                dataKey={s.dataKey} 
                name={s.name}
                stroke={s.color} 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <Brush 
              dataKey="time" 
              height={20} 
              stroke="#475569" 
              fill="#0f172a" 
              tickFormatter={() => ''} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
