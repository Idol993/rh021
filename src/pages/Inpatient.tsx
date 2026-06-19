import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { BedDouble, UserCheck, Bed, PieChart, AlertTriangle } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

const WARD_TABS = ['全部', 'A区普通病房', 'B区重症病房', 'C区隔离病房', 'D区产房']

const STATUS_CONFIG: Record<string, { border: string; bg: string; label: string }> = {
  available: { border: 'border-green-300', bg: 'bg-green-50', label: '空闲' },
  occupied: { border: 'border-blue-300', bg: 'bg-blue-50', label: '已占用' },
  maintenance: { border: 'border-gray-300', bg: 'bg-gray-50', label: '维护中' },
  reserved: { border: 'border-yellow-300', bg: 'bg-yellow-50', label: '已预留' },
}

const WARD_BADGE: Record<string, string> = {
  '普通': 'bg-blue-100 text-blue-700',
  '重症': 'bg-red-100 text-red-700',
  '隔离': 'bg-orange-100 text-orange-700',
  '产房': 'bg-pink-100 text-pink-700',
}

function generateVitalData(petSpecies: 'dog' | 'cat') {
  const hrBase = petSpecies === 'cat' ? 160 : 110
  const hrRange = petSpecies === 'cat' ? 40 : 30
  const tempBase = 38.5
  const now = new Date()
  const points = []

  for (let i = 19; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30000)
    const timeStr = format(time, 'HH:mm')
    let hr = Math.round(hrBase + (Math.random() - 0.5) * hrRange)
    let temp = Math.round((tempBase + (Math.random() - 0.5) * 1.2) * 10) / 10

    const hrAbnormal = i === 5 || i === 12
    const tempAbnormal = i === 8 || i === 15

    if (hrAbnormal) {
      hr = petSpecies === 'cat' ? Math.round(210 + Math.random() * 20) : Math.round(170 + Math.random() * 15)
    }
    if (tempAbnormal) {
      temp = Math.round((40.0 + Math.random() * 0.5) * 10) / 10
    }

    points.push({ time: timeStr, heartRate: hr, temperature: temp, hrAbnormal, tempAbnormal })
  }

  return points
}

