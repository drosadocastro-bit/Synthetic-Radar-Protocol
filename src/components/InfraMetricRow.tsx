import React, { useState, useEffect } from 'react';

export function InfraMetricRow({ label, value }: { label: string, value: number }) {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, value];
      if (next.length > 20) return next.slice(next.length - 20);
      return next;
    });
  }, [value]);

  // Determine min/max for sparkline scaling
  const min = Math.min(...history);
  const max = Math.max(...history);
  
  // padding to prevent flat line exactly on borders
  const padding = max === min ? 1 : (max - min) * 0.1;
  const pMin = min - padding;
  const pMax = max + padding;
  const range = pMax - pMin;

  // sparkline dimensions
  const width = 48;
  const height = 16;
  
  const points = history.map((val, i) => {
    const x = (i / 19) * width; // 20 points max => 19 segments. if less than 20 points, it will start from left and fill.
    const y = height - ((val - pMin) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Value color based on simple heuristics
  let colorClass = "text-slate-300";
  let strokeColor = "#38bdf8"; // brand-cyan
  if (label.toLowerCase().includes('temp') || label.toLowerCase().includes('heat')) {
    if (value > 85) { colorClass = "text-brand-red"; strokeColor = "#ef4444"; }
    else if (value > 75) { colorClass = "text-brand-amber"; strokeColor = "#f59e0b"; }
  } else if (label.toLowerCase().includes('charge') || label.toLowerCase().includes('voltage')) {
    strokeColor = "#f59e0b";
  }

  return (
    <div className="flex justify-between items-center text-[11px] font-mono group">
      <span className="text-slate-500 uppercase truncate pr-2" title={label}>{label}</span>
      <div className="flex items-center gap-2">
         {history.length > 1 && (
           <svg width={width} height={height} className="overflow-visible opacity-60 group-hover:opacity-100 transition-opacity">
             <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
           </svg>
         )}
         <span className={`w-10 text-right ${colorClass}`}>{(Number(value)).toFixed(1)}</span>
      </div>
    </div>
  );
}
