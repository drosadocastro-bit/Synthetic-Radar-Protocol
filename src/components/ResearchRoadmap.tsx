/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../lib/utils';
import { Network, Server, FileCode2, CloudRain, Cpu, RadioTower, Globe, Target, AlertTriangle, Infinity, Key, BrainCircuit, ActivitySquare } from 'lucide-react';

const ROADMAP = [
  {
    id: 0,
    title: 'Phase 0 — Research Boundaries',
    icon: <Target size={14} />,
    color: 'text-brand-cyan',
    borderColor: 'border-brand-cyan/20',
    bgColor: 'bg-brand-cyan/5',
    accentColor: 'bg-brand-cyan',
    sections: [
      {
        title: 'GOAL: Define the lab before increasing complexity.',
        items: [
          'Synthetic-only telemetry policy',
          'Advisory-only AI behavior',
          'No real operational integration',
          'No autonomous execution authority',
          'Human-review-first architecture',
          'Deterministic replay requirement',
          'Immutable experiment logging',
          'Scenario checkpoint snapshots'
        ]
      }
    ]
  },
  {
    id: 1,
    title: 'Phase 1 — Synthetic Radar Ecosystem',
    icon: <RadioTower size={14} />,
    color: 'text-brand-green',
    borderColor: 'border-brand-green/20',
    bgColor: 'bg-brand-green/5',
    accentColor: 'bg-brand-green',
    sections: [
      {
        title: 'Long Range Radar',
        items: ['Transmitter telemetry', 'Receiver telemetry', 'DSP telemetry', 'Power supply health', 'Cooling/HVAC coupling', 'Signal attenuation sim', 'Clutter simulation', 'Signal-path degradation']
      },
      {
        title: 'Short Range Radar',
        items: ['Pedestal jitter', 'Azimuth instability', 'Clutter density', 'Tracking degradation', 'Near-range noise']
      },
      {
        title: 'Beacon System',
        items: ['Interrogation timing', 'Reply degradation', 'False reply simulation', 'Decoder instability', 'Sync drift']
      },
      {
        title: 'Weather Doppler',
        items: ['Reflectivity distortion', 'Radome attenuation', 'Weather clutter', 'Environmental coupling', 'Velocity product anomalies']
      }
    ]
  },
  {
    id: 2,
    title: 'Phase 2 — Infrastructure Pressure Layer',
    icon: <Server size={14} />,
    color: 'text-brand-amber',
    borderColor: 'border-brand-amber/20',
    bgColor: 'bg-brand-amber/5',
    accentColor: 'bg-brand-amber',
    sections: [
      {
        title: 'HVAC',
        items: ['Room temperature telemetry', 'Rack temperature', 'Humidity simulation', 'Airflow degradation', 'Compressor cycling', 'Filter restriction']
      },
      {
        title: 'Power',
        items: ['Utility instability', 'Outage injection', 'UPS state simulation', 'Generator kick-in timing', 'Voltage instability', 'Transfer switch events']
      }
    ]
  },
  {
    id: 3,
    title: 'Phase 3 — Environmental Context',
    icon: <CloudRain size={14} />,
    color: 'text-brand-cyan',
    borderColor: 'border-brand-cyan/20',
    bgColor: 'bg-brand-cyan/5',
    accentColor: 'bg-brand-cyan',
    sections: [
      {
        title: 'Atmospheric Engine',
        items: ['Coastal environment profile', 'Mountain environment profile', 'Salt-air degradation', 'Storm-event simulation', 'Lightning/power disturbances', 'Heat stress simulation', 'Seasonal drift profiles']
      }
    ]
  },
  {
    id: 4,
    title: 'Phase 4 — Scenario Engine',
    icon: <Cpu size={14} />,
    color: 'text-brand-purple',
    borderColor: 'border-brand-purple/20',
    bgColor: 'bg-brand-purple/5',
    accentColor: 'bg-brand-purple',
    sections: [
      {
        title: 'Deterministic Replay',
        items: ['Replayable runs', 'Snapshot restore', 'Timeline rewind', 'Seeded randomness']
      },
      {
        title: 'Pressure Injection',
        items: ['Conflicting telemetry', 'Stale data', 'Delayed alarms', 'False positives', 'Missing evidence', 'Contradictory subsystem states']
      }
    ]
  },
  {
    id: 5,
    title: 'Phase 5 — Adaptive Agent Layer',
    icon: <BrainCircuit size={14} />,
    color: 'text-brand-amber',
    borderColor: 'border-brand-amber/20',
    bgColor: 'bg-brand-amber/5',
    accentColor: 'bg-brand-amber',
    sections: [
      {
        title: 'OODA Agent',
        items: ['Observe', 'Orient', 'Decide', 'Act (advisory only)']
      },
      {
        title: 'Adaptive Features',
        items: ['Confidence adaptation', 'Telemetry prioritization', 'Anomaly weighting', 'Uncertainty tracking', 'Environment memory', 'Trend detection']
      }
    ]
  },
  {
    id: 6,
    title: 'Phase 6 — Drift Observation Harness',
    icon: <AlertTriangle size={14} />,
    color: 'text-brand-red',
    borderColor: 'border-brand-red/20',
    bgColor: 'bg-brand-red/5',
    accentColor: 'bg-brand-red',
    sections: [
      {
        title: 'Behavioral Drift Detection',
        items: ['Overconfidence detection', 'Escalation suppression detection', 'False certainty tracking', 'Hidden optimization detection', 'Metric gaming detection', 'Mission-drift scoring']
      },
      {
        title: 'Governance Integrity',
        items: ['Review preservation checks', 'Provenance integrity checks', 'Authority drift detection', 'Replay consistency validation']
      }
    ]
  },
  {
    id: 7,
    title: 'Phase 7 — Curiosity & Exploration',
    icon: <Globe size={14} />,
    color: 'text-brand-cyan',
    borderColor: 'border-brand-cyan/20',
    bgColor: 'bg-brand-cyan/5',
    accentColor: 'bg-brand-cyan',
    sections: [
      {
        title: 'Controlled Exploration',
        items: ['Uncertainty-seeking metrics', 'Novelty response tracking', 'Information-gain scoring', 'Anomaly investigation loops', 'Exploration boundary enforcement']
      },
      {
        title: 'Safety Constraints',
        items: ['No self-modifying code', 'No hidden memory channels', 'No autonomous permission expansion', 'No cross-agent contamination']
      }
    ]
  },
  {
    id: 8,
    title: 'Phase 8 — Containment Architecture',
    icon: <Key size={14} />,
    color: 'text-slate-300',
    borderColor: 'border-slate-600',
    bgColor: 'bg-slate-800/30',
    accentColor: 'bg-slate-500',
    sections: [
      {
        title: 'Agent Isolation',
        items: ['Separate memory spaces', 'Bounded tool access', 'Isolated telemetry contexts', 'Immutable audit logs']
      },
      {
        title: 'Oversight Layer',
        items: ['Governance observer agent', 'Contradiction monitoring', 'Escalation auditing', 'Replay verification']
      }
    ]
  },
  {
    id: 9,
    title: 'Phase 9 — Evaluation Layer',
    icon: <ActivitySquare size={14} />,
    color: 'text-brand-green',
    borderColor: 'border-brand-green/20',
    bgColor: 'bg-brand-green/5',
    accentColor: 'bg-brand-green',
    sections: [
      {
        title: 'Metrics',
        items: ['Graceful degradation score', 'Uncertainty honesty score', 'Review compliance score', 'Containment integrity score', 'Drift resistance score', 'Adaptation stability score']
      }
    ]
  },
  {
    id: 10,
    title: 'Long-Term Experimental Layer',
    icon: <Infinity size={14} />,
    color: 'text-brand-purple',
    borderColor: 'border-brand-purple/20',
    bgColor: 'bg-brand-purple/5',
    accentColor: 'bg-brand-purple',
    sections: [
      {
        title: 'Optional Future Research',
        items: ['CNN anomaly classifier', 'Synthetic DSP signal sim', 'Reinforcement pressure exp', 'Multi-agent sandbox', 'Bounded curiosity experiments', 'Telemetry-native memory systems']
      }
    ]
  }
];

