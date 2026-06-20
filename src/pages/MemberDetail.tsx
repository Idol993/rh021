import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  Crown,
  TrendingUp,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Tag,
  Zap,
  Bell,
  Smartphone,
  MessageCircle,
  MessageSquare,
  PawPrint,
  ExternalLink,
  History,
  Target,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { Recommendation } from '@/types'

const REC_TYPE_META: Record<
  Recommendation['type'],
  { label: string; icon: typeof Zap; color: string }
> = {
  vaccine: { label: '疫苗接种', icon: Zap, color: 'bg-green-100 text-green-700 border-green-200' },
  deworming: { label: '驱虫提醒', icon: Sparkles, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  rehab: { label: '康复训练', icon: TrendingUp, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  package: { label: '专属套餐', icon: Tag, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  insurance: { label: '宠物医保', icon: CreditCard, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  supplement: { label: '保健品', icon: Crown, color: 'bg-pink-100 text-pink-700 border-pink-200' },
}

type TabKey = 'pending' | 'sent' | 'converted' | 'dismissed'

export default function MemberDetail() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const {
    members,
    pets,
    owners,
    getPetsByOwner,
    sendRecommendation,
    convertRecommendation,
    dismissRecommendation,
    currentUser,
    addOperationLog,
  } = useAppStore()

  const member = members.find((m) => m.id === memberId)
  const owner = member ? owners.find((o) => o.id === member.ownerId) : undefined
  const memberPets = member ? getPetsByOwner(member.ownerId) : []
  const recommendations: Recommendation[] = member?.recommendations ?? []

  const [tab, setTab] = useState<TabKey>('pending')
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [currentRec, setCurrentRec] = useState<Recommendation | null>(null)
  const [channels, setChannels] = useState<{ app: boolean; sms: boolean; wechat: boolean }>({
    app: false,
    sms: false,
    wechat: false,
  })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const groupedByStatus = useMemo(() => {
    return {
      pending: recommendations.filter((r) => r.status === 'pending'),
      sent: recommendations.filter((r) => r.status === 'sent'),
      converted: recommendations.filter((r) => r.status === 'converted'),
      dismissed: recommendations.filter((r) => r.status === 'dismissed'),
    }
  }, [recommendations])

  const currentList = groupedByStatus[tab]

  if (!member || !owner) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <XCircle className="w-12 h-12 text-slate-400 mb-4" />
        <p className="text-lg text-slate-600">未找到该会员</p>
        <Link to="/membership" className="btn-primary mt-4">
          返回会员运营
        </Link>
      </div>
    )
  }

  const openSendModal = (rec: Recommendation) => {
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
      sendRecommendation(member.id, currentRec.id, toSend)
      addOperationLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: '发送',
        module: '智能推荐',
        detail: `向会员 ${member.memberNo} 发送推荐[${currentRec.title}]，渠道：${toSend.join('/')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: '192.168.1.100',
      })
      setToast({ type: 'success', msg: `推荐已通过 ${toSend.map((c) => ({ app: 'APP', sms: '短信', wechat: '微信' })[c]).join(' / ')} 发送` })
      setTimeout(() => setToast(null), 2500)
      closeSendModal()
    } catch (e: any) {
      setToast({ type: 'error', msg: '发送失败：' + (e?.message ?? '未知') })
      setTimeout(() => setToast(null), 2500)
    }
  }

  const handleConvert = (rec: Recommendation) => {
    convertRecommendation(member.id, rec.id)
    addOperationLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: '转化',
      module: '智能推荐',
      detail: `推荐[${rec.title}]已转化`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ip: '192.168.1.100',
    })
    setToast({ type: 'success', msg: '已标记为转化' })
    setTimeout(() => setToast(null), 2000)
  }

  const handleDismiss = (rec: Recommendation) => {
    dismissRecommendation(member.id, rec.id)
    setToast({ type: 'success', msg: '已忽略此推荐' })
    setTimeout(() => setToast(null), 2000)
  }

  const statusBadge = (s: Recommendation['status']) => {
    switch (s) {
      case 'pending':
        return <span className="status-badge bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" />待发送</span>
      case 'sent':
        return <span className="status-badge bg-blue-100 text-blue-700 flex items-center gap-1"><Send className="w-3 h-3" />已发送</span>
      case 'converted':
        return <span className="status-badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />已转化</span>
      case 'dismissed':
        return <span className="status-badge bg-slate-100 text-slate-600 flex items-center gap-1"><XCircle className="w-3 h-3" />已忽略</span>
    }
  }

  return (
    <div className="page-container max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Crown className="w-7 h-7 text-accent-500" />
          会员详情
        </h1>
      </div>

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

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card col-span-1">
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {owner.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{owner.name}</h2>
                {member.tier === 'gold' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">⭐ 金卡</span>
                ) : member.tier === 'platinum' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-yellow-300 font-medium">💎 钻石</span>
                ) : member.tier === 'silver' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">🥈 银卡</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">🆕 新会员</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">会员编号 {member.memberNo}</p>
              <p className="text-xs text-slate-500 mt-0.5">注册 {member.joinDate}</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              {owner.phone}
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{owner.address || '未填写地址'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400" />
              余额 <span className="font-semibold text-slate-800">¥{member.balance.toFixed(2)}</span>
              <span className="mx-1 text-slate-300">|</span>
              积分 <span className="font-semibold text-slate-800">{member.points}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              累计消费 <span className="font-semibold text-primary-700">¥{member.totalSpent.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <PawPrint className="w-4 h-4 text-primary-500" />
              关联宠物 ({memberPets.length})
            </h3>
            <div className="space-y-2">
              {memberPets.map((p) => (
                <Link
                  key={p.id}
                  to={`/archives/${p.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-primary-50 border border-slate-100 hover:border-primary-200 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.species === 'dog' ? '🐕' : '🐱'}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.breed}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-500" />
                </Link>
              ))}
              {memberPets.length === 0 && (
                <p className="text-xs text-slate-400 py-2 text-center">暂无绑定宠物</p>
              )}
            </div>
          </div>
        </div>

        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-500" />
              智能推荐中心
            </h2>
            <div className="text-xs text-slate-500">
              共 {recommendations.length} 条 · 待发送 {groupedByStatus.pending.length} · 转化率{' '}
              <span className="font-semibold text-primary-700">
                {recommendations.length > 0
                  ? Math.round((groupedByStatus.converted.length / recommendations.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-4 border-b border-slate-100 -mt-1">
            {(
              [
                ['pending', '待发送', groupedByStatus.pending.length],
                ['sent', '已发送', groupedByStatus.sent.length],
                ['converted', '已转化', groupedByStatus.converted.length],
                ['dismissed', '已忽略', groupedByStatus.dismissed.length],
              ] as [TabKey, string, number][]
            ).map(([k, label, cnt]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                  tab === k
                    ? 'text-primary-700 border-primary-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tab === k ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cnt}
                </span>
              </button>
            ))}
          </div>

          {currentList.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">暂无{['待发送', '已发送', '已转化', '已忽略'][['pending', 'sent', 'converted', 'dismissed'].indexOf(tab)]}推荐</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((r) => {
                const meta = REC_TYPE_META[r.type]
                const Icon = meta.icon
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border ${meta.color} bg-opacity-50`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/60 border border-current text-xs">
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </div>
                          {statusBadge(r.status)}
                          {r.petName && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <PawPrint className="w-3 h-3" />
                              {r.petName}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">{r.title}</h3>
                        <p className="text-sm text-slate-600 mb-2">{r.description}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          推荐原因：{r.reason}
                        </p>
                        {(r.status === 'sent' || r.status === 'converted') && (
                          <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
                            <span className="text-slate-500">已发送渠道：</span>
                            {(r.sentChannels ?? []).map((c) => {
                              const ch = {
                                app: { label: 'APP', icon: Smartphone, color: 'bg-blue-50 text-blue-600' },
                                sms: { label: '短信', icon: MessageCircle, color: 'bg-green-50 text-green-600' },
                                wechat: { label: '微信', icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600' },
                              }[c]
                              const CI = ch.icon
                              return (
                                <span key={c} className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${ch.color}`}>
                                  <CI className="w-3 h-3" />
                                  {ch.label}
                                </span>
                              )
                            })}
                            {r.sentAt && (
                              <span className="text-slate-400 ml-2 flex items-center gap-1">
                                <History className="w-3 h-3" />
                                {r.sentAt}
                              </span>
                            )}
                            {r.status === 'converted' && r.convertedAt && (
                              <span className="text-green-600 ml-2">✓ 转化于 {r.convertedAt}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openSendModal(r)}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              发送
                            </button>
                            <button
                              onClick={() => handleDismiss(r)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              忽略
                            </button>
                          </>
                        )}
                        {r.status === 'sent' && (
                          <>
                            <button
                              onClick={() => openSendModal(r)}
                              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              补充发送
                            </button>
                            <button
                              onClick={() => handleConvert(r)}
                              className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              标记转化
                            </button>
                          </>
                        )}
                        {(r.status === 'converted' || r.status === 'dismissed') && (
                          <span className="text-xs text-slate-400">
                            创建于 {r.createdAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {sendModalOpen && currentRec && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-cyan-50">
              <h3 className="font-bold text-slate-800 text-lg">发送推荐</h3>
              <p className="text-sm text-slate-500 mt-0.5">{currentRec.title}</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-4">选择推送渠道（可多选）：</p>
              <div className="space-y-3">
                {(
                  [
                    ['app', 'APP消息推送', Smartphone, 'APP 内通知会自动加入会员消息中心'],
                    ['sms', '短信通知', MessageCircle, '短信将发送至会员绑定手机号'],
                    ['wechat', '微信服务通知', MessageSquare, '通过微信公众号服务通知推送'],
                  ] as ['app' | 'sms' | 'wechat', string, typeof Smartphone, string][]
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
                      } ${alreadySent ? 'opacity-80' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary-600"
                        checked={checked}
                        onChange={(e) => setChannels({ ...channels, [k]: e.target.checked })}
                      />
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        checked ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Ico className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-medium ${checked ? 'text-primary-800' : 'text-slate-700'}`}>
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
              <button onClick={confirmSend} className="btn-primary flex items-center gap-1.5">
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
