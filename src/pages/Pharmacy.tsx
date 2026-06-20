import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Pill,
  AlertTriangle,
  Clock,
  XCircle,
  Search,
  CheckCircle2,
  PackagePlus,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

const categoryMap: Record<string, string> = {
  antibiotic: '抗生素',
  antifungal: '抗真菌',
  antiparasitic: '抗寄生虫',
  analgesic: '镇痛',
  antiemetic: '止吐',
  gastrointestinal: '胃肠',
  corticosteroid: '皮质激素',
  antihistamine: '抗组胺',
  sedative: '镇静',
  nutritional: '营养',
}

const categoryOptions = [
  { value: '', label: '全部' },
  { value: 'antibiotic', label: '抗生素' },
  { value: 'antifungal', label: '抗真菌' },
  { value: 'antiparasitic', label: '抗寄生虫' },
  { value: 'analgesic', label: '镇痛' },
  { value: 'antiemetic', label: '止吐' },
  { value: 'gastrointestinal', label: '胃肠' },
  { value: 'corticosteroid', label: '皮质激素' },
  { value: 'antihistamine', label: '抗组胺' },
  { value: 'sedative', label: '镇静' },
  { value: 'nutritional', label: '营养' },
]

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'normal', label: '正常' },
  { value: 'low_stock', label: '库存不足' },
  { value: 'near_expiry', label: '近效期' },
  { value: 'expired', label: '过期' },
]

const tabs = ['药品库存', '发药校验', '药品入库']

