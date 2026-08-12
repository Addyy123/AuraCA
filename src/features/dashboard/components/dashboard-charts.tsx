'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
  'APPROVED': '#10b981', // emerald-500
  'EXTRACTED': '#3b82f6', // blue-500
  'PROCESSING': '#f59e0b', // amber-500
  'UPLOADED': '#6366f1', // indigo-500
  'FAILED': '#ef4444', // red-500
  'REJECTED': '#f43f5e', // rose-500
}

type StatusCount = {
  status: string
  count: number
}

export function DashboardCharts({ statusData }: { statusData: StatusCount[] }) {
  // Filter out zero counts
  const data = statusData.filter(d => d.count > 0).map(d => ({
    name: d.status,
    value: d.count
  }))

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Status Distribution</h3>
      <div className="flex-1 min-h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} 
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
