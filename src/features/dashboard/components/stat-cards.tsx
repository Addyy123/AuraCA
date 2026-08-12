import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{value}</span>
      </div>
      {(description || trend) && (
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          {trend && (
            <span className={`mr-2 font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      )}
    </div>
  )
}
