import { useState } from 'react'
import { Pill, AlertTriangle, Clock, XCircle, Search } from 'lucide-react'
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

const inboundRecords = [
  { date: '2026-06-20', drug: '阿莫西林克拉维酸', quantity: 200, batchNo: 'AMC-2026-021', supplier: '北京拜耳动物保健' },
  { date: '2026-06-18', drug: '马罗匹坦', quantity: 50, batchNo: 'MRP-2026-022', supplier: '硕腾(上海)动物保健' },
  { date: '2026-06-15', drug: '奥美拉唑', quantity: 100, batchNo: 'OMP-2026-023', supplier: '阿斯利康动物保健' },
]

export default function Pharmacy() {
  const { drugs, medicalRecords } = useAppStore()
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

  const lowStockCount = drugs.filter(d => d.status === 'low_stock').length
  const nearExpiryCount = drugs.filter(d => d.status === 'near_expiry').length
  const expiredCount = drugs.filter(d => d.status === 'expired').length

  const filteredDrugs = drugs.filter(d => {
    if (search && !d.name.includes(search) && !d.batchNo.includes(search)) return false
    if (categoryFilter && d.category !== categoryFilter) return false
    if (statusFilter && d.status !== statusFilter) return false
    return true
  })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <span className="status-badge bg-green-100 text-green-700">正常</span>
      case 'low_stock': return <span className="status-badge bg-red-100 text-red-700">库存不足</span>
      case 'near_expiry': return <span className="status-badge bg-yellow-100 text-yellow-700">近效期</span>
      case 'expired': return <span className="status-badge bg-red-100 text-red-700">已过期</span>
      default: return null
    }
  }

  const sampleRecord = medicalRecords[0]
  const prescriptions = sampleRecord?.prescriptions ?? []

  const verificationResults = prescriptions.map((p, i) => ({
    name: p.drugName,
    checks: [
      { label: '适应症匹配', passed: i !== 1 },
      { label: '剂量校验', passed: i !== 0, warning: i === 0 ? '剂量偏高，建议确认' : undefined },
      { label: '配伍禁忌', passed: true },
      { label: '过敏冲突', passed: i !== 2, warning: i === 2 ? '存在过敏风险' : undefined },
      { label: '效期库存', passed: i !== 2 },
    ],
  }))

  const hasAnyFailure = verificationResults.some(v => v.checks.some(c => !c.passed))

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
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === i
                  ? 'text-primary-700 border-primary-700'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {tab}
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
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="select-field w-40"
              >
                {categoryOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="select-field w-36"
              >
                {statusOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-3">药品名称</th>
                    <th className="px-3 py-3">分类</th>
                    <th className="px-3 py-3">规格</th>
                    <th className="px-3 py-3">单价</th>
                    <th className="px-3 py-3">库存</th>
                    <th className="px-3 py-3">最低库存</th>
                    <th className="px-3 py-3">批号</th>
                    <th className="px-3 py-3">有效期</th>
                    <th className="px-3 py-3">储存条件</th>
                    <th className="px-3 py-3">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrugs.map(drug => {
                    const ratio = Math.min(drug.stock / drug.minStock, 2)
                    const barColor = drug.stock < drug.minStock ? 'bg-red-500' : 'bg-teal-500'
                    return (
                      <tr key={drug.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-800">{drug.name}</td>
                        <td className="px-3 py-3 text-slate-600">{categoryMap[drug.category]}</td>
                        <td className="px-3 py-3 text-slate-600">{drug.specification}</td>
                        <td className="px-3 py-3 text-slate-600">¥{drug.price.toFixed(1)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${(ratio / 2) * 100}%` }}
                              />
                            </div>
                            <span className={drug.stock < drug.minStock ? 'text-red-600 font-medium' : 'text-slate-600'}>
                              {drug.stock}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{drug.minStock}</td>
                        <td className="px-3 py-3 text-slate-600 font-mono text-xs">{drug.batchNo}</td>
                        <td className="px-3 py-3 text-slate-600">{drug.expiryDate}</td>
                        <td className="px-3 py-3 text-slate-600">{drug.storageCondition}</td>
                        <td className="px-3 py-3">{statusBadge(drug.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div>
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium text-slate-700 mb-2">处方信息</div>
              <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                <div>病历号: {sampleRecord?.id}</div>
                <div>诊断: {sampleRecord?.diagnosis}</div>
                <div>日期: {sampleRecord?.date}</div>
              </div>
              <div className="mt-3 flex gap-6">
                {prescriptions.map(p => (
                  <div key={p.drugId} className="text-sm">
                    <span className="font-medium text-slate-700">{p.drugName}</span>
                    <span className="text-slate-500 ml-2">{p.dosage} {p.frequency} × {p.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {verificationResults.map(result => (
                <div key={result.name} className="border border-slate-200 rounded-lg p-4">
                  <div className="font-medium text-slate-800 mb-3">{result.name}</div>
                  <div className="space-y-2">
                    {result.checks.map(check => (
                      <div key={check.label} className="flex items-center gap-2 text-sm">
                        {check.passed ? (
                          <span className="text-green-600 font-medium">✓ 通过</span>
                        ) : (
                          <span className="text-red-600 font-medium">✗ {check.warning || '不匹配'}</span>
                        )}
                        <span className="text-slate-500">{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {hasAnyFailure && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-700 font-medium">⚠ 发药拦截 - 存在异常项需医生确认</div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button className="btn-primary">医生授权确认</button>
              <button className="btn-secondary">取消发药</button>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">药品名称</label>
                <select
                  value={inboundDrug}
                  onChange={e => setInboundDrug(e.target.value)}
                  className="select-field"
                >
                  <option value="">请选择药品</option>
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">入库数量</label>
                <input
                  type="number"
                  value={inboundQty}
                  onChange={e => setInboundQty(e.target.value)}
                  className="input-field"
                  placeholder="请输入数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">批号</label>
                <input
                  type="text"
                  value={inboundBatch}
                  onChange={e => setInboundBatch(e.target.value)}
                  className="input-field"
                  placeholder="请输入批号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">生产日期</label>
                <input
                  type="date"
                  value={inboundProdDate}
                  onChange={e => setInboundProdDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">有效期</label>
                <input
                  type="date"
                  value={inboundExpDate}
                  onChange={e => setInboundExpDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">供应商</label>
                <input
                  type="text"
                  value={inboundSupplier}
                  onChange={e => setInboundSupplier(e.target.value)}
                  className="input-field"
                  placeholder="请输入供应商"
                />
              </div>
            </div>
            <button className="btn-primary mb-8">确认入库</button>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">近期入库记录</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-3">入库日期</th>
                    <th className="px-3 py-3">药品名称</th>
                    <th className="px-3 py-3">入库数量</th>
                    <th className="px-3 py-3">批号</th>
                    <th className="px-3 py-3">供应商</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inboundRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-slate-600">{r.date}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">{r.drug}</td>
                      <td className="px-3 py-3 text-slate-600">{r.quantity}</td>
                      <td className="px-3 py-3 text-slate-600 font-mono text-xs">{r.batchNo}</td>
                      <td className="px-3 py-3 text-slate-600">{r.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
