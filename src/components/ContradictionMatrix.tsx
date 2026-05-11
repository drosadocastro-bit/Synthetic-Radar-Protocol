/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Link, Zap } from 'lucide-react';
import { ContradictionNode, AgentFinding } from '../types';
import { cn } from '../lib/utils';

interface ContradictionMatrixProps {
  nodes: ContradictionNode[];
  findings: AgentFinding[];
}

export function ContradictionMatrix({ nodes, findings }: ContradictionMatrixProps) {
  const agents = findings.map(f => ({ id: f.agentId, name: f.agentName.split(' ')[0] }));
  
  const getRelationship = (a: string, b: string) => {
    return nodes.find(n => (n.agentA === a && n.agentB === b) || (n.agentA === b && n.agentB === a));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-cyan flex items-center gap-2">
          <div className="heading-accent bg-brand-cyan" />
          Agent Contradiction Heatmap
        </h3>
        <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-slate-500">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-green" /> Aligned</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-purple" /> Causal</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-amber/50" /> Overlap</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-red" /> Conflict</div>
        </div>
      </div>

      <div className="bg-bg-deep/40 border border-border-subtle rounded-xl p-6 overflow-x-auto custom-scrollbar">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${agents.length + 1}, auto)` }}>
          {/* Header Row */}
          <div className="w-20 h-8" />
          {agents.map(agent => (
            <div key={agent.id} className="w-16 h-8 flex items-center justify-center text-[8px] font-bold uppercase tracking-tighter text-slate-500 transform -rotate-45">
              {agent.name}
            </div>
          ))}

          {/* Rows */}
          {agents.map((rowAgent) => (
            <React.Fragment key={rowAgent.id}>
              <div className="w-20 h-16 flex items-center pr-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">
                {rowAgent.name}
              </div>
              {agents.map((colAgent) => {
                if (rowAgent.id === colAgent.id) {
                   return <div key={colAgent.id} className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-md" />;
                }
                
                const node = getRelationship(rowAgent.id, colAgent.id);
                if (!node) return <div key={colAgent.id} className="w-16 h-16" />;

                return (
                  <div key={colAgent.id} className="relative group">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "w-16 h-16 border rounded-md transition-all cursor-crosshair flex flex-col items-center justify-center gap-1",
                        node.relationship === 'AGREEMENT' ? "bg-brand-green/10 border-brand-green/30" :
                        node.relationship === 'CAUSAL_ALIGNMENT' ? "bg-brand-purple/10 border-brand-purple/30" :
                        node.relationship === 'UNCERTAIN_OVERLAP' ? "bg-white/5 border-white/10" :
                        "bg-brand-red/10 border-brand-red/40"
                      )}
                    >
                      {node.relationship === 'AGREEMENT' && <CheckCircle2 size={12} className="text-brand-green" />}
                      {node.relationship === 'CAUSAL_ALIGNMENT' && <Link size={12} className="text-brand-purple" />}
                      {node.relationship === 'UNCERTAIN_OVERLAP' && <Zap size={12} className="opacity-30" />}
                      {node.relationship === 'CONTRADICTION' && <AlertTriangle size={12} className="text-brand-red animate-pulse" />}
                      
                      <div className="text-[10px] font-mono font-bold text-white/50">
                        {(node.strength * 100).toFixed(0)}
                      </div>
                    </motion.div>

                    {/* Tooltip */}
                    <div className="absolute top-0 left-full ml-2 z-50 w-48 bg-bg-card border border-border-subtle rounded-lg p-3 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      <div className="text-[9px] uppercase font-bold text-slate-500 mb-2 truncate">
                         {rowAgent.name} + {colAgent.name}
                      </div>
                      <div className={cn(
                        "text-[10px] font-mono font-bold uppercase mb-1",
                        node.relationship === 'AGREEMENT' ? "text-brand-green" :
                        node.relationship === 'CAUSAL_ALIGNMENT' ? "text-brand-purple" :
                        node.relationship === 'CONTRADICTION' ? "text-brand-red" : "text-white/60"
                      )}>
                        {node.relationship.replace('_', ' ')}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 leading-tight">
                        {node.reasoning}
                      </p>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
