import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  PawPrint,
  User,
  Microchip,
  Syringe,
  Bug,
  AlertTriangle,
  Save,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Heart,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type {
  VaccineRecord,
  DewormingRecord,
  Pet,
  Owner,
} from '@/types'

const STEPS = [
  { key: 'owner', label: '主人信息', icon: User },
  { key: 'pet', label: '宠物信息', icon: PawPrint },
  { key: 'vaccine', label: '疫苗驱虫', icon: Syringe },
  { key: 'allergy', label: '过敏史', icon: AlertTriangle },
]

const VACCINE_TYPES_DOG = [
  '犬瘟热疫苗',
  '犬细小病毒疫苗',
  '狂犬疫苗',
  '犬腺病毒疫苗',
  '犬副流感疫苗',
  '犬钩端螺旋体疫苗',
]

const VACCINE_TYPES_CAT = [
  '猫瘟疫苗',
  '猫鼻支疫苗',
  '猫杯状病毒疫苗',
  '狂犬疫苗',
  '猫传染性腹膜炎疫苗',
]

const DEWORMING_TYPES = ['体内驱虫', '体外驱虫', '体内外一体驱虫']

export default function CreateArchive() {
  const navigate = useNavigate()
  const {
    owners,
    addOwner,
    addPet,
    checkChipNo,
    pets,
    currentUser,
    addOperationLog,
  } = useAppStore()

  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [ownerMode, setOwnerMode] = useState<'select' | 'new'>('select')
  const [existingOwnerId, setExistingOwnerId] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [ownerWechat, setOwnerWechat] = useState('')

  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [birthDate, setBirthDate] = useState('')
  const [weight, setWeight] = useState('')
  const [color, setColor] = useState('')
  const [neutered, setNeutered] = useState(false)
  const [chipNo, setChipNo] = useState('')

  const [vaccines, setVaccines] = useState<VaccineRecord[]>([])
  const [dewormings, setDewormings] = useState<DewormingRecord[]>([])
  const [newVacType, setNewVacType] = useState('')
  const [newVacDate, setNewVacDate] = useState('')
  const [newVacInstitution, setNewVacInstitution] = useState('本院')

  const [newDewormType, setNewDewormType] = useState('')
  const [newDewormDrug, setNewDewormDrug] = useState('')
  const [newDewormDate, setNewDewormDate] = useState('')

  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')

  const nextPetId = useMemo(() => {
    const nums = pets
      .map((p) => parseInt(p.id.replace('pet-', '')))
      .filter((n) => !isNaN(n))
    const max = nums.length > 0 ? Math.max(...nums) : 0
    return `pet-${String(max + 1).padStart(3, '0')}`
  }, [pets])

  const nextOwnerId = useMemo(() => {
    const nums = owners
      .map((o) => parseInt(o.id.replace('owner-', '')))
      .filter((n) => !isNaN(n))
    const max = nums.length > 0 ? Math.max(...nums) : 0
    return `owner-${String(max + 1).padStart(3, '0')}`
  }, [owners])

  const chipNoError = useMemo(() => {
    if (!chipNo.trim()) return null
    if (chipNo.trim().length < 8) return '芯片号长度不足'
    if (!checkChipNo(chipNo.trim())) return '芯片号已存在，请勿重复建档'
    return null
  }, [chipNo, checkChipNo])

  const canStep = (s: number) => {
    if (s === 0) return true
    if (s === 1) {
      return ownerMode === 'select'
        ? existingOwnerId !== ''
        : ownerName.trim() !== '' && ownerPhone.trim() !== ''
    }
    if (s === 2) {
      return (
        petName.trim() !== '' &&
        breed.trim() !== '' &&
        birthDate !== '' &&
        weight !== '' &&
        chipNoError === null
      )
    }
    return true
  }

  const goNext = () => {
    if (step < STEPS.length - 1 && canStep(step + 1)) {
      setStep(step + 1)
      setSubmitError(null)
    }
  }

  const goPrev = () => {
    if (step > 0) {
      setStep(step - 1)
      setSubmitError(null)
    }
  }

  const addVaccine = () => {
    if (!newVacType || !newVacDate) return
    const exp = new Date(newVacDate)
    exp.setFullYear(exp.getFullYear() + 1)
    const today = new Date('2026-06-20')
    let status: VaccineRecord['status'] = 'valid'
    const daysDiff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 0) status = 'expired'
    else if (daysDiff < 30) status = 'expiring'
    setVaccines([
      ...vaccines,
      {
        name: newVacType,
        date: newVacDate,
        expiryDate: exp.toISOString().split('T')[0],
        batchNo: `AUTO-${Date.now()}`,
        status,
        institution: newVacInstitution || '本院',
      },
    ])
    setNewVacType('')
    setNewVacDate('')
  }

  const removeVaccine = (idx: number) => {
    setVaccines(vaccines.filter((_, i) => i !== idx))
  }

  const addDeworming = () => {
    if (!newDewormType || !newDewormDate) return
    const next = new Date(newDewormDate)
    next.setMonth(next.getMonth() + 3)
    setDewormings([
      ...dewormings,
      {
        type: newDewormType,
        date: newDewormDate,
        drugName: newDewormDrug || newDewormType,
        nextDate: next.toISOString().split('T')[0],
      },
    ])
    setNewDewormType('')
    setNewDewormDrug('')
    setNewDewormDate('')
  }

  const removeDeworming = (idx: number) => {
    setDewormings(dewormings.filter((_, i) => i !== idx))
  }

  const addAllergy = () => {
    const t = newAllergy.trim()
    if (!t) return
    if (allergies.includes(t)) return
    setAllergies([...allergies, t])
    setNewAllergy('')
  }

  const removeAllergy = (a: string) => {
    setAllergies(allergies.filter((x) => x !== a))
  }

  const handleSubmit = () => {
    setSubmitError(null)
    if (!canStep(2)) {
      setSubmitError('请完善宠物基本信息后再保存')
      setStep(1)
      return
    }
    if (chipNo && chipNoError) {
      setSubmitError(chipNoError)
      setStep(1)
      return
    }
    try {
      let ownerId: string
      if (ownerMode === 'select') {
        ownerId = existingOwnerId
      } else {
        const newOwner: Owner = {
          id: nextOwnerId,
          name: ownerName.trim(),
          phone: ownerPhone.trim(),
          address: ownerAddress.trim(),
          wechat: ownerWechat.trim() || undefined,
          createdAt: new Date().toISOString().split('T')[0],
        }
        addOwner(newOwner)
        ownerId = newOwner.id
      }

      const newPet: Pet = {
        id: nextPetId,
        name: petName.trim(),
        species,
        breed: breed.trim(),
        gender,
        birthDate,
        weight: parseFloat(weight),
        color: color.trim() || '未知',
        ownerId,
        allergies,
        vaccineRecords: vaccines,
        dewormingRecords: dewormings,
        neutered,
        chipNo: chipNo.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      }

      addPet(newPet)
      addOperationLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: '创建',
        module: '宠物档案',
        detail: `新建宠物档案：${newPet.name}（${nextPetId}），主人：${
          owners.find((o) => o.id === ownerId)?.name ?? ownerName
        }`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: '192.168.1.100',
      })

      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/archives')
      }, 1200)
    } catch (e: any) {
      setSubmitError('保存失败：' + (e?.message ?? '未知错误'))
    }
  }

  const speciesLabel = species === 'dog' ? '犬' : '猫'

  return (
    <div className="page-container max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <PawPrint className="w-7 h-7 text-primary-600" />
          新建宠物档案
        </h1>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const active = idx === step
            const done = idx < step
            return (
              <div
                key={s.key}
                className="flex-1 flex items-center gap-3 px-3"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    active
                      ? 'bg-primary-600 text-white'
                      : done
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-sm font-medium ${
                      active
                        ? 'text-primary-700'
                        : done
                          ? 'text-green-600'
                          : 'text-slate-400'
                    }`}
                  >
                    第 {idx + 1} 步
                  </div>
                  <div
                    className={`text-xs ${
                      active || done ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          档案创建成功，正在返回档案列表...
        </div>
      )}

      <div className="card">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              主人信息
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ownerMode"
                    checked={ownerMode === 'select'}
                    onChange={() => setOwnerMode('select')}
                    className="accent-primary-600"
                  />
                  <span className="text-sm">选择已有主人</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ownerMode"
                    checked={ownerMode === 'new'}
                    onChange={() => setOwnerMode('new')}
                    className="accent-primary-600"
                  />
                  <span className="text-sm">新注册主人</span>
                </label>
              </div>

              {ownerMode === 'select' ? (
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">
                    选择主人
                  </label>
                  <select
                    className="select-field"
                    value={existingOwnerId}
                    onChange={(e) => setExistingOwnerId(e.target.value)}
                  >
                    <option value="">-- 请选择主人 --</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} - {o.phone}
                      </option>
                    ))}
                  </select>
                  {existingOwnerId && (() => {
                    const o = owners.find((x) => x.id === existingOwnerId)
                    if (!o) return null
                    return (
                      <div className="mt-3 p-3 rounded-lg bg-primary-50 border border-primary-100 text-sm space-y-1">
                        <p>
                          <span className="text-slate-500">姓名：</span>
                          <span className="font-medium">{o.name}</span>
                        </p>
                        <p>
                          <span className="text-slate-500">电话：</span>
                          <span className="font-medium">{o.phone}</span>
                        </p>
                        <p>
                          <span className="text-slate-500">地址：</span>
                          <span>{o.address || '未填写'}</span>
                        </p>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">
                      主人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-field"
                      placeholder="请输入主人姓名"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">
                      联系电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-field"
                      placeholder="请输入手机号"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-slate-600 mb-1 block">
                      居住地址
                    </label>
                    <input
                      className="input-field"
                      placeholder="请输入详细地址"
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">
                      微信号
                    </label>
                    <input
                      className="input-field"
                      placeholder="选填"
                      value={ownerWechat}
                      onChange={(e) => setOwnerWechat(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary-600" />
              宠物基础信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  宠物姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="如：旺财"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  物种
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSpecies('dog')}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      species === 'dog'
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary-200'
                    }`}
                  >
                    🐕 犬
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecies('cat')}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      species === 'cat'
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200'
                    }`}
                  >
                    🐱 猫
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  品种 <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field"
                  placeholder={`如：${species === 'dog' ? '金毛' : '英短'}`}
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  性别
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      gender === 'male'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    ♂ 公
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      gender === 'female'
                        ? 'bg-pink-50 border-pink-300 text-pink-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-pink-200'
                    }`}
                  >
                    ♀ 母
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  出生日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={birthDate}
                  max="2026-06-20"
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  体重(kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="如：5.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  毛色
                </label>
                <input
                  className="input-field"
                  placeholder="选填"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  绝育状态
                </label>
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={neutered}
                      onChange={(e) => setNeutered(e.target.checked)}
                      className="w-4 h-4 accent-primary-600"
                    />
                    <span className="text-sm">已绝育</span>
                  </label>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-slate-600 mb-1 block">
                  芯片号
                  {chipNo && !chipNoError && (
                    <span className="ml-2 text-green-600">✓ 可用</span>
                  )}
                </label>
                <div className="relative">
                  <Microchip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className={`input-field pl-9 ${
                      chipNoError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="请输入芯片号（唯一标识）"
                    value={chipNo}
                    onChange={(e) => setChipNo(e.target.value)}
                  />
                </div>
                {chipNoError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {chipNoError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary-600" />
                疫苗接种记录
              </h2>
              {vaccines.length > 0 && (
                <div className="mb-3 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-3 py-2">疫苗种类</th>
                        <th className="px-3 py-2">接种日期</th>
                        <th className="px-3 py-2">有效期至</th>
                        <th className="px-3 py-2">机构</th>
                        <th className="px-3 py-2">状态</th>
                        <th className="px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vaccines.map((v, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2 text-sm">{v.name}</td>
                          <td className="px-3 py-2 text-sm">{v.date}</td>
                          <td className="px-3 py-2 text-sm">{v.expiryDate}</td>
                          <td className="px-3 py-2 text-sm">{v.institution}</td>
                          <td className="px-3 py-2">
                            {v.status === 'valid' && (
                              <span className="status-badge bg-green-100 text-green-700">有效</span>
                            )}
                            {v.status === 'expiring' && (
                              <span className="status-badge bg-yellow-100 text-yellow-700">即将过期</span>
                            )}
                            {v.status === 'expired' && (
                              <span className="status-badge bg-red-100 text-red-700">已过期</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              className="p-1 text-slate-400 hover:text-red-500"
                              onClick={() => removeVaccine(idx)}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-4 gap-3">
                <select
                  className="select-field"
                  value={newVacType}
                  onChange={(e) => setNewVacType(e.target.value)}
                >
                  <option value="">-- 疫苗种类 --</option>
                  {(species === 'dog' ? VACCINE_TYPES_DOG : VACCINE_TYPES_CAT).map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="date"
                  className="input-field"
                  value={newVacDate}
                  onChange={(e) => setNewVacDate(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="接种机构（默认本院）"
                  value={newVacInstitution}
                  onChange={(e) => setNewVacInstitution(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addVaccine}
                  disabled={!newVacType || !newVacDate}
                  className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary-600" />
                驱虫记录
              </h2>
              {dewormings.length > 0 && (
                <div className="mb-3 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-3 py-2">类型</th>
                        <th className="px-3 py-2">药物</th>
                        <th className="px-3 py-2">使用日期</th>
                        <th className="px-3 py-2">下次驱虫</th>
                        <th className="px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dewormings.map((d, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2 text-sm">{d.type}</td>
                          <td className="px-3 py-2 text-sm">{d.drugName}</td>
                          <td className="px-3 py-2 text-sm">{d.date}</td>
                          <td className="px-3 py-2 text-sm">{d.nextDate}</td>
                          <td className="px-3 py-2">
                            <button
                              className="p-1 text-slate-400 hover:text-red-500"
                              onClick={() => removeDeworming(idx)}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-4 gap-3">
                <select
                  className="select-field"
                  value={newDewormType}
                  onChange={(e) => setNewDewormType(e.target.value)}
                >
                  <option value="">-- 驱虫类型 --</option>
                  {DEWORMING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  className="input-field"
                  placeholder="药物名称"
                  value={newDewormDrug}
                  onChange={(e) => setNewDewormDrug(e.target.value)}
                />
                <input
                  type="date"
                  className="input-field"
                  value={newDewormDate}
                  onChange={(e) => setNewDewormDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addDeworming}
                  disabled={!newDewormType || !newDewormDate}
                  className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              过敏史
              <span className="text-xs text-slate-400 font-normal ml-2">
                录入过敏史后，后续诊疗全程会高亮提醒
              </span>
            </h2>
            {allergies.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {a}
                    <button
                      onClick={() => removeAllergy(a)}
                      className="ml-1 hover:text-red-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-4">
                <input
                  className="input-field"
                  placeholder="输入过敏原名称，如：鸡肉、青霉素、花粉等"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAllergy()
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={addAllergy}
                disabled={!newAllergy.trim()}
                className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="font-medium text-slate-700 mb-2 text-sm">常见过敏原（快速添加）</h3>
              <div className="flex flex-wrap gap-2">
                {['鸡肉', '牛肉', '牛奶', '鸡蛋', '青霉素', '花粉', '灰尘螨', '羊肉'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={allergies.includes(s)}
                    onClick={() => {
                      setAllergies([...allergies, s])
                    }}
                    className="px-3 py-1 rounded-full text-xs border border-slate-300 bg-white text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
            {allergies.length === 0 && (
              <p className="mt-4 text-xs text-slate-400 text-center py-3">
                暂无过敏史记录
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          <div className="text-xs text-slate-400">
            第 {step + 1} / {STEPS.length} 步
          </div>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canStep(step + 1)}
              className="btn-primary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              保存档案
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
