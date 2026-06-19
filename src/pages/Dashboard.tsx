import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  Activity,
  BedDouble,
  TrendingUp,
  AlertTriangle,
  Pill,
  Syringe,
  Wrench,
  Clock,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

const PIE_COLORS = ['#0f766e', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

interface AlertItem {
  icon: React.ReactNode
  title: string
  description: string
  timestamp: string
  level: 'critical' | 'warning'
}

export default function Dashboard() {
  const { dashboardStats, financeRecords, drugs, medicalRecords, pets, doctors } = useAppStore()

  const kpiCards = [
    {
      label: '今日门诊',
      value: dashboardStats.todayAppointments,
      icon: <Activity className="w-5 h-5" />,
      accent: 'bg-teal-50 text-teal-600',
      iconBg: 'bg-teal-500',
      trend: { direction: 'up' as const, value: 12.5 },
    },
    {
      label: '在院宠物',
      value: dashboardStats.inpatients,
      icon: <BedDouble className="w-5 h-5" />,
      accent: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-500',
      trend: { direction: 'down' as const, value: 3.2 },
    },
    {
      label: '本月营收',
      value: `¥${dashboardStats.monthlyIncome.toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5" />,
      accent: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-500',
      trend: { direction: 'up' as const, value: 8.7 },
    },
    {
      label: '药品预警',
      value: dashboardStats.drugAlertCount,
      icon: <AlertTriangle className="w-5 h-5" />,
      accent: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-500',
      trend: { direction: 'up' as const, value: 25.0 },
    },
  ]

  const lineChartData = financeRecords.map((r) => ({
    date: r.date.slice(5),
    income: r.income,
    expense: r.expense,
  }))

  const latestFinance = financeRecords[financeRecords.length - 1]
  const incomeDetails = latestFinance
    ? latestFinance.details.filter(
        (d) =>
          d.category === '诊疗费' ||
          d.category === '药品销售' ||
          d.category === '住院费' ||
          d.category === '美容寄养' ||
          d.category === '会员充值'
      )
    : []

  const pieData = incomeDetails.map((d) => ({
    name: d.category,
    value: d.amount,
  }))

  const doctorRecordCount = doctors
    .map((doc) => ({
      name: doc.name,
      count: medicalRecords.filter((r) => r.doctorId === doc.id).length,
    }))
    .sort((a, b) => b.count - a.count)

  const alerts: AlertItem[] = []

  drugs
    .filter((d) => d.status === 'expired')
    .forEach((d) => {
      alerts.push({
        icon: <Pill className="w-4 h-4" />,
        title: '药品过期',
        description: `${d.name}（${d.batchNo}）已过期`,
        timestamp: d.expiryDate,
        level: 'critical',
      })
    })

  drugs
    .filter((d) => d.status === 'near_expiry')
    .forEach((d) => {
      alerts.push({
        icon: <Pill className="w-4 h-4" />,
        title: '药品临期',
        description: `${d.name}（${d.batchNo}）将于${d.expiryDate}过期`,
        timestamp: d.expiryDate,
        level: 'warning',
      })
    })

  pets.forEach((pet) => {
    pet.vaccineRecords
      .filter((v) => v.status === 'expired' || v.status === 'expiring')
      .forEach((v) => {
        alerts.push({
          icon: <Syringe className="w-4 h-4" />,
          title: v.status === 'expired' ? '疫苗已过期' : '疫苗即将过期',
          description: `${pet.name}的${v.name}（${v.batchNo}）${v.status === 'expired' ? '已过期' : '即将过期'}`,
          timestamp: v.expiryDate,
          level: v.status === 'expired' ? 'critical' : 'warning',
        })
      })
  })

  const { beds } = useAppStore()
  beds
    .filter((b) => b.status === 'maintenance')
    .forEach((b) => {
      alerts.push({
        icon: <Wrench className="w-4 h-4" />,
        title: '床位维护',
        description: `${b.ward} ${b.number}号床正在维护中`,
        timestamp: new Date().toISOString().split('T')[0],
        level: 'warning',
      })
    })

  alerts.sort((a, b) => {
    if (a.level === 'critical' && b.level !== 'critical') return -1
    if (a.level !== 'critical' && b.level === 'critical') return 1
    return b.timestamp.localeCompare(a.timestamp)
  })

  return (
    <div className="page-container">
      <div className="rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 p-8 mb-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">运营数据中心</h1>
        <p className="text-primary-200 text-sm">实时监控宠物医院运营状态与关键指标</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
          <div key={card.label} className="kpi-card flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              <div className="text-sm text-slate-500 mt-1">{card.label}</div>
              <div
                className={`text-xs mt-1 font-medium ${
                  card.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {card.trend.direction === 'up' ? '↑' : '↓'} {card.trend.value}%
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center text-white shadow-md`}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">营收趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="收入"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="支出"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">业务分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(1)}%`
                }
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `¥${value.toLocaleString()}`}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">医生接诊排名</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={doctorRecordCount} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="count" name="接诊数" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">异常事件</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                  alert.level === 'critical'
                    ? 'border-l-red-500 bg-red-50/60'
                    : 'border-l-yellow-500 bg-yellow-50/60'
                }`}
              >
                <div
                  className={`mt-0.5 shrink-0 ${
                    alert.level === 'critical' ? 'text-red-500' : 'text-yellow-600'
                  }`}
                >
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{alert.title}</span>
                    <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center text-sm text-slate-400 py-8">暂无异常事件</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
