import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Shield, Stethoscope, Heart, User, Pill } from 'lucide-react'

const tabs = ['权限管理', '医保规则', '系统参数', '操作日志'] as const
type TabKey = (typeof tabs)[number]

const modules = ['宠物档案', '诊疗管理', '药房管理', '住院管理', '会员管理', '财务报表', '系统参数']
const permCols = ['查看', '编辑', '删除'] as const

const roleDefs = [
  { key: 'admin', name: '管理员', icon: Shield, count: 1 },
  { key: 'doctor', name: '医生', icon: Stethoscope, count: 1 },
  { key: 'nurse', name: '护士', icon: Heart, count: 1 },
  { key: 'receptionist', name: '前台', icon: User, count: 1 },
  { key: 'pharmacist', name: '药师', icon: Pill, count: 1 },
] as const

const defaultPermissions: Record<string, boolean[][]> = {
  admin: modules.map(() => [true, true, true]),
  doctor: modules.map((_, i) =>
    i <= 1 ? [true, true, false] : [true, false, false]
  ),
  nurse: modules.map((_, i) =>
    i <= 2 ? [true, i <= 1, false] : [true, false, false]
  ),
  receptionist: modules.map((_, i) =>
    i === 0 || i === 4 ? [true, true, false] : [true, false, false]
  ),
  pharmacist: modules.map((_, i) =>
    i === 2 ? [true, true, true] : i === 0 ? [true, false, false] : [true, false, false]
  ),
}

const insuranceItems = [
  { name: '血常规检查', type: '检查', rate: '70%', limit: '¥200', active: true },
  { name: 'X光检查', type: '检查', rate: '60%', limit: '¥500', active: true },
  { name: '犬瘟热疫苗', type: '疫苗', rate: '80%', limit: '¥150', active: true },
  { name: '绝育手术', type: '手术', rate: '50%', limit: '¥2000', active: false },
]

const commercialInsurances = [
  { name: '宠物医疗险', coverage: '疾病+意外', premium: '¥580/年', deductible: '¥200' },
  { name: '宠物意外险', coverage: '意外伤害', premium: '¥280/年', deductible: '¥100' },
  { name: '宠物综合险', coverage: '全险种覆盖', premium: '¥980/年', deductible: '¥300' },
]

const actionTypes = ['创建', '修改', '删除', '预约', '入库', '预警', '导出', '登记', '开具处方', '会员充值', '体温记录']

