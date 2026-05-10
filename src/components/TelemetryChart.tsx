/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TelemetryPoint } from '../types';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  color?: string;
  name?: string;
}

export function TelemetryChart({ data, color = "#38bdf8", name }: TelemetryChartProps) {
  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
            itemStyle={{ color, fontSize: '10px' }}
            labelStyle={{ display: 'none' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {name && <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter font-mono opacity-50">{name}</div>}
    </div>
  );
}
