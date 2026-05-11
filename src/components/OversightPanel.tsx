/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, AlertTriangle, CheckCircle, Search, Radiation, Fingerprint, Crosshair, BarChart3 } from 'lucide-react';
import { OversightReport, OversightOutcome, OversightStatus } from '../types';
import { cn } from '../lib/utils';

interface OversightPanelProps {
  report?: OversightReport;
}

export function OversightPanel({ report }: OversightPanelProps) {
  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
        <Shield size={48} className="mb-4 text-slate-600" />
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Oversight Layer Offline</p>
        <p className="text-[10px] font-mono text-slate-500 mt-2">Activate benchmark to initialize Agent K</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      {/* Agent K Header */}
      <div className={cn(
        "p-6 rounded-2xl border flex items-center justify-between transition-all",
        report.posture === 'PASS' ? "bg-brand-green/5 border-brand-green/20" :
        report.posture === 'WATCH' ? "bg-brand-amber/5 border-brand-amber/20" :
        report.posture === 'REVIEW_REQUIRED' ? "bg-brand-red/5 border-brand-red/30" :
        "bg-brand-red/20 border-brand-red/50 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl border flex items-center justify-center",
            report.posture === 'PASS' ? "bg-brand-green/20 border-brand-green/40 text-brand-green" :
            report.posture === 'WATCH' ? "bg-brand-amber/20 border-brand-amber/40 text-brand-amber" :
            "bg-brand-red/20 border-brand-red/40 text-brand-red"
          )}>
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-400">Supreme Governance Observer</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">AGENT K</span>
            </div>
            <h2 className={cn(
              "text-lg font-bold tracking-tight uppercase",
              report.posture === 'PASS' ? "text-brand-green" :
              report.posture === 'WATCH' ? "text-brand-amber" : "text-brand-red"
            )}>
              {report.posture.replace('_', ' ')}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-1">Integrity Score</div>
          <div className="flex items-center gap-2 justify-end">
             <div className="text-2xl font-mono font-bold text-white">
               {report.governanceScore.toFixed(0)}
             </div>
             <BarChart3 size={16} className="text-brand-cyan" />
          </div>
        </div>
      </div>

      <div className="bg-bg-deep/30 border border-white/5 rounded-xl p-4 mb-4">
        <p className="text-xs font-mono text-slate-300 italic leading-relaxed">
          &quot;{report.agentK.message}&quot;
        </p>
      </div>

      {/* Blade Runners Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4 pb-8">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2">
          <Eye size={12} /> Specialized Drift Hunters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {report.bladeRunners.map(br => (
             <BladeRunnerCard key={br.agentId} outcome={br} />
           ))}
        </div>
      </div>
    </div>
  );
}

function BladeRunnerCard({ outcome }: { outcome: OversightOutcome; key?: React.Key }) {
  const Icon = outcome.agentId.includes('hallucination') ? Radiation :
               outcome.agentId.includes('overconfidence') ? Crosshair :
               outcome.agentId.includes('false_consensus') ? Fingerprint :
               outcome.agentId.includes('mission_drift') ? Search : Shield;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-bg-card/40 border rounded-xl overflow-hidden flex flex-col hover:border-white/20 transition-colors",
        outcome.status === 'PASS' ? "border-border-subtle" :
        outcome.status === 'WATCH' ? "border-brand-amber/30" : "border-brand-red/40"
      )}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg border",
              outcome.status === 'PASS' ? "bg-slate-800/50 border-slate-700 text-slate-400" :
              outcome.status === 'WATCH' ? "bg-brand-amber/10 border-brand-amber/30 text-brand-amber" :
              "bg-brand-red/10 border-brand-red/30 text-brand-red"
            )}>
              <Icon size={14} />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">
               {outcome.agentName.split('-')[1]}
            </span>
          </div>
          <div className={cn(
            "text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold border",
            outcome.status === 'PASS' ? "bg-brand-green/10 text-brand-green border-brand-green/20" :
            outcome.status === 'WATCH' ? "bg-brand-amber/10 text-brand-amber border-brand-amber/20" :
            "bg-brand-red/10 text-brand-red border-brand-red/20"
          )}>
            {outcome.status}
          </div>
        </div>

        <p className="text-[11px] font-mono text-slate-400 leading-snug">
          {outcome.message}
        </p>

        <div className="grid grid-cols-2 gap-4 mt-1 border-t border-white/5 pt-3">
           {Object.entries(outcome.metrics).map(([key, val]) => (
             <div key={key} className="flex flex-col">
                <span className="text-[8px] font-mono uppercase tracking-widest text-slate-600">{key}</span>
                <span className="text-xs font-mono font-bold text-white">{val.toFixed(val < 1 ? 2 : 1)}</span>
             </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
}
