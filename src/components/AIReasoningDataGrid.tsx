import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, BrainCircuit } from 'lucide-react';
import { AIReasoning } from '../types';
import { cn } from '../lib/utils';

interface AIReasoningDataGridProps {
  reasoningLogs: AIReasoning[];
}

type SortField = 'timestamp' | 'confidence' | 'analysis' | 'recommendation';
type SortOrder = 'asc' | 'desc';

export function AIReasoningDataGrid({ reasoningLogs }: AIReasoningDataGridProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedLogs = useMemo(() => {
    return [...reasoningLogs].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'timestamp') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'confidence') {
        comparison = a.confidence - b.confidence;
      } else if (sortField === 'analysis') {
        comparison = a.analysis.localeCompare(b.analysis);
      } else if (sortField === 'recommendation') {
        comparison = a.recommendation.localeCompare(b.recommendation);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [reasoningLogs, sortField, sortOrder]);

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
    return sortOrder === 'asc' ? <ChevronUp size={12} className="text-[#00f5ff]" /> : <ChevronDown size={12} className="text-[#00f5ff]" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-border-subtle/50 rounded-lg bg-bg-deep/40 max-h-64">
      <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-bg-card/90 backdrop-blur-sm z-10 border-b border-border-subtle shadow-sm">
            <tr>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors w-[15%]"
                onClick={() => toggleSort('timestamp')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Timestamp <SortIcon field="timestamp" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors w-[40%]"
                onClick={() => toggleSort('analysis')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Analysis Summary <SortIcon field="analysis" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors w-[10%]"
                onClick={() => toggleSort('confidence')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Confidence <SortIcon field="confidence" />
                </div>
              </th>
              <th 
                className="group p-3 cursor-pointer hover:bg-white/5 transition-colors w-[35%]"
                onClick={() => toggleSort('recommendation')}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Recommendation <SortIcon field="recommendation" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <BrainCircuit size={32} className="text-slate-600" />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">No reasoning logs available</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="p-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toISOString().replace('T', ' ').split('.')[0]}
                  </td>
                  <td className="p-3 text-[11px] font-mono text-slate-200">
                    <div className="line-clamp-2" title={log.analysis}>{log.analysis}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                          "text-[10px] font-mono font-bold",
                          log.confidence > 0.8 ? "text-brand-green" : log.confidence > 0.5 ? "text-brand-amber" : "text-brand-red"
                       )}>
                          {(log.confidence * 100).toFixed(0)}%
                       </span>
                    </div>
                  </td>
                  <td className="p-3 text-[11px] font-mono text-slate-300">
                    <div className="line-clamp-2" title={log.recommendation}>{log.recommendation}</div>
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
