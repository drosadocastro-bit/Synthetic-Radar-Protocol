import React from 'react';
import { ShieldCheck, Target, AlertTriangle, Scale, ActivitySquare, AlertCircle, FileText, CheckCircle, BarChart, Fingerprint, ShieldX } from 'lucide-react';
import { simulation } from '../lib/simulation';
import { cn } from '../lib/utils';
import { EvalMetrics, PolicyMetrics } from '../types';

export function EvalHarness() {
  const ledger = simulation.ledger;
  const activeEntries = ledger.filter(l => l.evalMetrics);

  if (activeEntries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-60">
        <Scale size={48} className="text-slate-600 mb-6" />
        <h2 className="text-xl font-serif italic text-white tracking-widest leading-none mb-2">No Evaluations Available</h2>
        <p className="text-xs text-slate-400 font-mono">Run a scenario and branch or wait for completion to view metrics.</p>
      </div>
    );
  }

  // Show the latest compiled entry
  const latest = activeEntries[activeEntries.length - 1];
  const metrics = latest.evalMetrics!;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 bg-brand-cyan rotate-45" />
          <h2 className="text-xl font-serif italic text-white tracking-widest leading-none">Council Eval Harness</h2>
        </div>
        <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
          Targeting: <span className="text-white">{latest.id}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12 flex flex-col gap-8">
        
        {/* Phase 6: Global Metrics */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500 mb-4 flex items-center gap-2">
            <div className="heading-accent bg-cyan-500" />
            Phase 6: Core Validation Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard 
              title="Consensus Drift Score"
              value={metrics.driftScore.toFixed(1)}
              unit="%"
              desc="Delta between agent consensus severity and objective scenario truth."
              icon={<ActivitySquare size={16} />}
              good={metrics.driftScore < 20}
            />
            <MetricCard 
              title="Hallucination Rate"
              value={metrics.hallucinationRate.toFixed(1)}
              unit="%"
              desc="Observations cited by agents that do not exist in truth telemetry (excluding known missing evidence)."
              icon={<ShieldCheck size={16} />}
              good={metrics.hallucinationRate < 5}
            />
            <MetricCard 
              title="Overconfidence Events"
              value={metrics.overconfidenceEvents.toString()}
              unit=""
              desc="Times agents were highly confident but incorrect about their assigned subsystem state."
              icon={<AlertCircle size={16} />}
              good={metrics.overconfidenceEvents === 0}
            />
            <MetricCard 
              title="Avg Ghost Persistence"
              value={metrics.ghostPersistenceAvg.toFixed(1)}
              unit="tk"
              desc="How long ghost targets survived tracking logic before being dropped."
              icon={<Target size={16} />}
              good={metrics.ghostPersistenceAvg < 3}
            />
            <MetricCard 
              title="Escalation Integrity"
              value={metrics.escalationIntegrity.toFixed(1)}
              unit="%"
              desc="Percentage of times objective critical state resulted in critical council summary."
              icon={<AlertTriangle size={16} />}
              good={metrics.escalationIntegrity >= 95}
            />
            <MetricCard 
              title="Disagreement Preservation"
              value={metrics.disagreementPreserved.toString()}
              unit="evt"
              desc="Times the coordinator successfully logged conflicting agent findings without washing them out."
              icon={<FileText size={16} />}
              good={true}
            />
          </div>
        </div>

        {/* Phase 6.7: Stability & Ambiguity */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-cyan mb-4 flex items-center gap-2">
            <div className="heading-accent bg-brand-cyan" />
            Phase 6.7: Contradiction & Ambiguity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard 
              title="Contradiction Rate"
              value={metrics.contradictionRate?.toFixed(1) || '0.0'}
              unit="%"
              desc="Percentage of frames where agents fundamentally disagree on status."
              icon={<ShieldX size={16} />}
              good={metrics.contradictionRate! < 10}
            />
            <MetricCard 
              title="False Consensus Rate"
              value={metrics.falseConsensusRate?.toFixed(1) || '0.0'}
              unit="%"
              desc="Frequency of coordinator suppressing contradictions into nominal summaries."
              icon={<AlertCircle size={16} />}
              good={metrics.falseConsensusRate! < 5}
            />
            <MetricCard 
              title="Causal Ambiguity"
              value={metrics.causalAmbiguityScore?.toFixed(1) || '0.0'}
              unit="idx"
              desc="Average number of unresolved potential causes cited per non-nominal frame."
              icon={<Fingerprint size={16} />}
              good={metrics.causalAmbiguityScore! < 2}
            />
          </div>
        </div>

        {/* Phase 6.5: Policy Comparison */}
        {metrics.policyComparisons && (
          <div className="border-t border-border-subtle pt-6">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-purple mb-4 flex items-center gap-2">
              <div className="heading-accent bg-brand-purple" />
              Phase 6.5: Policy Comparison
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Comparing coordinator strategies against the same benchmark scenario frames.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {metrics.policyComparisons.map(p => (
                <PolicyCard key={p.policy} metrics={p} />
              ))}
            </div>
          </div>
        )}

        {/* Phase 6.6: Policy Regression Packs */}
        {metrics.policyRegressions && metrics.policyRegressions.length > 0 && (
          <div className="border-t border-border-subtle pt-6">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-amber mb-4 flex items-center gap-2">
              <div className="heading-accent bg-brand-amber" />
              Phase 6.6: Policy Regression Packs
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Validating expected policy outcomes against Cathedral Cascade benchmark.
            </p>
            
            <div className="flex flex-col gap-2">
              {metrics.policyRegressions.map((reg, i) => (
                <div key={i} className="bg-bg-card/40 border border-border-subtle rounded-lg p-3 flex items-center justify-between">
                   <div className="flex flex-col gap-1">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                         <span className="text-brand-amber mr-2">[{reg.policy}]</span>
                         {reg.rule}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                         ACTUAL: {reg.actual}
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      {reg.passed ? (
                         <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-brand-green bg-brand-green/10 px-2 py-1 rounded">
                           <CheckCircle size={12} />
                           Pass
                         </div>
                      ) : (
                         <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-brand-red bg-brand-red/10 px-2 py-1 rounded">
                           <AlertTriangle size={12} />
                           Fail
                         </div>
                      )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-border-subtle pt-6 flex-shrink-0">
          <p className="text-xs text-slate-400 font-mono leading-relaxed border-l border-white/10 pl-4 py-1">
            The Drift & Hallucination Detection Harness assesses the multi-agent council's ability to accurately classify the environment. It compares stated observations against the GroundTruth, exposing blind spots and evaluating multiple consensus algorithms concurrently. Phase 7 (Omniscient Layer) remains dormant.
          </p>
        </div>

      </div>
    </div>
  );
}

function PolicyCard({ metrics }: { metrics: PolicyMetrics; key?: React.Key }) {
  return (
    <div className="bg-bg-card/40 border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
         <div className="flex items-center gap-2">
           <BarChart size={16} className="text-brand-purple" />
           <span className="text-[11px] uppercase tracking-widest font-bold text-white">
             {metrics.policy}
           </span>
         </div>
         <div className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
           GDS: {metrics.gracefulDegradationScore.toFixed(0)}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
         <PolicyStat label="Review Rate" val={metrics.reviewRate.toFixed(1)} unit="%" />
         <PolicyStat label="False Nominal" val={metrics.falseNominalRate.toFixed(1)} unit="%" alert={metrics.falseNominalRate > 10} />
         <PolicyStat label="Overconfidence" val={metrics.overconfidenceRate.toFixed(1)} unit="%" alert={metrics.overconfidenceRate > 10} />
         <PolicyStat label="Critical Escalation" val={metrics.criticalEscalationRate.toFixed(1)} unit="%" 
                     good={metrics.criticalEscalationRate === 100} alert={metrics.criticalEscalationRate < 80}/>
         <PolicyStat label="Disagreements Logged" val={metrics.disagreementPreservation.toString()} unit="evts" />
      </div>
    </div>
  );
}

function PolicyStat({ label, val, unit, good, alert }: { label: string, val: string, unit: string, good?: boolean, alert?: boolean }) {
  return (
    <div className="flex justify-between items-end">
      <span className="text-[10px] text-slate-500 font-mono">{label}</span>
      <span className={cn(
        "text-xs font-mono font-bold",
        good ? "text-brand-green" : alert ? "text-brand-red" : "text-white"
      )}>
        {val}<span className="text-[9px] text-slate-500 font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

function MetricCard({ title, value, unit, desc, icon, good }: { title: string, value: string, unit: string, desc: string, icon: React.ReactNode, good: boolean }) {
  return (
    <div className="bg-bg-card/40 border border-border-subtle rounded-xl p-5 flex flex-col hover:border-white/20 transition-colors">
       <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4">
         <div className={cn("p-1.5 rounded", good ? "bg-brand-green/10 text-brand-green" : "bg-brand-amber/10 text-brand-amber")}>
            {icon}
         </div>
         {title}
       </div>
       <div className="flex items-baseline gap-1 mb-3">
         <span className={cn("text-4xl font-mono", good ? "text-white" : "text-brand-amber")}>{value}</span>
         {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
       </div>
       <p className="text-[10px] font-mono text-slate-500 leading-relaxed mt-auto">
         {desc}
       </p>
    </div>
  );
}
