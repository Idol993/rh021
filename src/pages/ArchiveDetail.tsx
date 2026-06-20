import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Syringe, Bug, Stethoscope, Pill } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/stores/useAppStore'
import { differenceInYears, format } from 'date-fns'

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getPetById, getOwnerById, getDoctorById, getMedicalRecordsByPetId, getDispenseRecordsByPetId } = useAppStore()

  const pet = id ? getPetById(id) : undefined
  if (!pet) {
    return (
      <div className="page-container">
        <div className="card text-center py-12">
          <p className="text-slate-500">未找到该宠物档案</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/archives')}>
            返回档案列表
          </button>
        </div>
      </div>
    )
  }

  const owner = getOwnerById(pet.ownerId)
  const medicalRecords = getMedicalRecordsByPetId(pet.id)
  const sortedRecords = [...medicalRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latestRecord = sortedRecords[0]

  const timelineEvents = useMemo(() => {
    const events: { date: string; type: 'vaccine' | 'deworming' | 'visit' | 'dispense'; title: string; desc: string; icon: React.ReactNode; color: string; recordId?: string }[] = []
    
    pet.vaccineRecords.forEach(v => events.push({
      date: v.date, type: 'vaccine', title: v.name,
      desc: `接种${v.institution || ''}，有效期至${v.expiryDate}`,
      icon: <Syringe className="w-3.5 h-3.5" />,
      color: 'bg-green-500'
    }))
    
    pet.dewormingRecords.forEach(d => events.push({
      date: d.date, type: 'deworming', title: `${d.type}：${d.drugName}`,
      desc: `下次驱虫：${d.nextDate}`,
      icon: <Bug className="w-3.5 h-3.5" />,
      color: 'bg-amber-500'
    }))
    
    medicalRecords.forEach(r => events.push({
      date: r.date, type: 'visit', title: `就诊：${r.diagnosis}`,
      desc: `主诉：${r.chiefComplaint}`,
      icon: <Stethoscope className="w-3.5 h-3.5" />,
      color: 'bg-primary-500',
      recordId: r.id
    }))
    
    const dispenses = getDispenseRecordsByPetId(pet.id)
    dispenses.forEach(d => events.push({
      date: d.timestamp.split(' ')[0], type: 'dispense',
      title: `发药：${d.items.map(i => i.drugName).join('、')}`,
      desc: `共${d.items.length}种药品，操作人：${d.operator}`,
      icon: <Pill className="w-3.5 h-3.5" />,
      color: 'bg-teal-500'
    }))
    
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [pet, medicalRecords, getDispenseRecordsByPetId])

  const calcAge = (birthDate: string) => {
    const years = differenceInYears(new Date(), new Date(birthDate))
    return years < 1 ? '不足1岁' : `${years}岁`
  }

  const avatarBg = pet.species === 'dog' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'

  const vaccineStatusColor = (status: 'valid' | 'expiring' | 'expired') => {
    if (status === 'valid') return 'bg-green-100 text-green-700'
    if (status === 'expiring') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const vaccineStatusLabel = (status: 'valid' | 'expiring' | 'expired') => {
    if (status === 'valid') return '有效'
    if (status === 'expiring') return '即将过期'
    return '已过期'
  }

  const recordStatusLabel = (status: 'completed' | 'follow_up' | 'hospitalized') => {
    if (status === 'completed') return { label: '已完成', cls: 'bg-green-100 text-green-700' }
    if (status === 'follow_up') return { label: '待复诊', cls: 'bg-yellow-100 text-yellow-700' }
    return { label: '住院中', cls: 'bg-red-100 text-red-700' }
  }

  const validCount = pet.vaccineRecords.filter(v => v.status === 'valid').length
  const expiringCount = pet.vaccineRecords.filter(v => v.status === 'expiring').length
  const expiredCount = pet.vaccineRecords.filter(v => v.status === 'expired').length

  const vaccineChartData = [
    { name: '有效', value: validCount, color: '#22c55e' },
    { name: '即将过期', value: expiringCount, color: '#eab308' },
    { name: '已过期', value: expiredCount, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const totalPrescriptions = medicalRecords.reduce((sum, r) => sum + r.prescriptions.length, 0)

  return (
    <div className="page-container">
      <button
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-700 mb-6 font-medium"
        onClick={() => navigate('/archives')}
      >
        <ArrowLeft size={16} />
        返回档案列表
      </button>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex flex-col items-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${avatarBg}`}>
              {pet.name[0]}
            </div>
            <h2 className="text-2xl font-bold mt-3">{pet.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {pet.species === 'dog' ? '犬' : '猫'} · {pet.breed}
            </p>
            {pet.chipNo && (
              <p className="text-xs text-slate-400 mt-1">芯片号: {pet.chipNo}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-400 text-xs">性别</span>
              <p className="font-medium mt-0.5">
                {pet.gender === 'male' ? (
                  <span className="text-blue-600">♂ 公</span>
                ) : (
                  <span className="text-pink-500">♀ 母</span>
                )}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-400 text-xs">年龄</span>
              <p className="font-medium mt-0.5">{calcAge(pet.birthDate)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-400 text-xs">体重</span>
              <p className="font-medium mt-0.5">{pet.weight}kg</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-400 text-xs">毛色</span>
              <p className="font-medium mt-0.5">{pet.color}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 col-span-2">
              <span className="text-slate-400 text-xs">绝育状态</span>
              <p className="font-medium mt-0.5">{pet.neutered ? '已绝育' : '未绝育'}</p>
            </div>
          </div>
          {pet.allergies.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-1 text-red-600 text-sm font-medium mb-2">
                <AlertTriangle size={14} />
                过敏史
              </div>
              <ul className="space-y-1">
                {pet.allergies.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle size={12} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4">主人信息</h3>
          {owner ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                  {owner.name[0]}
                </div>
                <div>
                  <p className="font-medium">{owner.name}</p>
                  <p className="text-xs text-slate-400">宠物主人</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">电话</span>
                  <span className="font-medium">{owner.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">地址</span>
                  <span className="font-medium text-right max-w-[180px]">{owner.address}</span>
                </div>
                {owner.wechat && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">微信</span>
                    <span className="font-medium">{owner.wechat}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">暂无主人信息</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4">快速统计</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">就诊次数</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{medicalRecords.length}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-600">处方数量</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{totalPrescriptions}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-2">疫苗状态</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vaccineChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {vaccineChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-xs mt-1">
                {vaccineChartData.map(d => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} {d.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-4">疫苗与驱虫记录</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3">疫苗接种</h4>
              <div className="space-y-3">
                {pet.vaccineRecords.map((v, i) => (
                  <div key={i} className="relative pl-6 pb-3 border-l-2 border-slate-200 last:border-l-0 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary-500" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="text-xs text-slate-400">
                          接种: {format(new Date(v.date), 'yyyy-MM-dd')} · 到期: {format(new Date(v.expiryDate), 'yyyy-MM-dd')}
                        </p>
                      </div>
                      <span className={`status-badge ${vaccineStatusColor(v.status)}`}>
                        {vaccineStatusLabel(v.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3">驱虫记录</h4>
              <div className="space-y-3">
                {pet.dewormingRecords.map((d, i) => (
                  <div key={i} className="relative pl-6 pb-3 border-l-2 border-slate-200 last:border-l-0 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-sm font-medium">{d.drugName}</p>
                      <p className="text-xs text-slate-400">
                        用药: {format(new Date(d.date), 'yyyy-MM-dd')} · 下次: {format(new Date(d.nextDate), 'yyyy-MM-dd')}
                      </p>
                    </div>
                  </div>
                ))}
                {pet.dewormingRecords.length === 0 && (
                  <p className="text-sm text-slate-400">暂无驱虫记录</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4">就诊记录</h3>
          {sortedRecords.length > 0 ? (
            <div className="space-y-3">
              {sortedRecords.map(record => {
                const doctor = getDoctorById(record.doctorId)
                const statusInfo = recordStatusLabel(record.status)
                return (
                  <Link key={record.id} to={`/diagnosis/medical/${record.id}`}>
                    <div className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">{format(new Date(record.date), 'yyyy-MM-dd')}</span>
                        <span className={`status-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                      </div>
                      <p className="font-medium text-sm mb-1">{record.diagnosis}</p>
                      <p className="text-xs text-slate-400">
                        主治医生: {doctor?.name || '-'} · 主诉: {record.chiefComplaint}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">暂无就诊记录</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg mb-1">完整时间线</h3>
        <p className="text-xs text-slate-400 mb-4">疫苗 · 驱虫 · 就诊 · 发药 全事件</p>
        <div className="space-y-1">
          {timelineEvents.map((ev, i) => (
            <div key={i} className="relative pl-8 pb-5 border-l-2 border-slate-200 last:border-l-0 last:pb-1">
              <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${ev.color} flex items-center justify-center text-white`}>
                {ev.icon}
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{ev.date}</span>
                    {ev.recordId && (
                      <Link to={`/diagnosis/medical/${ev.recordId}`} className="text-xs text-primary-600 underline hover:text-primary-700">
                        查看病历
                      </Link>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{ev.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.desc}</p>
                </div>
              </div>
            </div>
          ))}
          {timelineEvents.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">暂无事件记录</p>
          )}
        </div>
      </div>
    </div>
  )
}
