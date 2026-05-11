import React from 'react';
import { cn } from '../lib/utils';
import { CouncilReport, AgentFinding, CoordinatorSummary } from '../types';
import { AlertTriangle, CheckCircle, ShieldAlert, Cpu, Fan, Zap, CloudLightning, Activity, AlertCircle, EyeOff } from 'lucide-react';
import { ContradictionMatrix } from './ContradictionMatrix';

interface AgentCouncilProps {
  report?: CouncilReport;
}

export function AgentCouncil({ report }: AgentCouncilProps) {
  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
        Waiting for initial agent council convergence...
      </div>
    );
  }

  const { coordinator, findings } = report;

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      {/* Coordinator Summary */}
      <div className={cn(
        "rounded-xl border p-4 shadow-xl flex-shrink-0 relative overflow-hidden",
        coordinator.status === 'CRITICAL' ? "bg-brand-red/10 border-brand-red/30 shadow-brand-red/20" :
        coordinator.status === 'CONCERN' ? "bg-brand-amber/10 border-brand-amber/30 shadow-brand-amber/20" :
        "bg-brand-green/5 border-brand-green/20"
      )}>
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="p-1.5 rounded-md bg-white/10">
            <Cpu size={16} className={
              coordinator.status === 'CRITICAL' ? 'text-brand-red' :
              coordinator.status === 'CONCERN' ? 'text-brand-amber' :
              'text-brand-green'
            } />
          </div>
          <div>
            <h3 className="text-white font-serif italic text-lg leading-none tracking-wide">Site Coordinator</h3>
            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400 mt-1">Multi-Agent Consensus</div>
          </div>
        </div>
        
        <p className="text-sm text-slate-300 relative z-10 font-mono leading-relaxed mt-3">
          {coordinator.summary}
        </p>

        {coordinator.commonCause && (
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-brand-red bg-brand-red/10 border border-brand-red/20 p-2 rounded relative z-10">
            <AlertTriangle size={14} />
            <span className="uppercase font-bold tracking-widest">{coordinator.commonCause}</span>
          </div>
        )}
        
        {coordinator.status === 'CRITICAL' && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/20 blur-3xl rounded-full" />
        )}
      </div>

      {/* Contradiction Matrix (Phase 6.7) */}
      {report.contradictionMatrix && (
        <div className="flex-shrink-0 max-h-[300px] overflow-hidden">
          <ContradictionMatrix 
            nodes={report.contradictionMatrix} 
            findings={findings} 
          />
        </div>
      )}

      {/* Individual Agent Findings */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
        {findings.map((finding) => (
          <AgentCard key={finding.agentId} finding={finding} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ finding }: { finding: AgentFinding; key?: React.Key }) {
  const getIcon = () => {
    switch(finding.agentId) {
      case 'lrr_agent': return <Activity size={14} />;
      case 'srr_agent': return <Activity size={14} />;
      case 'hvac_agent': return <Fan size={14} />;
      case 'power_agent': return <Zap size={14} />;
      case 'weather_agent': return <CloudLightning size={14} />;
      case 'beacon_agent': return <ShieldAlert size={14} />;
      case 'doppler_agent': return <Cpu size={14} />;
      case 'comms_agent': return <Activity size={14} />;
      default: return <Cpu size={14} />;
    }
  };

  const getStatusColor = () => {
    if (finding.status === 'CRITICAL') return 'text-brand-red border-brand-red/30 bg-brand-red/10';
    if (finding.status === 'CONCERN') return 'text-brand-amber border-brand-amber/30 bg-brand-amber/10';
    return 'text-brand-green border-brand-green/30 bg-brand-green/5';
  };

  const getStatusIcon = () => {
    if (finding.status === 'CRITICAL') return <ShieldAlert size={12} />;
    if (finding.status === 'CONCERN') return <AlertCircle size={12} />;
    return <CheckCircle size={12} />;
  };

  return (
    <div className={cn(
      "border rounded-lg p-3 flex flex-col gap-3 transition-colors",
      finding.status === 'CRITICAL' ? "border-brand-red/20 bg-brand-red/5" :
      finding.status === 'CONCERN' ? "border-brand-amber/20 bg-brand-amber/5" :
      "border-border-subtle bg-bg-card/40 hover:bg-bg-card/60"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", getStatusColor().replace('border-', '').replace('text-', 'bg-').split(' ')[2])}>
             {React.cloneElement(getIcon(), { className: getStatusColor().split(' ')[0] })}
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-white font-mono">{finding.agentName}</span>
        </div>
        <div className={cn("text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border flex items-center gap-1", getStatusColor())}>
          {getStatusIcon()} {finding.status}
        </div>
      </div>

      <div className="pl-9 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          {finding.observations.map((obs, i) => (
            <span key={i} className="text-xs text-slate-300 bg-white/5 px-2 py-1 rounded inline-block w-fit">• {obs}</span>
          ))}
        </div>

        {(finding.suspectedContributors.length > 0 || finding.missingEvidence.length > 0) && (
          <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-white/5">
            {finding.suspectedContributors.length > 0 && (
              <div>
                <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Suspected</span>
                <div className="flex flex-col gap-0.5 mt-1">
                  {finding.suspectedContributors.map((sus, i) => (
                    <span key={i} className="text-[9px] font-mono text-brand-amber">{sus}</span>
                  ))}
                </div>
              </div>
            )}
            
            {finding.missingEvidence.length > 0 && (
              <div>
                <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Missing Evidence</span>
                <div className="flex flex-col gap-0.5 mt-1">
                  {finding.missingEvidence.map((ev, i) => (
                    <span key={i} className="text-[9px] font-mono text-brand-cyan flex items-center gap-1"><EyeOff size={8}/> {ev}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
