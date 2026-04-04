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

export default function HistoryChart({ data }: { data: Reading[] }) {
  // Format the date for the X axis (only hour:minute)
  const chartData = [...data].reverse().map(item => ({
    ...item,
    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="w-full min-w-0 bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <h3 className="text-lg font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
        📈 Historial de las últimas horas
      </h3>
      {/* Contenedor con altura fija para evitar que se comprima en móvil */}
      <div className="w-full h-[280px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              minTickGap={20}
              tickMargin={12}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickMargin={12}
              width={40}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
              }}
            />
            <Area 
              type="monotone" 
              dataKey="temperatura" 
              name="Temperatura (°C)"
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTemp)" 
            />
            <Area 
              type="monotone" 
              dataKey="humedad" 
              name="Humedad (%)"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHum)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
