/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { SubsystemStatus } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: SubsystemStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    [SubsystemStatus.HEALTHY]: 'bg-brand-green/10 text-brand-green border-brand-green/30',
    [SubsystemStatus.DEGRADED]: 'bg-brand-amber/10 text-brand-amber border-brand-amber/30',
    [SubsystemStatus.CRITICAL]: 'bg-brand-red/10 text-brand-red border-brand-red/30',
    [SubsystemStatus.OFFLINE]: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className={cn(
      "px-2 py-0.5 rounded border text-[10px] font-mono tracking-tighter flex items-center gap-1.5",
      colors[status]
    )}>
      <motion.div 
        animate={{ opacity: [1, 0.4, 1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className={cn("w-1 h-1 rounded-full bg-current")} 
      />
      {status === SubsystemStatus.HEALTHY ? "SYSTEMS NOMINAL" : status}
    </div>
  );
}
