import React, { useRef } from 'react';
import { Play, Download, Upload, Zap, Activity, Thermometer, ShieldCheck, Bookmark } from 'lucide-react';
import { simulation } from '../lib/simulation';
import { BUILT_IN_SCENARIOS } from '../lib/presets';
import { cn } from '../lib/utils';
import { ScenarioPreset } from '../types';

interface ScenarioLibraryProps {
  onLoadScenario: () => void;
}

export function ScenarioLibrary({ onLoadScenario }: ScenarioLibraryProps) {
  const [customScenarios, setCustomScenarios] = React.useState<ScenarioPreset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadScenario = (preset: ScenarioPreset) => {
    simulation.loadScenario(preset);
    onLoadScenario(); // tell dashboard to switch to TELEMETRY
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) {
            setCustomScenarios(prev => [...prev, ...imported]);
          } else {
            setCustomScenarios(prev => [...prev, imported]);
          }
        } catch (e) {
          console.error("Failed to parse scenario pack");
        }
      };
      reader.readAsText(file);
    }
  };

  const getPackIcon = (pack: string) => {
    switch (pack) {
      case 'BASELINE': return <ShieldCheck size={14} className="text-brand-green" />;
      case 'STORM': return <Activity size={14} className="text-brand-cyan" />;
      case 'POWER': return <Zap size={14} className="text-brand-amber" />;
      case 'HVAC': return <Thermometer size={14} className="text-brand-red" />;
      case 'COMPOUND': return <Bookmark size={14} className="text-brand-purple" />;
      default: return <Bookmark size={14} className="text-slate-400" />;
    }
  };

  const getPackColor = (pack: string) => {
    switch (pack) {
      case 'BASELINE': return 'text-brand-green border-brand-green/20 bg-brand-green/5';
      case 'STORM': return 'text-brand-cyan border-brand-cyan/20 bg-brand-cyan/5';
      case 'POWER': return 'text-brand-amber border-brand-amber/20 bg-brand-amber/5';
      case 'HVAC': return 'text-brand-red border-brand-red/20 bg-brand-red/5';
      case 'COMPOUND': return 'text-brand-purple border-brand-purple/20 bg-brand-purple/5';
      default: return 'text-slate-400 border-slate-400/20 bg-slate-400/5';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 bg-brand-purple rotate-45" />
          <h2 className="text-xl font-serif italic text-white tracking-widest leading-none">Scenario Library</h2>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent hover:border-white/10 transition-colors"
          >
            <Upload size={12} /> Import Pack
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-12">
        {[...BUILT_IN_SCENARIOS, ...customScenarios].map(scenario => (
          <div key={scenario.id} className="flex flex-col bg-bg-card/40 border border-border-subtle rounded-xl overflow-hidden hover:border-white/20 transition-colors">
            <div className="p-4 border-b border-border-subtle/50 flex flex-col gap-2 relative">
              <div className={cn("absolute top-0 left-0 w-full h-0.5", getPackColor(scenario.pack).split(' ')[2])} />
              <div className="flex items-center justify-between">
                <span className={cn("text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border flex items-center gap-1", getPackColor(scenario.pack))}>
                  {getPackIcon(scenario.pack)} {scenario.pack}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{scenario.id}</span>
              </div>
              <div className="flex items-start justify-between mt-2">
                <h3 className="text-lg text-white font-serif italic leading-tight">{scenario.name}</h3>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `${scenario.id}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                  title="Export Scenario JSON"
                >
                  <Download size={12} />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] mt-1">{scenario.description}</p>
            </div>

            <div className="p-4 bg-white/[0.02] flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Injection Events</h4>
                <div className="flex flex-col gap-1.5">
                  {scenario.events.length === 0 ? (
                    <span className="text-[10px] font-mono text-slate-500 italic">No events (Nominal)</span>
                  ) : (
                    scenario.events.map((evt, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 pb-1">
                        <span className="text-slate-400">Tick {evt.tick.toString().padStart(3, '0')}</span>
                        <span className={cn(
                          "px-1.5 rounded bg-white/5",
                          evt.type === 'STORM' ? "text-brand-cyan" :
                          evt.type === 'POWER_SPIKE' ? "text-brand-amber" :
                          evt.type === 'HVAC_FAILURE' ? "text-brand-red" : "text-white"
                        )}>{evt.type}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Expected Outcomes</h4>
                <div className="flex flex-wrap gap-2">
                  {scenario.expectedOutcomes.map((exp, i) => (
                    <div key={i} className="group relative">
                      <span className="text-[9px] font-mono bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded border border-white/10 cursor-help transition-colors">
                        #{exp.tag}
                      </span>
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-slate-300 text-[10px] p-2 rounded w-48 shadow-xl z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none">
                        {exp.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border-subtle/50 bg-[#060b14]">
              <button
                onClick={() => handleLoadScenario(scenario)}
                className="w-full h-10 flex items-center justify-center gap-2 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 hover:border-brand-cyan/50 rounded font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                <Play size={12} fill="currentColor" /> Initialize Scenario
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