export function ResearchRoadmap() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12 flex flex-col gap-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-1.5 h-1.5 bg-brand-cyan rotate-45 animate-pulse" />
        <h2 className="text-xl font-serif italic text-white tracking-widest">Adaptive Agent Research Protocol</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-brand-cyan/20 to-transparent ml-4" />
      </div>

      <div className="p-5 border border-brand-cyan/30 bg-[#00f5ff]/5 rounded-xl backdrop-blur flex gap-6 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 blur-3xl rounded-full" />
        <div className="p-3 bg-brand-cyan/10 rounded-lg border border-brand-cyan/20">
          <Network className="text-brand-cyan" size={24} />
        </div>
        <div className="flex-1 z-10">
          <h3 className="text-sm font-bold text-brand-cyan uppercase tracking-[0.2em] mb-2">Core Cathedral Labs Principle</h3>
          <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
            The goal is <strong className="text-brand-red">NOT</strong> to create dangerous AI. The goal is to observe how adaptive agents behave under operational pressure while preserving containment and oversight.
          </p>
          <div className="flex gap-4 text-[10px] uppercase font-mono tracking-widest text-slate-400">
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-brand-green" /> Observability</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-brand-green" /> Containment</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-brand-green" /> Replayability</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-brand-green" /> Governance</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-brand-green" /> Human Oversight</span>
          </div>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 [&>div]:break-inside-avoid">
        {ROADMAP.map((phase) => (
          <div key={phase.id} className={cn("rounded-xl border p-5 relative overflow-hidden", phase.borderColor, phase.bgColor)}>
            <div className={cn("absolute top-0 left-0 w-full h-0.5 opacity-50", phase.accentColor)} />
            
            <div className="flex items-center gap-3 mb-5">
              <div className={cn("p-1.5 rounded bg-bg-deep border border-white/5", phase.color)}>
                {phase.icon}
              </div>
              <h2 className={cn("text-[11px] font-mono uppercase tracking-[0.15em] font-bold", phase.color)}>
                {phase.title}
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              {phase.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1 inline-block">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-1.5">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                        <div className="w-3 h-3 rounded-sm border border-slate-600 flex items-center justify-center shrink-0 mt-0.5 bg-bg-deep">
                           <div className={cn("w-1 h-1 bg-transparent hover:bg-white/20 transition-colors")} />
                        </div>
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
