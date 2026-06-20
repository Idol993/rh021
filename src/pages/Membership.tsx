import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  MessageCircle,
  MessageSquare,
  ExternalLink,
  Sparkles,
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
import type { Recommendation } from '@/types'

const typeConfig: Record<Recommendation['type'], { icon: typeof Syringe; label: string; color: string; badgeClass: string }> = {
  vaccine: { icon: Syringe, label: '疫苗提醒', color: 'text-blue-500', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  deworming: { icon: Bug, label: '驱虫提醒', color: 'text-purple-500', badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
  rehab: { icon: Heart, label: '康复关怀', color: 'text-pink-500', badgeClass: 'bg-pink-100 text-pink-700 border-pink-200' },
  package: { icon: Package, label: '套餐推荐', color: 'text-orange-500', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
  insurance: { icon: Shield, label: '保险推荐', color: 'text-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  supplement: { icon: Apple, label: '营养补充', color: 'text-red-500', badgeClass: 'bg-red-100 text-red-700 border-red-200' },
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
  const navigate = useNavigate()
  const {
    members,
    getOwnerById,
    sendRecommendation,
    dismissRecommendation,
    currentUser,
    addOperationLog,
  } = useAppStore()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('全部')

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [currentMemberId, setCurrentMemberId] = useState('')
  const [currentRec, setCurrentRec] = useState<Recommendation | null>(null)
  const [channels, setChannels] = useState<{ app: boolean; sms: boolean; wechat: boolean }>({
    app: false,
    sms: false,
    wechat: false,
  })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

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

  // 只取未发送/未处理的推荐（status=pending 或部分渠道未发送的sent）
  const pendingRecommendations = useMemo(() => {
    return members.flatMap((m) =>
      m.recommendations
        .filter((r) => r.status === 'pending')
        .map((rec) => ({
          memberId: m.id,
          memberName: getOwnerById(m.ownerId)?.name ?? '',
          level: m.level,
          recommendation: rec,
        }))
    )
  }, [members, getOwnerById])

  const grouped = pendingRecommendations.reduce<
    Record<string, typeof pendingRecommendations>
  >((acc, item) => {
    ;(acc[item.recommendation.type] ??= []).push(item)
    return acc
  }, {})

  const stats = [
    { label: '会员总数', value: members.length, icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: '钻石会员', value: diamondCount, icon: Crown, color: 'text-amber-600 bg-amber-50' },
    { label: '金卡会员', value: goldCount, icon: Award, color: 'text-yellow-600 bg-yellow-50' },
    { label: '本月新增', value: newThisMonth, icon: UserPlus, color: 'text-green-600 bg-green-50' },
  ]

  const statusBadge = (s: Recommendation['status']) => {
    switch (s) {
      case 'pending':
        return (
          <span className="status-badge bg-amber-100 text-amber-700 inline-flex items-center gap-1 text-[10px]">
            <Clock className="w-3 h-3" />
            待发送
          </span>
        )
      case 'sent':
        return (
          <span className="status-badge bg-blue-100 text-blue-700 inline-flex items-center gap-1 text-[10px]">
            <Send className="w-3 h-3" />
            已发送
          </span>
        )
      case 'converted':
        return (
          <span className="status-badge bg-green-100 text-green-700 inline-flex items-center gap-1 text-[10px]">
            <CheckCircle2 className="w-3 h-3" />
            已转化
          </span>
        )
      default:
        return null
    }
  }

  const openSendModal = (
    memberId: string,
    rec: Recommendation
  ) => {
    setCurrentMemberId(memberId)
    setCurrentRec(rec)
    const sent = rec.sentChannels ?? []
    setChannels({
      app: sent.includes('app'),
      sms: sent.includes('sms'),
      wechat: sent.includes('wechat'),
    })
    setSendModalOpen(true)
  }

  const closeSendModal = () => {
    setSendModalOpen(false)
    setCurrentMemberId('')
    setCurrentRec(null)
  }

  const confirmSend = () => {
    if (!currentRec) return
    const toSend: ('app' | 'sms' | 'wechat')[] = []
    if (channels.app) toSend.push('app')
    if (channels.sms) toSend.push('sms')
    if (channels.wechat) toSend.push('wechat')
    if (toSend.length === 0) {
      setToast({ type: 'error', msg: '请至少选择一个发送渠道' })
      setTimeout(() => setToast(null), 2500)
      return
    }
    try {
      sendRecommendation(currentMemberId, currentRec.id, toSend)
      addOperationLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: '发送',
        module: '智能推荐',
        detail: `发送推荐[${currentRec.title}]，渠道：${toSend.join('/')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: '192.168.1.100',
      })
      const chLabel = { app: 'APP', sms: '短信', wechat: '微信' }
      setToast({
        type: 'success',
        msg: `推荐已通过 ${toSend.map((c) => chLabel[c]).join(' / ')} 发送`,
      })
      setTimeout(() => setToast(null), 2500)
      closeSendModal()
    } catch (e: any) {
      setToast({ type: 'error', msg: '发送失败：' + (e?.message ?? '未知') })
      setTimeout(() => setToast(null), 2500)
    }
  }

  const handleDismiss = (memberId: string, rec: Recommendation) => {
    dismissRecommendation(memberId, rec.id)
    setToast({ type: 'success', msg: '已忽略此推荐' })
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">会员运营</h1>

      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

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
                      <td className="px-4 py-3">
                        ¥{m.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {(m.discount * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3">{m.expiryDate}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/membership/${m.id}`)}
                          className="btn-primary text-xs px-3 py-1 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-500" />
                智能推荐待发送
              </h2>
              <div className="text-xs text-slate-500">
                共 {pendingRecommendations.length} 条待处理
              </div>
            </div>
            {pendingRecommendations.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                🎉 所有推荐都已处理完毕
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([type, items]) => {
                  const config = typeConfig[type as Recommendation['type']]
                  const Icon = config.icon
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <span className="font-medium">{config.label}</span>
                        <span className="text-xs text-slate-400">
                          ({items.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {items.map((item, idx) => {
                          const rec = item.recommendation
                          return (
                            <div
                              key={idx}
                              className={`border rounded-lg p-4 ${config.badgeClass} border-opacity-50 bg-white`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span
                                      className={`status-badge text-[10px] ${config.badgeClass}`}
                                    >
                                      {config.label}
                                    </span>
                                    {statusBadge(rec.status)}
                                    {rec.petName && (
                                      <span className="text-xs text-slate-500">
                                        宠物：{rec.petName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-medium text-sm text-slate-800">
                                    {rec.title}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-0.5">
                                    {rec.description}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                    会员：{item.memberName} ·{' '}
                                    <span className="font-medium">
                                      {item.level}
                                    </span>{' '}
                                    · 原因：{rec.reason}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => openSendModal(item.memberId, rec)}
                                    className="btn-primary text-xs px-3 py-1 inline-flex items-center gap-1"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    发送
                                  </button>
                                  <button
                                    onClick={() => handleDismiss(item.memberId, rec)}
                                    className="btn-secondary text-xs px-3 py-1"
                                  >
                                    忽略
                                  </button>
                                  <button
                                    onClick={() => navigate(`/membership/${item.memberId}`)}
                                    className="text-xs px-2 py-1 text-slate-500 hover:text-primary-600"
                                  >
                                    会员 →
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
                  formatter={(value: number) => [
                    `¥${value.toLocaleString()}`,
                    '累计消费',
                  ]}
                />
                <Bar dataKey="amount" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">会员权益说明</h2>
            <div className="space-y-3">
              {['钻石会员', '金卡会员', '银卡会员', '普通会员'].map(
                (level) => (
                  <div
                    key={level}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                  >
                    <span className={`status-badge ${levelBadgeClass[level]}`}>
                      {level}
                    </span>
                    <div className="text-sm">
                      <span className="font-medium">
                        {levelBenefits[level].discount}
                      </span>
                      {levelBenefits[level].benefits && (
                        <span className="text-slate-500 ml-2">
                          + {levelBenefits[level].benefits}
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {sendModalOpen && currentRec && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-cyan-50">
              <h3 className="font-bold text-slate-800 text-lg">发送推荐</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {currentRec.title}
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-4">选择推送渠道（可多选）：</p>
              <div className="space-y-3">
                {(
                  [
                    [
                      'app',
                      'APP消息推送',
                      Smartphone,
                      'APP 内通知会自动加入会员消息中心',
                    ],
                    [
                      'sms',
                      '短信通知',
                      MessageCircle,
                      '短信将发送至会员绑定手机号',
                    ],
                    [
                      'wechat',
                      '微信服务通知',
                      MessageSquare,
                      '通过微信公众号服务通知推送',
                    ],
                  ] as [
                    'app' | 'sms' | 'wechat',
                    string,
                    typeof Smartphone,
                    string
                  ][]
                ).map(([k, label, Ico, desc]) => {
                  const alreadySent = (currentRec.sentChannels ?? []).includes(k)
                  const checked = channels[k]
                  return (
                    <label
                      key={k}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-primary-50 border-primary-300'
                          : 'bg-white border-slate-200 hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary-600"
                        checked={checked}
                        onChange={(e) =>
                          setChannels({ ...channels, [k]: e.target.checked })
                        }
                      />
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Ico className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-sm font-medium ${
                              checked ? 'text-primary-800' : 'text-slate-700'
                            }`}
                          >
                            {label}
                          </p>
                          {alreadySent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              已发送
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={closeSendModal} className="btn-secondary">
                取消
              </button>
              <button
                onClick={confirmSend}
                className="btn-primary flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                确认发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