export default function Settings() {
  const { users, operationLogs } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('权限管理')
  const [permissions, setPermissions] = useState(defaultPermissions)
  const [insuranceActive, setInsuranceActive] = useState(insuranceItems.map((i) => i.active))
  const [goldThreshold, setGoldThreshold] = useState('10000')
  const [diamondThreshold, setDiamondThreshold] = useState('30000')
  const [nearExpiryDays, setNearExpiryDays] = useState('30')
  const [stockLowerRatio, setStockLowerRatio] = useState('20')
  const [collectInterval, setCollectInterval] = useState('30')
  const [alertTimeout, setAlertTimeout] = useState('5')
  const [vaccineRemindDays, setVaccineRemindDays] = useState('7')
  const [dewormRemindDays, setDewormRemindDays] = useState('7')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const togglePerm = (role: string, row: number, col: number) => {
    setPermissions((prev) => {
      const next = { ...prev, [role]: prev[role].map((r) => [...r]) }
      next[role][row][col] = !next[role][row][col]
      return next
    })
  }

  const filteredLogs = operationLogs.filter((log) => {
    if (filterStart && log.timestamp < filterStart) return false
    if (filterEnd && log.timestamp > filterEnd + ' 23:59:59') return false
    if (filterUser && log.userId !== filterUser) return false
    if (filterAction && log.action !== filterAction) return false
    return true
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">系统设置</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === '权限管理' && (
            <div className="grid grid-cols-2 gap-4">
              {roleDefs.map(({ key, name, icon: Icon, count }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-teal-600" />
                    <span className="font-medium text-gray-900">{name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{count} 人</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 text-gray-500 font-medium">模块</th>
                        {permCols.map((col) => (
                          <th key={col} className="text-center py-1.5 text-gray-500 font-medium w-16">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((mod, rowIdx) => (
                        <tr key={mod} className="border-b border-gray-50">
                          <td className="py-1.5 text-gray-700">{mod}</td>
                          {permCols.map((_, colIdx) => (
                            <td key={colIdx} className="text-center py-1.5">
                              <input
                                type="checkbox"
                                checked={permissions[key][rowIdx][colIdx]}
                                onChange={() => togglePerm(key, rowIdx, colIdx)}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex justify-end">
                    <button className="px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors">
                      保存权限
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === '医保规则' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">医保目录管理</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">项目名称</th>
                      <th className="text-left py-2 text-gray-500 font-medium">项目类型</th>
                      <th className="text-left py-2 text-gray-500 font-medium">报销比例</th>
                      <th className="text-left py-2 text-gray-500 font-medium">限额</th>
                      <th className="text-left py-2 text-gray-500 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceItems.map((item, idx) => (
                      <tr key={item.name} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">{item.name}</td>
                        <td className="py-2 text-gray-700">{item.type}</td>
                        <td className="py-2 text-gray-700">{item.rate}</td>
                        <td className="py-2 text-gray-700">{item.limit}</td>
                        <td className="py-2">
                          <button
                            onClick={() => {
                              const next = [...insuranceActive]
                              next[idx] = !next[idx]
                              setInsuranceActive(next)
                            }}
                            className={`px-2.5 py-0.5 text-xs rounded-full ${
                              insuranceActive[idx]
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {insuranceActive[idx] ? '启用' : '停用'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="mt-3 px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors">
                  添加项目
                </button>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">商业保险配置</h3>
                <div className="space-y-3">
                  {commercialInsurances.map((ins) => (
                    <div
                      key={ins.name}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{ins.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          保障范围：{ins.coverage} | 保费：{ins.premium} | 免赔额：{ins.deductible}
                        </div>
                      </div>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        编辑
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === '系统参数' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">会员等级规则</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">金卡消费阈值</label>
                    <input
                      type="number"
                      value={goldThreshold}
                      onChange={(e) => setGoldThreshold(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">元</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">钻石消费阈值</label>
                    <input
                      type="number"
                      value={diamondThreshold}
                      onChange={(e) => setDiamondThreshold(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">元</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">预警阈值</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">近效期提前天数</label>
                    <input
                      type="number"
                      value={nearExpiryDays}
                      onChange={(e) => setNearExpiryDays(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">库存下限预警比例</label>
                    <input
                      type="number"
                      value={stockLowerRatio}
                      onChange={(e) => setStockLowerRatio(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">监护参数</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">数据采集间隔</label>
                    <input
                      type="number"
                      value={collectInterval}
                      onChange={(e) => setCollectInterval(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">秒</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">预警确认时限</label>
                    <input
                      type="number"
                      value={alertTimeout}
                      onChange={(e) => setAlertTimeout(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">分钟</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">通知设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">疫苗到期提醒提前天数</label>
                    <input
                      type="number"
                      value={vaccineRemindDays}
                      onChange={(e) => setVaccineRemindDays(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">驱虫到期提醒提前天数</label>
                    <input
                      type="number"
                      value={dewormRemindDays}
                      onChange={(e) => setDewormRemindDays(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button className="btn-primary px-6 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors">
                  保存配置
                </button>
              </div>
            </div>
          )}

          {activeTab === '操作日志' && (
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                />
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">全部用户</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">全部操作</option>
                  {actionTypes.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary ml-auto px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  导出日志
                </button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">时间</th>
                    <th className="text-left py-2 text-gray-500 font-medium">操作人</th>
                    <th className="text-left py-2 text-gray-500 font-medium">操作类型</th>
                    <th className="text-left py-2 text-gray-500 font-medium">模块</th>
                    <th className="text-left py-2 text-gray-500 font-medium">详情</th>
                    <th className="text-left py-2 text-gray-500 font-medium">IP地址</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50">
                      <td className="py-2 text-gray-700">{log.timestamp}</td>
                      <td className="py-2 text-gray-700">{log.userName}</td>
                      <td className="py-2 text-gray-700">{log.action}</td>
                      <td className="py-2 text-gray-700">{log.module}</td>
                      <td className="py-2 text-gray-700">{log.detail}</td>
                      <td className="py-2 text-gray-500">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
