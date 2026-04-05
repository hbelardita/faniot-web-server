'use client';

import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export interface Reading {
  id: number;
  temperatura: number;
  humedad: number;
  semillas: number;
  created_at: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-sm font-bold text-slate-700">
                {entry.name}: <span className="text-slate-900">{entry.value.toFixed(1)}{entry.name.includes('Temp') ? '°C' : '%'}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function HistoryChart({ data }: { data: Reading[] }) {
  // Format the date for the X axis (only hour:minute)
  const chartData = [...data].reverse().map(item => ({
    ...item,
    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="group relative w-full min-w-0 bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-[3rem] border border-white shadow-2xl shadow-slate-200/60 overflow-hidden transition-all duration-500 hover:shadow-emerald-500/5">
      {/* Decorative glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            Flujo de Datos Ambientales
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-12">
            Últimas 30 muestras en tiempo real
          </p>
        </div>

        <div className="flex gap-4 pl-12 md:pl-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temperatura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Humedad</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[320px] md:h-[380px] -ml-4 md:ml-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="8 8" 
              vertical={false} 
              stroke="#f1f5f9" 
              strokeOpacity={0.8}
            />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              minTickGap={30}
              tickMargin={16}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickMargin={12}
              domain={['auto', 'auto']}
              width={55}
              tickCount={6}
              tickFormatter={(value) => `${value.toFixed(1)}°`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickMargin={12}
              domain={['auto', 'auto']}
              width={55}
              tickCount={6}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="temperatura" 
              name="Temperatura"
              stroke="#f59e0b" 
              strokeWidth={4}
              strokeLinecap="round"
              fillOpacity={1} 
              fill="url(#colorTemp)" 
              animationDuration={1500}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="humedad" 
              name="Humedad"
              stroke="#10b981" 
              strokeWidth={4}
              strokeLinecap="round"
              fillOpacity={1} 
              fill="url(#colorHum)" 
              animationDuration={1500}
              animationDelay={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