export default function Inpatient() {
  const { beds, inpatientRecords, getPetById, getDoctorById, pets } = useAppStore()
  const [wardFilter, setWardFilter] = useState('全部')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const admittedRecords = useMemo(
    () => inpatientRecords.filter((r) => r.status === 'admitted'),
    [inpatientRecords]
  )

  const occupiedCount = beds.filter((b) => b.status === 'occupied').length
  const availableCount = beds.filter((b) => b.status === 'available').length
  const occupancyRate = beds.length > 0 ? Math.round((occupiedCount / beds.length) * 100) : 0

  const filteredBeds = useMemo(
    () => wardFilter === '全部' ? beds : beds.filter((b) => b.ward === wardFilter),
    [beds, wardFilter]
  )

  const selectedRecord = useMemo(
    () => admittedRecords.find((r) => r.id === selectedPatientId) ?? admittedRecords[0] ?? null,
    [admittedRecords, selectedPatientId]
  )

  const selectedPet = useMemo(
    () => selectedRecord ? getPetById(selectedRecord.petId) : null,
    [selectedRecord, getPetById]
  )

  const selectedDoctor = useMemo(
    () => selectedRecord ? getDoctorById(selectedRecord.doctorId) : null,
    [selectedRecord, getDoctorById]
  )

  const vitalData = useMemo(
    () => selectedPet ? generateVitalData(selectedPet.species) : [],
    [selectedPet]
  )

  const latestVitals = vitalData.length > 0 ? vitalData[vitalData.length - 1] : null

  const sampleAlerts = useMemo(() => {
    if (!selectedPet) return []
    return [
      { level: 'warning', message: `心率偏高 (${selectedPet.species === 'cat' ? '218' : '178'} 次/分)`, time: format(new Date(Date.now() - 150000), 'HH:mm'), handler: '张明医生已确认' },
      { level: 'danger', message: '体温异常 (40.3°C)', time: format(new Date(Date.now() - 360000), 'HH:mm'), handler: '李红护士已处理' },
    ]
  }, [selectedPet])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">住院监护</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg"><BedDouble className="w-5 h-5 text-slate-600" /></div>
          <div><div className="text-sm text-gray-500">总床位数</div><div className="text-xl font-bold">{beds.length}</div></div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg"><UserCheck className="w-5 h-5 text-teal-600" /></div>
          <div><div className="text-sm text-gray-500">已占用</div><div className="text-xl font-bold">{occupiedCount}</div></div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Bed className="w-5 h-5 text-green-600" /></div>
          <div><div className="text-sm text-gray-500">空闲床位</div><div className="text-xl font-bold">{availableCount}</div></div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-violet-50 rounded-lg"><PieChart className="w-5 h-5 text-violet-600" /></div>
          <div><div className="text-sm text-gray-500">床位使用率</div><div className="text-xl font-bold">{occupancyRate}%</div></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">床位管理</h2>
        <div className="flex gap-2 mb-4">
          {WARD_TABS.map((ward) => (
            <button
              key={ward}
              onClick={() => setWardFilter(ward)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${wardFilter === ward ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {ward}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const cfg = STATUS_CONFIG[bed.status]
            const pet = bed.currentPetId ? getPetById(bed.currentPetId) : null
            const record = bed.currentPetId
              ? inpatientRecords.find((r) => r.petId === bed.currentPetId && r.status === 'admitted')
              : null
            const doctor = record ? getDoctorById(record.doctorId) : null

            return (
              <div key={bed.id} className={`rounded-lg border-2 p-4 ${cfg.border} ${cfg.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{bed.number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${WARD_BADGE[bed.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {bed.type}
                  </span>
                </div>
                {bed.status === 'occupied' && pet && (
                  <div className="text-sm space-y-1 mb-2">
                    <div className="text-gray-700">患宠: <span className="font-medium">{pet.name}</span></div>
                    {record && <div className="text-gray-500">诊断: {record.diagnosis}</div>}
                    {record && <div className="text-gray-500">入院: {record.admitDate}</div>}
                    {doctor && <div className="text-gray-500">医生: {doctor.name}</div>}
                  </div>
                )}
                {bed.status === 'available' && (
                  <div className="text-sm space-y-1 mb-2">
                    <div className="text-green-600 font-medium">{cfg.label}</div>
                    <div className="text-gray-500">日费: ¥{bed.dailyRate}</div>
                  </div>
                )}
                {(bed.status === 'maintenance' || bed.status === 'reserved') && (
                  <div className="text-sm mb-2">
                    <div className="text-gray-500 font-medium">{cfg.label}</div>
                  </div>
                )}
                <button
                  className={`w-full text-sm py-1.5 rounded-md transition-colors ${bed.status === 'occupied' ? 'bg-blue-500 text-white hover:bg-blue-600' : bed.status === 'available' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  disabled={bed.status === 'maintenance' || bed.status === 'reserved'}
                >
                  {bed.status === 'occupied' ? '查看监护' : bed.status === 'available' ? '分配床位' : cfg.label}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">住院患者监护</h2>

        {admittedRecords.length === 0 ? (
          <div className="text-gray-400 text-center py-8">暂无住院患者</div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              {admittedRecords.map((rec) => {
                const p = getPetById(rec.petId)
                const isActive = selectedRecord?.id === rec.id
                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedPatientId(rec.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {p?.name ?? rec.petId}
                  </button>
                )
              })}
            </div>

            {selectedRecord && selectedPet && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-700">实时监测数据</h3>

                  <div className="mb-6">
                    <div className="text-sm text-gray-500 mb-1">心率趋势</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={vitalData}>
                        <defs>
                          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="heartRate" stroke="#14b8a6" fill="url(#hrGrad)" strokeWidth={2} dot={(props: Record<string, unknown>) => {
                          const { cx, cy, payload } = props as { cx: number; cy: number; payload: { hrAbnormal: boolean } }
                          if (payload.hrAbnormal) {
                            return <circle key={`hr-${cx}`} cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#ef4444" />
                          }
                          return <circle key={`hr-${cx}`} cx={cx} cy={cy} r={2} fill="#14b8a6" />
                        }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    {latestVitals && (
                      <div className="mt-2 text-lg font-semibold text-teal-700">
                        心率 {latestVitals.heartRate} 次/分
                        {latestVitals.hrAbnormal && <span className="ml-2 text-red-500 text-sm">⚠ 异常</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">体温趋势</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={vitalData}>
                        <defs>
                          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis domain={[36.5, 41]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="temperature" stroke="#f97316" fill="url(#tempGrad)" strokeWidth={2} dot={(props: Record<string, unknown>) => {
                          const { cx, cy, payload } = props as { cx: number; cy: number; payload: { tempAbnormal: boolean } }
                          if (payload.tempAbnormal) {
                            return <circle key={`tmp-${cx}`} cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#ef4444" />
                          }
                          return <circle key={`tmp-${cx}`} cx={cx} cy={cy} r={2} fill="#f97316" />
                        }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    {latestVitals && (
                      <div className="mt-2 text-lg font-semibold text-orange-600">
                        体温 {latestVitals.temperature} °C
                        {latestVitals.tempAbnormal && <span className="ml-2 text-red-500 text-sm">⚠ 异常</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-gray-700">住院信息</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex"><span className="text-gray-500 w-24">入院日期</span><span className="font-medium">{selectedRecord.admitDate}</span></div>
                    <div className="flex"><span className="text-gray-500 w-24">预计出院</span><span className="font-medium">{selectedRecord.expectedDischargeDate}</span></div>
                    <div className="flex"><span className="text-gray-500 w-24">诊断</span><span className="font-medium">{selectedRecord.diagnosis}</span></div>
                    <div className="flex"><span className="text-gray-500 w-24">治疗方案</span><span className="font-medium">{selectedRecord.treatmentPlan}</span></div>
                    <div className="flex"><span className="text-gray-500 w-24">主治医生</span><span className="font-medium">{selectedDoctor?.name ?? '-'}</span></div>
                  </div>

                  <h4 className="font-semibold mb-2 text-gray-700">每日护理日志</h4>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {selectedRecord.dailyNotes.map((note, idx) => (
                      <div key={idx} className="text-sm border-l-2 border-teal-300 pl-3">
                        <div className="text-gray-400 text-xs">{note.date}</div>
                        <div className="text-gray-700">{note.content}</div>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold mb-2 text-gray-700">异常预警记录</h4>
                  <div className="space-y-2">
                    {sampleAlerts.map((alert, idx) => (
                      <div key={idx} className={`text-sm p-3 rounded-md flex items-start gap-2 ${alert.level === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.level === 'danger' ? 'text-red-500' : 'text-yellow-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${alert.level === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {alert.level === 'danger' ? '严重' : '警告'}
                            </span>
                            <span className="text-gray-400 text-xs">{alert.time}</span>
                          </div>
                          <div className="text-gray-700 mt-1">{alert.message}</div>
                          <div className="text-gray-400 text-xs mt-1">{alert.handler}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
