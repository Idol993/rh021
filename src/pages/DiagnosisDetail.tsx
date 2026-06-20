import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Thermometer,
  Heart,
  Weight,
  FlaskConical,
  Stethoscope,
  Pill,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Unlink,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

export default function DiagnosisDetail() {
  const { id, recordId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { medicalRecords, pets, owners, doctors, getMedicalRecordsByPetId, checkPetOwnerConsistency, updateMedicalRecord, updateAppointment } = useAppStore()

  let record: typeof medicalRecords[number] | undefined
  if (recordId) {
    record = medicalRecords.find((r) => r.id === recordId)
  } else if (id) {
    record = medicalRecords.find((r) => r.id === id)
    if (!record) {
      const byPet = getMedicalRecordsByPetId(id)
      if (byPet && byPet.length > 0) {
        record = byPet[byPet.length - 1]
      }
    }
  }
  if (!record) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-lg text-slate-600">未找到该病历记录</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary mt-4"
        >
          返回
        </button>
      </div>
    )
  }

  const hasWarning = new URLSearchParams(location.search).get('warning') === '1'
  const consistencyResult = checkPetOwnerConsistency({
    recordId: record.id,
    appointmentId: record.appointmentId,
  })
  const showWarning = !consistencyResult.valid || hasWarning

  const pet = pets.find((p) => p.id === record.petId)
  const owner = owners.find((o) => o.id === record.ownerId)
  const doctor = doctors.find((d) => d.id === record.doctorId)

  const handleReConsult = () => {
    if (record?.appointmentId) {
      navigate(`/diagnosis/consultation/${record.appointmentId}`)
    }
  }

  const handleUnlink = () => {
    if (record && record.appointmentId) {
      updateMedicalRecord(record.id, { appointmentId: undefined })
      updateAppointment(record.appointmentId, { medicalRecordId: undefined })
    }
  }

  const petAge = pet
    ? Math.floor(
        (Date.now() - new Date(pet.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : '-'

  const insuranceItems = [
    { name: '血常规检查', covered: true, amount: 80 },
    { name: 'CRP检测', covered: true, amount: 120 },
    { name: 'B超检查', covered: true, amount: 200 },
    { name: 'X光检查', covered: false, amount: 150 },
    { name: '处方药品', covered: false, amount: 260 },
  ]
  const coveredTotal = insuranceItems
    .filter((i) => i.covered)
    .reduce((sum, i) => sum + i.amount, 0)
  const excludedTotal = insuranceItems
    .filter((i) => !i.covered)
    .reduce((sum, i) => sum + i.amount, 0)
  const reimbursement = Math.round(coveredTotal * 0.7)

  return (
    <div className="page-container">
      {showWarning && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">数据一致性异常</h3>
              {consistencyResult.issues.length > 0 ? (
                <ul className="space-y-1 mb-3">
                  {consistencyResult.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-700 mb-3">该病历可能存在数据异常，请谨慎处理</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleReConsult}
                  className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-1"
                  disabled={!record?.appointmentId}
                >
                  <RotateCcw className="w-4 h-4" />
                  重新接诊
                </button>
                {record?.appointmentId && (
                  <button
                    onClick={handleUnlink}
                    className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-1"
                  >
                    <Unlink className="w-4 h-4" />
                    解除关联
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary-600" />
          电子病历
        </h1>
      </div>

      <div className="card mb-6 bg-gradient-to-r from-primary-50 to-cyan-50 border-primary-100">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div>
            <span className="text-xs text-slate-500">宠物</span>
            <p className="font-semibold text-slate-800">{pet?.name ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">物种</span>
            <p className="font-semibold text-slate-800">
              {pet?.species === 'dog' ? '犬' : '猫'}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">品种</span>
            <p className="font-semibold text-slate-800">{pet?.breed ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">年龄</span>
            <p className="font-semibold text-slate-800">{petAge}岁</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">体重</span>
            <p className="font-semibold text-slate-800">{pet?.weight ?? '-'}kg</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">主人</span>
            <p className="font-semibold text-slate-800">{owner?.name ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">主治医生</span>
            <p className="font-semibold text-slate-800">{doctor?.name ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary-600" />
            主诉与现病史
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-500">主诉</span>
              <p className="text-slate-800 mt-0.5">{record.chiefComplaint}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">现病史</span>
              <p className="text-slate-800 mt-0.5">{record.presentIllness}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary-600" />
            体格检查
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Thermometer className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-700">
                {record.temperature}°C
              </div>
              <div className="text-xs text-blue-500">体温</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-red-700">
                {record.heartRate}
              </div>
              <div className="text-xs text-red-500">心率(次/分)</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Weight className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-700">
                {record.weight}kg
              </div>
              <div className="text-xs text-green-500">体重</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary-600" />
            检查结果
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header border-b border-slate-200">
                  <th className="py-2 px-3">检查项目</th>
                  <th className="py-2 px-3">结果</th>
                  <th className="py-2 px-3">参考范围</th>
                  <th className="py-2 px-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {record.examResults.map ( (exam, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-slate-700">{exam.item}</td>
                    <td
                      className={`py-2 px-3 font-medium ${
                        exam.abnormal ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {exam.result}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {exam.reference}
                    </td>
                    <td className="py-2 px-3">
                      {exam.abnormal ? (
                        <span className="status-badge bg-red-100 text-red-700">
                          异常
                        </span>
                      ) : (
                        <span className="status-badge bg-green-100 text-green-700">
                          正常
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary-600" />
            诊断
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-500">诊断结果</span>
              <p className="text-lg font-semibold text-primary-700 mt-0.5">
                {record.diagnosis}
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-500">治疗方案</span>
              <p className="text-slate-800 mt-0.5">{record.treatmentPlan}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary-600" />
            处方
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header border-b border-slate-200">
                  <th className="py-2 px-3">药品名称</th>
                  <th className="py-2 px-3">剂量</th>
                  <th className="py-2 px-3">频率</th>
                  <th className="py-2 px-3">疗程</th>
                  <th className="py-2 px-3">数量</th>
                </tr>
              </thead>
              <tbody>
                {record.prescriptions.map((rx, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            idx % 2 === 0
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-medium text-slate-800">
                          {rx.drugName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{rx.dosage}</td>
                    <td className="py-2 px-3 text-slate-600">{rx.frequency}</td>
                    <td className="py-2 px-3 text-slate-600">{rx.duration}</td>
                    <td className="py-2 px-3 text-slate-600">{rx.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            医保校验
          </h2>
          <div className="space-y-2 mb-4">
            {insuranceItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  {item.covered ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-slate-700">{item.name}</span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    item.covered ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ¥{item.amount} {item.covered ? '已覆盖' : '自费'}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
            <div className="text-slate-600">
              预估报销金额：
              <span className="font-semibold text-green-600">
                ¥{reimbursement}
              </span>
            </div>
            <div className="text-slate-600">
              自付金额：
              <span className="font-semibold text-red-600">
                ¥{excludedTotal + coveredTotal - reimbursement}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary-600" />
            医嘱
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-500">治疗方案详情</span>
              <p className="text-slate-800 mt-0.5">{record.treatmentPlan}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">复诊日期</span>
              <p className="text-slate-800 mt-0.5 font-medium">
                {record.followUpDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
