import { prisma } from '@/lib/db'
import { StatCard } from '@/features/dashboard/components/stat-cards'
import { RecentActivity } from '@/features/dashboard/components/recent-activity'
import { DashboardCharts } from '@/features/dashboard/components/dashboard-charts'
import { FileText, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  // Fetch metrics
  const totalInvoices = await prisma.invoice.count()
  
  const approvedCount = await prisma.invoice.count({
    where: { status: 'APPROVED' }
  })
  
  const failedCount = await prisma.invoice.count({
    where: { status: { in: ['FAILED', 'NEEDS_REVIEW', 'REJECTED'] } }
  })

  // Calculate success rate
  const successRate = totalInvoices > 0 
    ? Math.round((approvedCount / totalInvoices) * 100) 
    : 0

  // Total value of approved invoices
  const approvedInvoices = await prisma.invoice.findMany({
    where: { status: 'APPROVED' },
    select: { total: true }
  })
  const totalValue = approvedInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

  // Status Distribution
  const statusGroups = await prisma.invoice.groupBy({
    by: ['status'],
    _count: { status: true }
  })
  const statusData = statusGroups.map(group => ({
    status: group.status,
    count: group._count.status
  }))

  // Recent Uploads
  const recentInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      invoiceNumber: true,
      vendorName: true,
      total: true,
      status: true,
      createdAt: true
    }
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
      
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-300 to-indigo-300 rounded-full blur-3xl transform -translate-y-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Analytics Overview
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Real-time insights into your invoice processing pipeline.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Processed" 
            value={totalInvoices} 
            icon={<FileText className="w-6 h-6" />} 
          />
          <StatCard 
            title="Processing Success" 
            value={`${successRate}%`} 
            icon={<CheckCircle2 className="w-6 h-6" />} 
            description="All time"
          />
          <StatCard 
            title="Needs Attention" 
            value={failedCount} 
            icon={<AlertTriangle className="w-6 h-6" />} 
          />
          <StatCard 
            title="Approved Value" 
            value={formatCurrency(totalValue)} 
            icon={<TrendingUp className="w-6 h-6" />} 
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-[400px]">
            <DashboardCharts statusData={statusData} />
          </div>
          <div className="lg:col-span-2 h-[400px]">
            <RecentActivity invoices={recentInvoices.map(i => ({...i, total: Number(i.total || 0)}))} />
          </div>
        </div>

      </div>
    </div>
  )
}