export default function Pharmacy() {
  const {
    drugs,
    medicalRecords,
    inboundRecords,
    dispenseRecords,
    inboundDrug: doInbound,
    checkPrescription,
    dispensePrescription,
    getPetById,
    getOwnerById,
    currentUser,
    addOperationLog,
  } = useAppStore()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [inboundDrug, setInboundDrug] = useState('')
  const [inboundQty, setInboundQty] = useState('')
  const [inboundBatch, setInboundBatch] = useState('')
  const [inboundProdDate, setInboundProdDate] = useState('')
  const [inboundExpDate, setInboundExpDate] = useState('')
  const [inboundSupplier, setInboundSupplier] = useState('')

  const [inboundResult, setInboundResult] = useState<{
    type: 'success' | 'error'
    msg: string
  } | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [dispenseResult, setDispenseResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ passed: boolean; warnings: string[]; errors: string[] } | null>(null)
  const [dispenseSubTab, setDispenseSubTab] = useState(0)
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set())

  const lowStockCount = drugs.filter((d) => d.status === 'low_stock').length
  const nearExpiryCount = drugs.filter((d) => d.status === 'near_expiry').length
  const expiredCount = drugs.filter((d) => d.status === 'expired').length

  const filteredDrugs = drugs.filter((d) => {
    if (search && !d.name.includes(search) && !d.batchNo.includes(search)) return false
    if (categoryFilter && d.category !== categoryFilter) return false
    if (statusFilter && d.status !== statusFilter) return false
    return true
  })

  const TODAY = new Date('2026-06-20')

  const getBatchStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const daysLeft = Math.ceil((expiry.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) {
      return { label: '已过期', bgClass: 'bg-red-100', textClass: 'text-red-700', barColor: 'bg-red-500' }
    } else if (daysLeft <= 30) {
      return { label: '近效期', bgClass: 'bg-amber-100', textClass: 'text-amber-700', barColor: 'bg-amber-500' }
    } else {
      return { label: '正常', bgClass: 'bg-green-100', textClass: 'text-green-700', barColor: 'bg-green-500' }
    }
  }

  const toggleBatchExpand = (drugId: string) => {
    const next = new Set(expandedBatches)
    if (next.has(drugId)) {
      next.delete(drugId)
    } else {
      next.add(drugId)
    }
    setExpandedBatches(next)
  }

  const isBatchExpanded = (drugId: string) => {
    return !expandedBatches.has(drugId)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <span className="status-badge bg-green-100 text-green-700">正常</span>
      case 'low_stock':
        return <span className="status-badge bg-red-100 text-red-700">库存不足</span>
      case 'near_expiry':
        return <span className="status-badge bg-yellow-100 text-yellow-700">近效期</span>
      case 'expired':
        return <span className="status-badge bg-red-100 text-red-700">已过期</span>
      default:
        return null
    }
  }

  const pendingRecords = medicalRecords.filter(
    (r) => r.prescriptions.length > 0 && !r.dispensed
  )

  const handleVerifyAndDispense = (recordId: string) => {
    setDispenseResult(null)
    setVerifyResult(null)
    setVerifyingId(recordId)
    const result = checkPrescription(recordId)
    setVerifyResult(result)
    if (!result.passed) {
      setTimeout(() => setVerifyingId(null), 300)
      return
    }
    if (confirm('校验通过，确认发药？')) {
      const dispResult = dispensePrescription(recordId)
      if (dispResult.success) {
        setDispenseResult({ type: 'success', msg: '发药成功！库存已扣减' })
      } else {
        setDispenseResult({ type: 'error', msg: `发药失败：${dispResult.reason}` })
      }
    }
    setTimeout(() => {
      setVerifyingId(null)
      setTimeout(() => setDispenseResult(null), 4000)
    }, 300)
  }

  const handleInbound = () => {
    setInboundResult(null)
    if (!inboundDrug) {
      setInboundResult({ type: 'error', msg: '请选择入库药品' })
      return
    }
    if (!inboundQty || inboundQty.trim() === '') {
      setInboundResult({ type: 'error', msg: '入库数量必须是正整数' })
      return
    }
    const qtyNum = Number(inboundQty)
    if (!Number.isFinite(qtyNum) || !Number.isInteger(qtyNum) || qtyNum <= 0) {
      setInboundResult({ type: 'error', msg: '入库数量必须是正整数' })
      return
    }
    if (!inboundExpDate || inboundExpDate.trim() === '') {
      setInboundResult({ type: 'error', msg: '请填写有效期' })
      return
    }
    const today = new Date('2026-06-20')
    if (new Date(inboundExpDate) <= today) {
      setInboundResult({ type: 'error', msg: '有效期已过期，不允许入库' })
      return
    }
    const drug = drugs.find((d) => d.id === inboundDrug)
    if (!drug) {
      setInboundResult({ type: 'error', msg: '药品不存在' })
      return
    }
    const result = doInbound(
      inboundDrug,
      qtyNum,
      inboundBatch.trim() || `AUTO-${Date.now()}`,
      inboundExpDate.trim() || undefined,
      inboundSupplier.trim() || undefined
    )
    if (!result.success) {
      setInboundResult({
        type: 'error',
        msg: `入库失败：${result.reason ?? '未知原因'}`,
      })
      return
    }
    addOperationLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: '入库',
      module: '药房管理',
      detail: `药品 ${drug.name} 入库 ${qtyNum} 单位，批号 ${
        (inboundBatch.trim() || result.data?.batchNo) ?? 'AUTO'
      }`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ip: '192.168.1.100',
    })
    setInboundResult({
      type: 'success',
      msg: `入库成功！${drug.name} × ${qtyNum}，当前库存 ${
        result.data?.stock ?? '已更新'
      }`,
    })
    setInboundQty('')
    setInboundBatch('')
    setInboundProdDate('')
    setInboundExpDate('')
    setInboundSupplier('')
    setTimeout(() => setInboundResult(null), 3500)
  }

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">药房管理</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="kpi-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <Pill className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{drugs.length}</div>
            <div className="text-sm text-slate-500">药品总数</div>
          </div>
        </div>
        <div className="kpi-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{lowStockCount}</div>
            <div className="text-sm text-slate-500">库存预警</div>
          </div>
        </div>
        <div className="kpi-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{nearExpiryCount}</div>
            <div className="text-sm text-slate-500">近效期预警</div>
          </div>
        </div>
        <div className="kpi-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{expiredCount}</div>
            <div className="text-sm text-slate-500">过期药品</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(i)
                setInboundResult(null)
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === i
                  ? 'text-primary-700 border-primary-700'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {tab}
              {i === 2 && inboundRecords.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs">
                  {inboundRecords.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 0 && (
          <div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索药品名称或批号..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select-field w-40"
              >
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field w-36"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDrugs.map((drug) => {
                const ratio = Math.min(drug.stock / drug.minStock, 2)
                const barColor =
                  drug.stock < drug.minStock ? 'bg-red-500' : 'bg-teal-500'
                const isExpanded = isBatchExpanded(drug.id)
                const sortedBatches = [...drug.batches].sort((a, b) => 
                  new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                )
                const totalStock = sortedBatches.reduce((sum, b) => sum + b.quantity, 0)

                return (
                  <div key={drug.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                          {drug.name}
                          {statusBadge(drug.status)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {categoryMap[drug.category]} · {drug.specification} · {drug.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">¥{drug.price.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">每{drug.unit}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <span className="text-slate-500">生产厂商：</span>
                        <span className="text-slate-700">{drug.manufacturer}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">储存条件：</span>
                        <span className="text-slate-700">{drug.storageCondition}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">当前库存：</span>
                        <span className={`font-medium ${drug.stock < drug.minStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {drug.stock} {drug.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">最低库存：</span>
                        <span className="text-slate-700">{drug.minStock} {drug.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${(ratio / 2) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {drug.stock < drug.minStock ? '库存不足' : '库存正常'}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <button
                        onClick={() => toggleBatchExpand(drug.id)}
                        className="w-full flex items-center justify-between text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
                      >
                        <span>批次明细</span>
                        <span className="text-xs text-slate-400">
                          {isExpanded ? '收起 ▲' : '展开 ▼'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {sortedBatches.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-2">暂无批次信息</p>
                          ) : (
                            <>
                              {sortedBatches.map((batch) => {
                                const batchStatus = getBatchStatus(batch.expiryDate)
                                const progress = totalStock > 0 ? (batch.quantity / totalStock) * 100 : 0
                                return (
                                  <div key={batch.id} className="text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-slate-600">{batch.batchNo}</span>
                                        <span className="text-slate-500 text-xs">
                                          {batch.productionDate} / {batch.expiryDate}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-medium">{batch.quantity} {drug.unit}</span>
                                        <span className={`status-badge ${batchStatus.bgClass} ${batchStatus.textClass}`}>
                                          {batchStatus.label}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${batchStatus.barColor} transition-all`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-sm">
                                <span className="text-slate-500">总库存</span>
                                <span className="font-semibold text-slate-800">{totalStock} {drug.unit}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div>
            {dispenseResult && (
              <div
                className={`mb-4 p-4 rounded-lg text-sm flex items-start gap-2 ${
                  dispenseResult.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {dispenseResult.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {dispenseResult.type === 'success' ? '发药成功' : '发药失败'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">{dispenseResult.msg}</p>
                </div>
              </div>
            )}

            <div className="flex gap-1 mb-6 border-b border-slate-200">
              {['待发药处方', '发药记录'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => {
                    setDispenseSubTab(i)
                    setVerifyResult(null)
                    setDispenseResult(null)
                  }}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    dispenseSubTab === i
                      ? 'text-primary-700 border-primary-700'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {i === 0 && pendingRecords.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs">
                      {pendingRecords.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {dispenseSubTab === 0 && (
              <div>
                {verifyResult && (
                  <div className="mb-4 space-y-2">
                    {verifyResult.errors.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-700 font-medium mb-2 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          校验错误
                        </div>
                        <ul className="text-sm text-red-600 space-y-1">
                          {verifyResult.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifyResult.warnings.length > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-yellow-700 font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          校验警告
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {verifyResult.warnings.map((warn, i) => (
                            <li key={i}>• {warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verifyResult.passed && verifyResult.errors.length === 0 && verifyResult.warnings.length === 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          校验全部通过
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {pendingRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    暂无待发药处方
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRecords.map((record) => {
                      const pet = getPetById(record.petId)
                      const owner = getOwnerById(record.ownerId)
                      return (
                        <div
                          key={record.id}
                          className={`card transition-all ${
                            verifyingId === record.id ? 'ring-2 ring-primary-500' : ''
                          }`}
                        >
                          <div className="flex justify-between gap-6">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-800">{record.id}</span>
                                <span className="status-badge bg-orange-100 text-orange-700">待发药</span>
                              </div>
                              <div className="text-sm text-slate-600 flex gap-4">
                                <span>宠物：{pet?.name || '-'}</span>
                                <span>主人：{owner?.name || '-'}</span>
                                <span>日期：{record.date}</span>
                              </div>
                              <div className="text-xs text-slate-400">
                                诊断：{record.diagnosis}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-slate-500 mb-2">处方药品</div>
                              <div className="text-sm text-slate-600 space-y-1">
                                {record.prescriptions.map((p, i) => (
                                  <div key={i} className="flex justify-between">
                                    <span>{p.drugName}</span>
                                    <span className="text-slate-500">× {p.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col justify-end gap-2">
                              <Link
                                to={`/diagnosis/medical/${record.id}`}
                                className="btn-secondary text-center text-xs"
                              >
                                <span className="flex items-center gap-1 justify-center">
                                  <FileText className="w-3 h-3" />
                                  查看病历
                                </span>
                              </Link>
                              <button
                                onClick={() => handleVerifyAndDispense(record.id)}
                                disabled={verifyingId === record.id}
                                className="btn-primary text-xs"
                              >
                                {verifyingId === record.id ? '处理中...' : '校验并发药'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {dispenseSubTab === 1 && (
              <div>
                {dispenseRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    暂无发药记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...dispenseRecords]
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )
                      .map((record) => (
                        <div key={record.id} className="card">
                          <div className="flex justify-between gap-6">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-800">{record.recordId}</span>
                                <span className="status-badge bg-green-100 text-green-700">已发药</span>
                              </div>
                              <div className="text-sm text-slate-600 flex gap-4">
                                <span>发药时间：{record.timestamp}</span>
                                <span>宠物：{record.petName}</span>
                                <span>主人：{record.ownerName}</span>
                                <span>操作人：{record.operator}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-slate-500 mb-2">发药明细</div>
                              <div className="text-sm text-slate-600 space-y-1">
                                {record.items.map((item, i) => (
                                  <div key={i} className="flex justify-between">
                                    <span>{item.drugName}</span>
                                    <span className="text-slate-500">
                                      × {item.quantity}（批号{item.batchNo}）
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div>
            {inboundResult && (
              <div
                className={`mb-4 p-4 rounded-lg text-sm flex items-start gap-2 ${
                  inboundResult.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {inboundResult.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {inboundResult.type === 'success' ? '入库成功' : '入库失败'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">{inboundResult.msg}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  药品名称 <span className="text-red-500">*</span>
                </label>
                <select
                  value={inboundDrug}
                  onChange={(e) => setInboundDrug(e.target.value)}
                  className="select-field"
                >
                  <option value="">请选择药品</option>
                  {drugs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specification})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  入库数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={inboundQty}
                  onChange={(e) => setInboundQty(e.target.value)}
                  className="input-field"
                  placeholder="请输入正数数量"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  数量必须大于 0，否则将拒绝入库
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  批号
                </label>
                <input
                  type="text"
                  value={inboundBatch}
                  onChange={(e) => setInboundBatch(e.target.value)}
                  className="input-field"
                  placeholder="自动生成或输入"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  生产日期
                </label>
                <input
                  type="date"
                  value={inboundProdDate}
                  onChange={(e) => setInboundProdDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  有效期至
                </label>
                <input
                  type="date"
                  value={inboundExpDate}
                  onChange={(e) => setInboundExpDate(e.target.value)}
                  className="input-field"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  若已过期将拒绝入库（今日 2026-06-20）
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  供应商
                </label>
                <input
                  type="text"
                  value={inboundSupplier}
                  onChange={(e) => setInboundSupplier(e.target.value)}
                  className="input-field"
                  placeholder="请输入供应商名称"
                />
              </div>
            </div>

            {inboundDrug && (() => {
              const d = drugs.find((x) => x.id === inboundDrug)
              if (!d) return null
              return (
                <div className="mb-5 p-3 rounded-lg bg-primary-50 border border-primary-100 text-sm space-y-1">
                  <div className="flex gap-6">
                    <p>
                      <span className="text-slate-500">当前库存：</span>
                      <span className="font-semibold text-primary-700">
                        {d.stock}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">最低库存：</span>
                      <span className="font-medium">{d.minStock}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">原批号：</span>
                      <span className="font-mono text-xs">{d.batchNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">原有效期：</span>
                      <span>{d.expiryDate}</span>
                    </p>
                  </div>
                </div>
              )
            })()}

            <button
              onClick={handleInbound}
              className="btn-primary mb-8 flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              确认入库
            </button>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  近期入库记录（实时）
                </h3>
                <span className="text-xs text-slate-400">
                  共 {inboundRecords.length} 条
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-3 py-3">入库日期</th>
                      <th className="px-3 py-3">药品名称</th>
                      <th className="px-3 py-3">入库数量</th>
                      <th className="px-3 py-3">批号</th>
                      <th className="px-3 py-3">供应商</th>
                      <th className="px-3 py-3">操作人</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {[...inboundRecords]
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime()
                      )
                      .map((r, i) => {
                        const [datePart, timePart] = r.timestamp.split(' ')
                        return (
                          <tr key={i} className="hover:bg-slate-50 bg-white">
                            <td className="px-3 py-3 text-slate-600">
                              {datePart} {timePart}
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-800">
                              {r.drugName}
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                                +{r.quantity}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-600 font-mono text-xs">
                              {r.batchNo}
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              {r.supplier || '-'}
                            </td>
                            <td className="px-3 py-3 text-slate-500 text-xs">
                              {r.operator || '系统'}
                            </td>
                          </tr>
                        )
                      })}
                    {inboundRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-slate-400"
                        >
                          暂无入库记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
