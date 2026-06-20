import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  ShieldAlert,
  Bell,
  Activity,
  X,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

function StartDiagnosisButton({ apptId }: { apptId: string }) {
  const navigate = useNavigate()
  const { getAppointmentById, getMedicalRecordByAppointmentId, appointments, checkPetOwnerConsistency } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [consistencyResult, setConsistencyResult] = useState<ReturnType<typeof checkPetOwnerConsistency> | null>(null)

  const appt = getAppointmentById(apptId)
  const existingRecord = getMedicalRecordByAppointmentId(apptId)
  const apptWithMedicalRecordId = appointments.find(a => a.id === apptId)?.medicalRecordId

  const finalRecord = existingRecord ?? (apptWithMedicalRecordId
    ? useAppStore.getState().medicalRecords.find(r => r.id === apptWithMedicalRecordId)
    : undefined)

  if (!appt) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const result = checkPetOwnerConsistency({ appointmentId: apptId })
    if (result.valid) {
      if (finalRecord) {
        navigate(`/diagnosis/medical/${finalRecord.id}`)
      } else {
        navigate(`/diagnosis/consultation/${apptId}`)
      }
    } else {
      setConsistencyResult(result)
      setShowModal(true)
    }
  }

  const handleViewRecordWithWarning = () => {
    if (finalRecord) {
      navigate(`/diagnosis/medical/${finalRecord.id}?warning=1`)
    }
    setShowModal(false)
  }

  const handleReConsult = () => {
    navigate(`/diagnosis/consultation/${apptId}`)
    setShowModal(false)
  }

  if (finalRecord) {
    return (
      <>
        <button
          onClick={handleClick}
          className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1"
        >
          查看病历
        </button>

        {showModal && consistencyResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  数据一致性异常
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="mb-4">
                <ul className="space-y-2 mb-4">
                  {consistencyResult.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-600">
                  该预约关联的病历与预约信息不一致，请选择处理方式
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  取消
                </button>
                <button
                  onClick={handleReConsult}
                  className="btn-primary text-sm px-4 py-2"
                >
                  重新接诊（新建病历）
                </button>
                <button
                  onClick={handleViewRecordWithWarning}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  查看异常病历
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (appt.status === 'scheduled' || appt.status === 'in_progress') {
    return (
      <>
        <button
          onClick={handleClick}
          className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1"
        >
          {appt.status === 'scheduled' ? '开始诊疗' : '继续诊疗'}
        </button>

        {showModal && consistencyResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  数据一致性异常
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="mb-4">
                <ul className="space-y-2 mb-4">
                  {consistencyResult.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-600">
                  该预约关联的病历与预约信息不一致，请选择处理方式
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  取消
                </button>
                <button
                  onClick={handleReConsult}
                  className="btn-primary text-sm px-4 py-2"
                >
                  重新接诊（新建病历）
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="btn-secondary text-xs px-3 py-1.5 inline-block"
      >
        再次接诊
      </button>

      {showModal && consistencyResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                数据一致性异常
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="mb-4">
              <ul className="space-y-2 mb-4">
                {consistencyResult.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600">
                该预约关联的病历与预约信息不一致，请选择处理方式
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary text-sm px-4 py-2"
              >
                取消
              </button>
              <button
                onClick={handleReConsult}
                className="btn-primary text-sm px-4 py-2"
              >
                重新接诊（新建病历）
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: '已预约', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '进行中', className: 'bg-green-100 text-green-700' },
  completed: { label: '已完成', className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
}

const typeConfig: Record<string, { className: string }> = {
  初诊: { className: 'bg-purple-100 text-purple-700' },
  复诊: { className: 'bg-blue-100 text-blue-700' },
  疫苗接种: { className: 'bg-green-100 text-green-700' },
  驱虫: { className: 'bg-amber-100 text-amber-700' },
  体检: { className: 'bg-cyan-100 text-cyan-700' },
  手术: { className: 'bg-red-100 text-red-700' },
}

export default function Diagnosis() {
  const { appointments, pets, owners, doctors, medicalRecords, getMedicalRecordByAppointmentId } = useAppStore()
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')

  const today = '2026-06-20'

  const filteredAppointments =
    activeTab === 'today'
      ? appointments.filter((a) => a.date === today)
      : appointments

  const todayAppointments = appointments.filter((a) => a.date === today)
  const todayScheduled = todayAppointments.filter(
    (a) => a.status === 'scheduled'
  ).length
  const todayCompleted = todayAppointments.filter(
    (a) => a.status === 'completed'
  ).length
  const todayInProgress = todayAppointments.filter(
    (a) => a.status === 'in_progress'
  ).length
  const todayPending = todayAppointments.filter(
    (a) => a.status === 'scheduled'
  ).length

  const expiringVaccines = pets.flatMap((pet) =>
    pet.vaccineRecords
      .filter((v) => v.status === 'expiring' || v.status === 'expired')
      .map((v) => ({
        petId: pet.id,
        petName: pet.name,
        vaccineName: v.name,
        expiryDate: v.expiryDate,
        status: v.status,
      }))
  )

  const getPetName = (petId: string) =>
    pets.find((p) => p.id === petId)?.name ?? '-'
  const getOwnerName = (ownerId: string) =>
    owners.find((o) => o.id === ownerId)?.name ?? '-'
  const getDoctorName = (doctorId: string) =>
    doctors.find((d) => d.id === doctorId)?.name ?? '-'

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Stethoscope className="w-7 h-7 text-primary-600" />
        诊疗工作台
      </h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary-600" />
                预约挂号
              </h2>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'today'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  今日预约
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  全部预约
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header border-b border-slate-200">
                    <th className="py-3 px-3">宠物名称</th>
                    <th className="py-3 px-3">主人</th>
                    <th className="py-3 px-3">医生</th>
                    <th className="py-3 px-3">时间</th>
                    <th className="py-3 px-3">类型</th>
                    <th className="py-3 px-3">状态</th>
                    <th className="py-3 px-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr
                      key={appt.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {getPetName(appt.petId)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {getOwnerName(appt.ownerId)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {getDoctorName(appt.doctorId)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {appt.date} {appt.time}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`status-badge ${typeConfig[appt.type]?.className ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {appt.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`status-badge ${statusConfig[appt.status]?.className ?? ''}`}
                        >
                          {statusConfig[appt.status]?.label ?? appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StartDiagnosisButton apptId={appt.id} />
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-slate-400"
                      >
                        暂无预约记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              今日统计
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {todayScheduled}
                </div>
                <div className="text-xs text-blue-500 mt-1">预约数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {todayCompleted}
                </div>
                <div className="text-xs text-green-500 mt-1">已完成</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {todayInProgress}
                </div>
                <div className="text-xs text-amber-500 mt-1">进行中</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {todayPending}
                </div>
                <div className="text-xs text-orange-500 mt-1">待就诊</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI辅助诊断提示
            </h2>
            <div className="space-y-3">
              {[
                {
                  name: '急性胃肠炎',
                  match: 87,
                  basis: '基于症状：呕吐、食欲下降',
                  risk: 'high',
                },
                {
                  name: '食物过敏',
                  match: 62,
                  basis: '基于过敏史',
                  risk: 'medium',
                },
                {
                  name: '肠道寄生虫',
                  match: 45,
                  basis: '基于体重下降',
                  risk: 'low',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          item.risk === 'high'
                            ? 'bg-red-500'
                            : item.risk === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                      />
                      <span className="text-sm font-semibold text-primary-600">
                        匹配度 {item.match}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{item.basis}</p>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                      采纳
                    </button>
                    <button className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                      修改
                    </button>
                    <button className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      驳回
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              待处理预警
            </h2>
            <div className="space-y-2">
              {expiringVaccines.map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border border-slate-200 rounded-lg p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">
                        {v.petName}
                      </span>
                      <span
                        className={`status-badge text-[10px] ${
                          v.status === 'expired'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {v.status === 'expired' ? '已过期' : '即将到期'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {v.vaccineName} · 到期 {v.expiryDate}
                    </p>
                  </div>
                  <button className="text-xs px-2.5 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    提醒
                  </button>
                </div>
              ))}
              {expiringVaccines.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  暂无预警
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
