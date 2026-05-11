/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alarm } from '../types';
import { cn } from '../lib/utils';

interface AlarmDataGridProps {
  alarms: Alarm[];
}

type SortField = 'severity' | 'timestamp' | 'message' | 'subsystemId' | 'resolved';
type SortOrder = 'asc' | 'desc';

export function AlarmDataGrid({ alarms }: AlarmDataGridProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const severityOrder = {
    'CRITICAL': 3,
    'HIGH': 2,
    'MEDIUM': 1,
    'LOW': 0
  };

  const sortedAlarms = useMemo(() => {
    return [...alarms].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'severity') {
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sortField === 'timestamp') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'resolved') {
        comparison = (a.resolved === b.resolved) ? 0 : a.resolved ? 1 : -1;
      } else {
        comparison = a[sortField].localeCompare(b[sortField]);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [alarms, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />;
    return sortOrder === 'asc' ? <ChevronUp size={12} className="text-brand-cyan" /> : <ChevronDown size={12} className="text-brand-cyan" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-border-subtle/50 rounded-lg bg-bg-deep/40">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-bg-card/90 backdrop-blur-sm z-10 border-b border-border-subtle shadow-sm">
            <tr>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSort('severity')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Severity <SortIcon field="severity" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSort('timestamp')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Timestamp <SortIcon field="timestamp" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSort('message')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Message <SortIcon field="message" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSort('subsystemId')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Subsystem ID <SortIcon field="subsystemId" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSort('resolved')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Status <SortIcon field="resolved" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {sortedAlarms.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <AlertCircle size={32} className="text-slate-600" />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">No active alerts matching criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedAlarms.map((alarm) => (
                <tr 
                  key={alarm.id} 
                  className={cn(
                    "hover:bg-white/[0.03] transition-colors",
                    !alarm.resolved && alarm.severity === 'CRITICAL' && "bg-brand-red/[0.03]"
                  )}
                >
                  <td className="p-3">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono border",
                      alarm.severity === 'CRITICAL' ? "bg-brand-red/10 text-brand-red border-brand-red/30" :
                      alarm.severity === 'HIGH' ? "bg-brand-amber/10 text-brand-amber border-brand-amber/30" :
                      alarm.severity === 'MEDIUM' ? "bg-brand-amber/5 text-brand-amber border-brand-amber/10" :
                      "bg-slate-800 text-slate-400 border-slate-700"
                    )}>
                      {alarm.severity}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(alarm.timestamp).toISOString().replace('T', ' ').split('.')[0]}
                  </td>
                  <td className="p-3 text-[12px] font-mono text-slate-200 min-w-[200px]">
                    {alarm.message}
                  </td>
                  <td className="p-3 text-[10px] font-mono text-brand-cyan/70 uppercase tracking-wider">
                    {alarm.subsystemId}
                  </td>
                  <td className="p-3">
                    {alarm.resolved ? (
                      <div className="flex items-center gap-1.5 text-brand-green">
                        <CheckCircle2 size={12} />
                        <span className="text-[9px] font-mono uppercase tracking-widest">Resolved</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-brand-amber">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
                        <span className="text-[9px] font-mono uppercase tracking-widest">Active</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
