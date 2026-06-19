import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const PIE_COLORS: Record<string, string> = {
  诊疗费: '#0f766e',
  药品销售: '#f97316',
  住院费: '#3b82f6',
  美容寄养: '#8b5cf6',
  会员充值: '#ec4899',
}

export default function Finance() {
  const { financeRecords, medicalRecords, doctors, drugs } = useAppStore()
  const [hoveredDoctor, setHoveredDoctor] = useState<string | null>(null)

  const totalIncome = financeRecords.reduce((s, r) => s + r.income, 0)
  const totalExpense = financeRecords.reduce((s, r) => s + r.expense, 0)
  const netProfit = totalIncome - totalExpense
  const avgDailyIncome = Math.round(totalIncome / financeRecords.length)

  const trendData = financeRecords.map((r) => ({
    date: r.date.slice(8),
    income: r.income,
    expense: r.expense,
  }))

  const latestRecord = financeRecords[financeRecords.length - 1]
  const incomeDetails = latestRecord.details.filter((d) =>
    ['诊疗费', '药品销售', '住院费', '美容寄养', '会员充值'].includes(d.category)
  )
  const pieData = incomeDetails.map((d) => ({
    name: d.category,
    value: d.amount,
  }))

  const doctorStats = doctors.map((doc) => {
    const records = medicalRecords.filter((r) => r.doctorId === doc.id)
    const visitCount = records.length
    const prescriptionTotal = records.reduce((sum, r) => {
      return (
        sum +
        r.prescriptions.reduce((ps, p) => {
          const drug = drugs.find((d) => d.id === p.drugId)
          return ps + (drug ? drug.price * p.quantity : 0)
        }, 0)
      )
    }, 0)
    const satisfaction = Math.round(85 + Math.random() * 13)
    const overallScore = Math.round(visitCount * 2 + prescriptionTotal * 0.001 + satisfaction * 0.5)
    return {
      id: doc.id,
      name: doc.name,
      visitCount,
      prescriptionTotal,
      satisfaction,
      overallScore,
    }
  })
  const topDoctor = doctorStats.reduce(
    (best, d) => (d.overallScore > best.overallScore ? d : best),
    doctorStats[0]
  )

  const expenseDetails = latestRecord.details.filter((d) =>
    ['药品采购', '人员工资', '设备耗材'].includes(d.category)
  )
  const barData = expenseDetails.map((d) => ({
    category: d.category,
    amount: d.amount,
  }))

  const fmt = (v: number) => `¥${v.toLocaleString()}`

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">财务报表</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">本月营收</div>
            <div className="text-xl font-semibold text-teal-600">{fmt(totalIncome)}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">本月支出</div>
            <div className="text-xl font-semibold text-red-600">{fmt(totalExpense)}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">净利润</div>
            <div className="text-xl font-semibold text-green-600">{fmt(netProfit)}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">日均营收</div>
            <div className="text-xl font-semibold text-blue-600">{fmt(avgDailyIncome)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">收支趋势</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Legend />
              <Line type="monotone" dataKey="income" name="收入" stroke="#0f766e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" name="支出" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">收入构成</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name} ${fmt(value)}`}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#999'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">医生绩效</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2">医生姓名</th>
                <th className="text-right py-2">接诊量</th>
                <th className="text-right py-2">处方金额</th>
                <th className="text-right py-2">满意度</th>
                <th className="text-right py-2">综合评分</th>
              </tr>
            </thead>
            <tbody>
              {doctorStats.map((d) => (
                <tr
                  key={d.id}
                  className={`border-b last:border-0 ${d.id === topDoctor.id ? 'bg-amber-50' : ''} ${hoveredDoctor === d.id ? 'bg-gray-50' : ''}`}
                  onMouseEnter={() => setHoveredDoctor(d.id)}
                  onMouseLeave={() => setHoveredDoctor(null)}
                >
                  <td className="py-2 font-medium">
                    {d.name}
                    {d.id === topDoctor.id && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">TOP</span>
                    )}
                  </td>
                  <td className="text-right py-2">{d.visitCount}</td>
                  <td className="text-right py-2">{fmt(d.prescriptionTotal)}</td>
                  <td className="text-right py-2">{d.satisfaction}%</td>
                  <td className="text-right py-2 font-semibold" style={d.id === topDoctor.id ? { color: '#d97706' } : {}}>
                    {d.overallScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">成本分析</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Bar dataKey="amount" name="金额" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-gray-500">库存周转率</div>
              <div className="text-lg font-semibold">12.5天</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">损耗率</div>
              <div className="text-lg font-semibold">2.3%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">采购成本占比</div>
              <div className="text-lg font-semibold">52%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
