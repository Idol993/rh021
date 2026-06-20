import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Stethoscope,
  User,
  PawPrint,
  Stethoscope as DoctorIcon,
  Calendar,
  Clock,
  FileText,
  Plus,
  Save,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Pill,
  ClipboardList,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { MedicalRecord, PrescriptionItem, ExamResult } from '@/types'

const EXAM_TEMPLATES = [
  { item: '白细胞(WBC)', result: '', reference: '5.5-19.5', unit: '×10⁹/L' },
  { item: '红细胞(RBC)', result: '', reference: '5.0-10.0', unit: '×10¹²/L' },
  { item: '血红蛋白(HGB)', result: '', reference: '80-180', unit: 'g/L' },
  { item: 'C反应蛋白(CRP)', result: '', reference: '0-10', unit: 'mg/L' },
  { item: '体温', result: '', reference: '37.5-39.5', unit: '°C' },
]

export default function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const {
    getAppointmentById,
    getPetById,
    getOwnerById,
    getDoctorById,
    getMedicalRecordsByPetId,
    medicalRecords,
    drugs,
    addMedicalRecord,
    updateAppointment,
    currentUser,
    addOperationLog,
  } = useAppStore()

  const appt = appointmentId ? getAppointmentById(appointmentId) : undefined
  const pet = appt ? getPetById(appt.petId) : undefined
  const owner = appt ? getOwnerById(appt.ownerId) : undefined
  const doctor = appt ? getDoctorById(appt.doctorId) : undefined
  const existingRecords = appt ? getMedicalRecordsByPetId(appt.petId) : []

  const nextMrId = useMemo(() => {
    const nums = medicalRecords
      .map((r) => parseInt(r.id.replace('mr-', '')))
      .filter((n) => !isNaN(n))
    const max = nums.length > 0 ? Math.max(...nums) : 0
    return `mr-${String(max + 1).padStart(3, '0')}`
  }, [medicalRecords])

  const [chiefComplaint, setChiefComplaint] = useState(appt?.notes ?? '')
  const [presentIllness, setPresentIllness] = useState('')
  const [temperature, setTemperature] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [bodyWeight, setBodyWeight] = useState(pet?.weight?.toString() ?? '')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
  const [addDrugId, setAddDrugId] = useState('')
  const [addDosage, setAddDosage] = useState('')
  const [addFrequency, setAddFrequency] = useState('')
  const [addDuration, setAddDuration] = useState('')
  const [addQuantity, setAddQuantity] = useState('')

  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  if (!appt || !pet || !owner || !doctor) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-lg text-slate-600">未找到有效的预约信息</p>
        <Link to="/diagnosis" className="btn-primary mt-4">
          返回诊疗工作台
        </Link>
      </div>
    )
  }

  const addExamFromTemplate = () => {
    const existing = examResults.map((e) => e.item)
    const toAdd = EXAM_TEMPLATES.filter((t) => !existing.includes(t.item)).map((t) => ({
      item: t.item,
      result: '',
      reference: t.reference,
      abnormal: false,
    }))
    setExamResults([...examResults, ...toAdd])
  }

  const checkAbnormal = (item: string, result: string) => {
    const val = parseFloat(result)
    if (isNaN(val)) return false
    const ranges: Record<string, [number, number]> = {
      '白细胞(WBC)': [5.5, 19.5],
      '红细胞(RBC)': [5.0, 10.0],
      '血红蛋白(HGB)': [80, 180],
      'C反应蛋白(CRP)': [0, 10],
      体温: [37.5, 39.5],
    }
    const r = ranges[item]
    if (!r) return false
    return val < r[0] || val > r[1]
  }

  const updateExamResult = (idx: number, result: string) => {
    setExamResults(
      examResults.map((e, i) => {
        if (i !== idx) return e
        return { ...e, result, abnormal: checkAbnormal(e.item, result) }
      })
    )
  }

  const removeExamResult = (idx: number) => {
    setExamResults(examResults.filter((_, i) => i !== idx))
  }

  const addPrescription = () => {
    const drug = drugs.find((d) => d.id === addDrugId)
    if (!drug) return
    const qty = parseInt(addQuantity)
    if (isNaN(qty) || qty <= 0) return
    setPrescriptions([
      ...prescriptions,
      {
        drugId: drug.id,
        drugName: drug.name,
        dosage: addDosage || '按体重计算',
        frequency: addFrequency || '每日1次',
        duration: addDuration || '7天',
        quantity: qty,
      },
    ])
    setAddDrugId('')
    setAddDosage('')
    setAddFrequency('')
    setAddDuration('')
    setAddQuantity('')
  }

  const removePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx))
  }

  const allergies = pet.allergies || []
  const checkPrescriptionAllergy = (drugName: string) => {
    if (allergies.length === 0) return false
    return allergies.some((a) => drugName.includes(a) || a.includes(drugName))
  }

  const handleSave = (complete: boolean) => {
    setSaveError(null)
    if (!chiefComplaint.trim()) {
      setSaveError('请填写主诉')
      return
    }
    if (!diagnosis.trim()) {
      setSaveError('请填写诊断结论')
      return
    }
    try {
      const record: MedicalRecord = {
        id: nextMrId,
        petId: pet.id,
        ownerId: owner.id,
        doctorId: doctor.id,
        date: new Date().toISOString().split('T')[0],
        chiefComplaint: chiefComplaint.trim(),
        presentIllness: presentIllness.trim(),
        temperature: parseFloat(temperature) || 38.5,
        heartRate: parseInt(heartRate) || (pet.species === 'dog' ? 120 : 180),
        weight: parseFloat(bodyWeight) || pet.weight,
        examResults: examResults.filter((e) => e.result !== ''),
        diagnosis: diagnosis.trim(),
        prescriptions,
        treatmentPlan: treatmentPlan.trim() || '按医嘱执行',
        followUpDate: followUpDate || '',
        status: complete ? 'completed' : 'follow_up',
      }
      addMedicalRecord(record)
      updateAppointment(appt.id, {
        status: complete ? 'completed' : 'in_progress',
      })
      addOperationLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: '创建',
        module: '病历管理',
        detail: `为宠物 ${pet.name} 创建病历 ${record.id}，诊断：${diagnosis.trim()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: '192.168.1.100',
      })
      setSaveSuccess(true)
      setTimeout(() => {
        navigate(`/diagnosis/medical/${record.id}`)
      }, 1200)
    } catch (e: any) {
      setSaveError('保存失败：' + (e?.message ?? '未知错误'))
    }
  }

  const latestRecord =
    existingRecords.length > 0 ? existingRecords[existingRecords.length - 1] : null

  return (
    <div className="page-container max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-primary-600" />
            接诊诊疗
            <span className="text-sm font-normal text-slate-500 ml-2">
              预约 {appt.type}
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-1">
            预约号：{appt.id} · 预约时间：{appt.date} {appt.time}
          </div>
        </div>
        {existingRecords.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <FileText className="w-4 h-4" />
            既往就诊 {existingRecords.length} 次
            {latestRecord && (
              <Link
                to={`/diagnosis/medical/${latestRecord.id}`}
                className="ml-2 text-xs underline hover:text-blue-900"
              >
                查看上次病历
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="card mb-6 bg-gradient-to-r from-primary-50 to-cyan-50 border-primary-100">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <PawPrint className="w-3.5 h-3.5" />
              宠物
            </div>
            <p className="font-semibold text-slate-800">
              {pet.name}
              <span className="text-xs font-normal ml-2 text-slate-500">
                {pet.species === 'dog' ? '犬' : '猫'} · {pet.breed}
              </span>
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <User className="w-3.5 h-3.5" />
              主人
            </div>
            <p className="font-semibold text-slate-800">{owner.name}</p>
            <p className="text-xs text-slate-500">{owner.phone}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <DoctorIcon className="w-3.5 h-3.5" />
              主治医生
            </div>
            <p className="font-semibold text-slate-800">{doctor.name}</p>
            <p className="text-xs text-slate-500">
              {doctor.title} · {doctor.specialty}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              预约类型
            </div>
            <p className="font-semibold text-primary-700">{appt.type}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              当前体重
            </div>
            <p className="font-semibold text-slate-800">{pet.weight} kg</p>
          </div>
        </div>
        {allergies.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              ⚠️ 宠物过敏史（全程高亮提醒）
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {allergies.map((a) => (
                <span key={a} className="status-badge bg-red-100 text-red-700">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {saveError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          病历保存成功，正在跳转至病历详情...
        </div>
      )}

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary-600" />
            主诉与现病史
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">
                主诉 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field min-h-[80px]"
                placeholder="主诉、主要症状及持续时间..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">现病史</label>
              <textarea
                className="input-field min-h-[80px]"
                placeholder="现病史详细描述..."
                value={presentIllness}
                onChange={(e) => setPresentIllness(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">体温(°C)</label>
              <input
                className="input-field"
                placeholder="如：38.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">心率(次/分)</label>
              <input
                className="input-field"
                placeholder={pet.species === 'dog' ? '80-160' : '120-240'}
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">体重(kg)</label>
              <input
                className="input-field"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary-600" />
              检查结果
            </h2>
            <button
              type="button"
              onClick={addExamFromTemplate}
              className="text-xs px-3 py-1.5 rounded bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
            >
              + 快速添加常用项
            </button>
          </div>
          {examResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">暂无检查结果</p>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2">检查项目</th>
                    <th className="px-3 py-2">结果</th>
                    <th className="px-3 py-2">参考范围</th>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examResults.map((e, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-3 py-2 text-sm">{e.item}</td>
                      <td className="px-3 py-2">
                        <input
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          value={e.result}
                          onChange={(ev) => updateExamResult(idx, ev.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{e.reference}</td>
                      <td className="px-3 py-2">
                        {e.result &&
                          (e.abnormal ? (
                            <span className="status-badge bg-red-100 text-red-700">异常</span>
                          ) : (
                            <span className="status-badge bg-green-100 text-green-700">正常</span>
                          ))}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeExamResult(idx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary-600" />
            处方
            {allergies.length > 0 && (
              <span className="text-xs font-normal ml-2 text-red-600">已启用过敏自动检测</span>
            )}
          </h2>
          {prescriptions.length > 0 && (
            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2">药品</th>
                    <th className="px-3 py-2">剂量</th>
                    <th className="px-3 py-2">频率</th>
                    <th className="px-3 py-2">疗程</th>
                    <th className="px-3 py-2">数量</th>
                    <th className="px-3 py-2">安全校验</th>
                    <th className="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((p, idx) => {
                    const allergyRisk = checkPrescriptionAllergy(p.drugName)
                    return (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2 text-sm font-medium">{p.drugName}</td>
                        <td className="px-3 py-2 text-sm">{p.dosage}</td>
                        <td className="px-3 py-2 text-sm">{p.frequency}</td>
                        <td className="px-3 py-2 text-sm">{p.duration}</td>
                        <td className="px-3 py-2 text-sm">{p.quantity}</td>
                        <td className="px-3 py-2">
                          {allergyRisk ? (
                            <span className="status-badge bg-red-100 text-red-700">⚠️ 过敏风险</span>
                          ) : (
                            <span className="status-badge bg-green-100 text-green-700">安全</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removePrescription(idx)}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-6 gap-2">
            <select
              className="select-field"
              value={addDrugId}
              onChange={(e) => setAddDrugId(e.target.value)}
            >
              <option value="">-- 选择药品 --</option>
              {drugs.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                  disabled={d.status === 'expired' || d.status === 'locked'}
                >
                  {d.name} {d.specification}
                  {d.status === 'expired'
                    ? ' (已过期)'
                    : d.status === 'low_stock'
                      ? ` (库存不足 剩${d.stock})`
                      : ''}
                </option>
              ))}
            </select>
            <input
              className="input-field"
              placeholder="剂量"
              value={addDosage}
              onChange={(e) => setAddDosage(e.target.value)}
            />
            <select
              className="select-field"
              value={addFrequency}
              onChange={(e) => setAddFrequency(e.target.value)}
            >
              <option value="">频率</option>
              {['每日1次', '每日2次', '每日3次', '每8小时1次', '每12小时1次', '单次'].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <input
              className="input-field"
              placeholder="疗程（如 7天）"
              value={addDuration}
              onChange={(e) => setAddDuration(e.target.value)}
            />
            <input
              className="input-field"
              type="number"
              placeholder="数量"
              min={1}
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value)}
            />
            <button
              type="button"
              onClick={addPrescription}
              disabled={!addDrugId || !addQuantity}
              className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            诊断与治疗
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">
                诊断结论 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field min-h-[80px]"
                placeholder="如：急性胃肠炎"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">治疗方案</label>
              <textarea
                className="input-field min-h-[80px]"
                placeholder="治疗方案、注意事项..."
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">复诊日期</label>
            <input
              type="date"
              className="input-field max-w-xs"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            取消
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              className="btn-secondary flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              暂存并继续
            </button>
            <button
              onClick={() => handleSave(true)}
              className="btn-primary flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              完成诊疗
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
