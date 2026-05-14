/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TelemetryPoint } from '../types';

export interface Series {
  name: string;
  color: string;
  data: TelemetryPoint[];
}

interface TelemetryChartProps {
  data?: TelemetryPoint[];
  color?: string;
  name?: string;
  series?: Series[];
}

export function TelemetryChart({ data, color = "#38bdf8", name, series }: TelemetryChartProps) {
  const chartData = useMemo(() => {
    if (series && series.length > 0) {
      const map = new Map<number, any>();
      series.forEach(s => {
        s.data.forEach(p => {
          if (!map.has(p.timestamp)) {
            map.set(p.timestamp, { timestamp: p.timestamp });
          }
          map.get(p.timestamp)[s.name] = p.value;
        });
      });
      return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
    }
    return data || [];
  }, [data, series]);

  const activeSeries = useMemo(() => {
    if (series && series.length > 0) {
      return series.map(s => ({ name: s.name, color: s.color, dataKey: s.name }));
    }
    return [{ name: name || 'value', color, dataKey: 'value' }];
  }, [series, name, color]);

  return (
    <div className="h-32 w-full mt-2 flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          <YAxis 
            hide 
            domain={['auto', 'auto']} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0f1a', border: '1px solid #1e293b', borderRadius: '4px' }}
            itemStyle={{ fontSize: '10px' }}
            labelStyle={{ display: 'none' }}
          />
          {series && series.length > 0 && (
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          )}
          {activeSeries.map(s => (
            <Line 
              key={s.dataKey}
              name={s.name}
              type="monotone" 
              dataKey={s.dataKey} 
              stroke={s.color} 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {name && (!series || series.length === 0) && <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter font-mono opacity-50">{name}</div>}
    </div>
  );
}
