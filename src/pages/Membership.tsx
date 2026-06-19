import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  Users,
  Crown,
  Award,
  UserPlus,
  Search,
  Syringe,
  Bug,
  Heart,
  Package,
  Shield,
  Apple,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

function getRecommendationType(text: string) {
  if (/疫苗|接种/.test(text)) return 'vaccine'
  if (/驱虫/.test(text)) return 'deworming'
  if (/过敏|恢复|护理/.test(text)) return 'rehab'
  if (/套餐|升级|续费|绝育|体检/.test(text)) return 'package'
  if (/保险/.test(text)) return 'insurance'
  if (/营养|补充/.test(text)) return 'supplement'
  return 'package'
}

const typeConfig: Record<string, { icon: typeof Syringe; label: string; color: string }> = {
  vaccine: { icon: Syringe, label: '疫苗提醒', color: 'text-blue-500' },
  deworming: { icon: Bug, label: '驱虫提醒', color: 'text-purple-500' },
  rehab: { icon: Heart, label: '康复关怀', color: 'text-pink-500' },
  package: { icon: Package, label: '套餐推荐', color: 'text-orange-500' },
  insurance: { icon: Shield, label: '保险推荐', color: 'text-emerald-500' },
  supplement: { icon: Apple, label: '营养补充', color: 'text-red-500' },
}

const levelColors: Record<string, string> = {
  钻石会员: '#f59e0b',
  金卡会员: '#eab308',
  银卡会员: '#64748b',
  普通会员: '#9ca3af',
}

const levelBadgeClass: Record<string, string> = {
  钻石会员: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white',
  金卡会员: 'bg-yellow-400 text-yellow-900',
  银卡会员: 'bg-slate-400 text-white',
  普通会员: 'bg-gray-300 text-gray-700',
}

const levelBenefits: Record<string, { discount: string; benefits: string }> = {
  钻石会员: { discount: '8折', benefits: '优先就诊 + 免费体检' },
  金卡会员: { discount: '85折', benefits: '优先就诊' },
  银卡会员: { discount: '92折', benefits: '' },
  普通会员: { discount: '95折', benefits: '' },
}

export default function Membership() {
  const { members, getOwnerById } = useAppStore()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('全部')

  const diamondCount = members.filter((m) => m.level === '钻石会员').length
  const goldCount = members.filter((m) => m.level === '金卡会员').length
  const now = new Date('2026-06-20')
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const newThisMonth = members.filter((m) => m.joinDate >= thisMonthStart).length

  const filteredMembers = members.filter((m) => {
    const owner = getOwnerById(m.ownerId)
    const nameMatch = !search || (owner?.name ?? '').includes(search)
    const levelMatch = levelFilter === '全部' || m.level === levelFilter
    return nameMatch && levelMatch
  })

  const levelDistribution = ['钻石会员', '金卡会员', '银卡会员', '普通会员']
    .map((level) => ({
      name: level,
      value: members.filter((m) => m.level === level).length,
    }))
    .filter((d) => d.value > 0)

  const topSpenders = [...members]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
    .map((m) => ({
      name: getOwnerById(m.ownerId)?.name ?? '',
      amount: m.totalSpent,
    }))

  const allRecommendations = members.flatMap((m) =>
    m.recommendations.map((rec) => ({
      memberId: m.id,
      memberName: getOwnerById(m.ownerId)?.name ?? '',
      text: rec,
      type: getRecommendationType(rec),
    }))
  )

  const grouped = allRecommendations.reduce<Record<string, typeof allRecommendations>>(
    (acc, item) => {
      ;(acc[item.type] ??= []).push(item)
      return acc
    },
    {}
  )

  const stats = [
    { label: '会员总数', value: members.length, icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: '钻石会员', value: diamondCount, icon: Crown, color: 'text-amber-600 bg-amber-50' },
    { label: '金卡会员', value: goldCount, icon: Award, color: 'text-yellow-600 bg-yellow-50' },
    { label: '本月新增', value: newThisMonth, icon: UserPlus, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">会员运营</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="kpi-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">会员列表</h2>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input-field pl-9"
                  placeholder="搜索会员姓名..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="select-field w-40"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="全部">全部</option>
                <option value="钻石会员">钻石会员</option>
                <option value="金卡会员">金卡会员</option>
                <option value="银卡会员">银卡会员</option>
                <option value="普通会员">普通会员</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3">会员姓名</th>
                    <th className="px-4 py-3">等级</th>
                    <th className="px-4 py-3">积分</th>
                    <th className="px-4 py-3">余额</th>
                    <th className="px-4 py-3">累计消费</th>
                    <th className="px-4 py-3">折扣</th>
                    <th className="px-4 py-3">会员到期</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        {getOwnerById(m.ownerId)?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${levelBadgeClass[m.level]}`}>
                          {m.level}
                        </span>
                      </td>
                      <td className="px-4 py-3">{m.points.toLocaleString()}</td>
                      <td className="px-4 py-3">¥{m.balance.toLocaleString()}</td>
                      <td className="px-4 py-3">¥{m.totalSpent.toLocaleString()}</td>
                      <td className="px-4 py-3">{(m.discount * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3">{m.expiryDate}</td>
                      <td className="px-4 py-3">
                        <button className="btn-primary text-xs px-3 py-1">查看详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">智能推荐</h2>
            <div className="space-y-6">
              {Object.entries(grouped).map(([type, items]) => {
                const config = typeConfig[type]
                const Icon = config.icon
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-slate-400">({items.length})</span>
                    </div>
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-sm">{item.text}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                会员：{item.memberName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs">
                              <label className="flex items-center gap-1">
                                <input type="checkbox" className="rounded" /> APP
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" className="rounded" /> 短信
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" className="rounded" /> 微信
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button className="btn-primary text-xs px-3 py-1">发送</button>
                              <button className="btn-secondary text-xs px-3 py-1">暂缓</button>
                              <button className="btn-danger text-xs px-3 py-1">忽略</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">会员等级分布</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={levelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {levelDistribution.map((entry) => (
                    <Cell key={entry.name} fill={levelColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {levelDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: levelColors[d.name] }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">消费趋势</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topSpenders}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '累计消费']}
                />
                <Bar dataKey="amount" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">会员权益说明</h2>
            <div className="space-y-3">
              {['钻石会员', '金卡会员', '银卡会员', '普通会员'].map((level) => (
                <div key={level} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <span className={`status-badge ${levelBadgeClass[level]}`}>{level}</span>
                  <div className="text-sm">
                    <span className="font-medium">{levelBenefits[level].discount}</span>
                    {levelBenefits[level].benefits && (
                      <span className="text-slate-500 ml-2">
                        + {levelBenefits[level].benefits}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
