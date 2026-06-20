import { create } from 'zustand'
import { mockPets, mockOwners } from '@/mocks/pets'
import { mockDrugs } from '@/mocks/drugs'
import { mockMedicalRecords, mockAppointments, mockDoctors } from '@/mocks/medical'
import {
  mockInpatientRecords,
  mockBeds,
  mockMembers,
  mockFinanceRecords,
  mockUsers,
  mockDashboardStats,
  mockOperationLogs,
} from '@/mocks/stores'
import type {
  Pet,
  Owner,
  Drug,
  DrugBatch,
  MedicalRecord,
  Appointment,
  Doctor,
  InpatientRecord,
  Bed,
  Member,
  FinanceRecord,
  User,
  DashboardStats,
  OperationLog,
  Recommendation,
  InboundRecord,
  DispenseRecord,
} from '@/types'

const TODAY = new Date('2026-06-20')

function recalcDrugStatus(drug: Drug): Drug['status'] {
  const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0)
  const activeBatches = drug.batches.filter(b => b.quantity > 0)
  if (totalStock === 0) return 'locked'
  const allExpired = activeBatches.every(b => new Date(b.expiryDate) <= TODAY)
  if (allExpired) return 'expired'
  const earliestExpiry = activeBatches
    .map(b => new Date(b.expiryDate).getTime())
    .reduce((min, t) => Math.min(min, t), Infinity)
  const daysLeft = Math.ceil((earliestExpiry - TODAY.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 30) return 'near_expiry'
  if (totalStock < drug.minStock) return 'low_stock'
  return 'normal'
}

function selectBatchesForDispense(
  drug: Drug,
  qty: number
): { batches: { batchId: string; quantity: number }[]; totalAvailable: number } {
  const validBatches = drug.batches
    .filter(b => b.quantity > 0 && new Date(b.expiryDate) > TODAY)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  const totalAvailable = validBatches.reduce((sum, b) => sum + b.quantity, 0)

  if (totalAvailable < qty) {
    return { batches: [], totalAvailable }
  }

  const result: { batchId: string; quantity: number }[] = []
  let remaining = qty

  for (const batch of validBatches) {
    if (remaining <= 0) break
    const take = Math.min(batch.quantity, remaining)
    result.push({ batchId: batch.id, quantity: take })
    remaining -= take
  }

  return { batches: result, totalAvailable }
}

interface AppState {
  pets: Pet[]
  owners: Owner[]
  drugs: Drug[]
  medicalRecords: MedicalRecord[]
  appointments: Appointment[]
  doctors: Doctor[]
  inpatientRecords: InpatientRecord[]
  beds: Bed[]
  members: Member[]
  financeRecords: FinanceRecord[]
  users: User[]
  dashboardStats: DashboardStats
  operationLogs: OperationLog[]
  currentUser: User
  sidebarCollapsed: boolean
  inboundRecords: InboundRecord[]
  dispenseRecords: DispenseRecord[]

  toggleSidebar: () => void
  setCurrentUser: (user: User) => void
  addOwner: (owner: Owner) => void
  addPet: (pet: Pet) => void
  updatePet: (id: string, data: Partial<Pet>) => void
  addMedicalRecord: (record: MedicalRecord) => void
  updateMedicalRecord: (id: string, data: Partial<MedicalRecord>) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  addOperationLog: (log: Omit<OperationLog, 'id'>) => void
  updateDrug: (id: string, data: Partial<Drug>) => void
  inboundDrug: (id: string, quantity: number, batchNo: string, expiryDate: string, supplier: string) => { success: boolean; reason?: string; data?: { stock: number; batchNo: string } }
  dispensePrescription: (recordId: string) => { success: boolean; reason?: string }
  checkPrescription: (recordId: string) => { passed: boolean; warnings: string[]; errors: string[] }
  checkSingleDrug: (drugId: string, qty: number, allergies?: string[]) => { passed: boolean; warnings: string[]; errors: string[] }
  updateBed: (id: string, data: Partial<Bed>) => void
  acknowledgeAlert: (inpId: string, alertIdx: number, handler: string) => void
  updateMember: (id: string, data: Partial<Member>) => void
  updateRecommendation: (memberId: string, recId: string, data: Partial<Recommendation>) => void
  sendRecommendation: (memberId: string, recId: string, channels: ('app' | 'sms' | 'wechat')[]) => void
  dismissRecommendation: (memberId: string, recId: string) => void
  convertRecommendation: (memberId: string, recId: string) => void
  getPetById: (id: string) => Pet | undefined
  getOwnerById: (id: string) => Owner | undefined
  getDoctorById: (id: string) => Doctor | undefined
  getPetsByOwnerId: (id: string) => Pet[]
  getPetsByOwner: (id: string) => Pet[]
  getMedicalRecordsByPetId: (id: string) => MedicalRecord[]
  getMedicalRecordByAppointmentId: (id: string) => MedicalRecord | undefined
  getAppointmentById: (id: string) => Appointment | undefined
  getMemberByOwnerId: (id: string) => Member | undefined
  getMemberById: (id: string) => Member | undefined
  getDispenseRecordsByPetId: (id: string) => DispenseRecord[]
  checkChipNo: (chipNo: string, excludeId?: string) => boolean
  checkPetOwnerConsistency: (params: {
    appointmentId?: string
    recordId?: string
    petId?: string
  }) => {
    valid: boolean
    appointment?: Appointment
    record?: MedicalRecord
    pet?: Pet
    owner?: Owner
    issues: string[]
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  pets: mockPets,
  owners: mockOwners,
  drugs: mockDrugs,
  medicalRecords: mockMedicalRecords,
  appointments: mockAppointments,
  doctors: mockDoctors,
  inpatientRecords: mockInpatientRecords,
  beds: mockBeds,
  members: mockMembers,
  financeRecords: mockFinanceRecords,
  users: mockUsers,
  dashboardStats: mockDashboardStats,
  operationLogs: mockOperationLogs,
  currentUser: mockUsers[0],
  sidebarCollapsed: false,
  inboundRecords: [
    { id: 'ib-001', drugId: 'drug-008', drugName: '芬苯达唑', quantity: 200, batchNo: 'FBD-2025-008', expiryDate: '2027-08-22', supplier: '梅里亚动物保健', operator: '陈伟', timestamp: '2026-06-17 14:30:10' },
    { id: 'ib-002', drugId: 'drug-010', drugName: '美洛昔康', quantity: 50, batchNo: 'MLX-2025-010', expiryDate: '2027-06-01', supplier: '勃林格殷格翰', operator: '陈伟', timestamp: '2026-06-12 10:15:00' },
    { id: 'ib-003', drugId: 'drug-001', drugName: '阿莫西林克拉维酸', quantity: 300, batchNo: 'AMC-2026-101', expiryDate: '2028-01-15', supplier: '拜耳动物保健', operator: '陈伟', timestamp: '2026-06-05 16:20:00' },
  ],
  dispenseRecords: [
    {
      id: 'disp-001',
      recordId: 'mr-001',
      petId: 'pet-001',
      petName: '旺财',
      ownerName: '张伟',
      items: [
        { drugId: 'drug-001', drugName: '阿莫西林克拉维酸', quantity: 14, batchNo: 'AMC-2026-101', unit: '片' },
        { drugId: 'drug-004', drugName: '伊曲康唑', quantity: 7, batchNo: 'YTC-2025-004', unit: '片' },
      ],
      operator: '陈伟',
      timestamp: '2026-06-18 10:15:30',
    },
    {
      id: 'disp-002',
      recordId: 'mr-002',
      petId: 'pet-002',
      petName: '咪咪',
      ownerName: '李娜',
      items: [
        { drugId: 'drug-008', drugName: '芬苯达唑', quantity: 2, batchNo: 'FBD-2025-008', unit: '片' },
      ],
      operator: '陈伟',
      timestamp: '2026-06-19 14:30:00',
    },
  ],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCurrentUser: (user) => set({ currentUser: user }),

  addOwner: (owner) => set((state) => ({ owners: [...state.owners, owner] })),

  addPet: (pet) => set((state) => ({ pets: [...state.pets, pet] })),

  updatePet: (id, data) =>
    set((state) => ({
      pets: state.pets.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  addMedicalRecord: (record) =>
    set((state) => ({ medicalRecords: [...state.medicalRecords, record] })),

  updateMedicalRecord: (id, data) =>
    set((state) => ({
      medicalRecords: state.medicalRecords.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    })),

  updateAppointment: (id, data) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    })),

  addOperationLog: (log) =>
    set((state) => ({
      operationLogs: [
        ...state.operationLogs,
        { ...log, id: `log-${Date.now()}` },
      ],
    })),

  updateDrug: (id, data) =>
    set((state) => ({
      drugs: state.drugs.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),

  inboundDrug: (id, quantity, batchNo, expiryDate, supplier) => {
    const state = get()
    const drug = state.drugs.find((d) => d.id === id)
    if (!drug) return { success: false, reason: '药品不存在' }
    if (!expiryDate || !expiryDate.trim()) return { success: false, reason: '请填写有效期' }
    if (!Number.isInteger(quantity) || quantity <= 0) return { success: false, reason: '入库数量必须为正整数' }
    if (new Date(expiryDate) <= TODAY) return { success: false, reason: '药品已过期，不允许入库' }

    const existingBatch = drug.batches.find((b) => b.batchNo === batchNo)
    let newBatches: DrugBatch[]

    if (existingBatch) {
      newBatches = drug.batches.map((b) =>
        b.batchNo === batchNo
          ? { ...b, quantity: b.quantity + quantity }
          : b
      )
    } else {
      const newBatch: DrugBatch = {
        id: `batch-${id}-${String(drug.batches.length + 1).padStart(3, '0')}`,
        drugId: id,
        batchNo,
        productionDate: new Date().toISOString().slice(0, 10),
        expiryDate,
        quantity,
        receivedDate: new Date().toISOString().slice(0, 10),
        supplier,
      }
      newBatches = [...drug.batches, newBatch]
    }

    const newStock = newBatches.reduce((sum, b) => sum + b.quantity, 0)
    const activeBatches = newBatches.filter((b) => b.quantity > 0)
    const earliestExpiryBatch = activeBatches.reduce((earliest, b) =>
      new Date(b.expiryDate) < new Date(earliest.expiryDate) ? b : earliest
    )
    const newBatchNo = earliestExpiryBatch.batchNo
    const newExpiryDate = earliestExpiryBatch.expiryDate

    const tempDrug = { ...drug, batches: newBatches }
    const newStatus = recalcDrugStatus(tempDrug)

    set((s) => ({
      drugs: s.drugs.map((d) =>
        d.id === id
          ? {
              ...d,
              batches: newBatches,
              stock: newStock,
              status: newStatus,
              batchNo: newBatchNo,
              expiryDate: newExpiryDate,
            }
          : d
      ),
      inboundRecords: [
        {
          id: `ib-${Date.now()}`,
          drugId: id,
          drugName: drug.name,
          quantity,
          batchNo,
          expiryDate,
          supplier,
          operator: s.currentUser.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
        ...s.inboundRecords,
      ],
      operationLogs: [
        {
          id: `log-${Date.now()}`,
          userId: s.currentUser.id,
          userName: s.currentUser.name,
          action: '入库',
          module: '药品管理',
          detail: `${drug.name} 入库 ${quantity} ${drug.unit}，批号 ${batchNo}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          ip: '192.168.1.100',
        },
        ...s.operationLogs,
      ],
    }))
    return { success: true, data: { stock: newStock, batchNo: newBatchNo } }
  },

  checkSingleDrug: (drugId, qty, allergies) => {
    const state = get()
    const drug = state.drugs.find((d) => d.id === drugId)
    if (!drug) return { passed: false, warnings: [], errors: ['药品不存在'] }
    const warnings: string[] = []
    const errors: string[] = []

    const validBatches = drug.batches.filter(
      (b) => b.quantity > 0 && new Date(b.expiryDate) > TODAY
    )
    const totalAvailable = validBatches.reduce((sum, b) => sum + b.quantity, 0)

    if (totalAvailable < qty) {
      errors.push(`药品 ${drug.name} 库存不足（可用${totalAvailable}，需${qty}）`)
    }

    const allExpired = drug.batches.filter((b) => b.quantity > 0).length > 0 && validBatches.length === 0
    if (allExpired) {
      errors.push(`药品 ${drug.name} 已过期`)
    }

    if (validBatches.length > 0) {
      const earliestExpiry = validBatches
        .map((b) => new Date(b.expiryDate).getTime())
        .reduce((min, t) => Math.min(min, t), Infinity)
      const daysLeft = Math.ceil((earliestExpiry - TODAY.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 30) {
        warnings.push(`药品 ${drug.name} 即将过期（${new Date(earliestExpiry).toISOString().slice(0, 10)}）`)
      }
    }

    if (allergies?.length) {
      for (const allergy of allergies) {
        if (drug.name.includes(allergy) || allergy.includes(drug.name)) {
          errors.push(`药品 ${drug.name} 与宠物过敏史冲突（${allergy}）`)
        }
      }
    }

    return { passed: errors.length === 0, warnings, errors }
  },

  checkPrescription: (recordId) => {
    const state = get()
    const record = state.medicalRecords.find((r) => r.id === recordId)
    if (!record) return { passed: false, warnings: [], errors: ['病历不存在'] }
    const pet = state.pets.find((p) => p.id === record.petId)
    const warnings: string[] = []
    const errors: string[] = []

    for (const p of record.prescriptions) {
      const result = state.checkSingleDrug(p.drugId, p.quantity, pet?.allergies)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }
    return { passed: errors.length === 0, warnings, errors }
  },

  dispensePrescription: (recordId) => {
    const state = get()
    const record = state.medicalRecords.find((r) => r.id === recordId)
    if (!record) return { success: false, reason: '病历不存在' }
    if (record.dispensed) return { success: false, reason: '该处方已发药' }
    if (record.prescriptions.length === 0) return { success: false, reason: '该病历没有处方' }

    const check = state.checkPrescription(recordId)
    if (!check.passed) return { success: false, reason: check.errors.join('；') }

    const pet = state.pets.find((p) => p.id === record.petId)
    const owner = state.owners.find((o) => o.id === record.ownerId)

    const dispensePlans: Array<{
      prescription: (typeof record.prescriptions)[0]
      drug: Drug
      plan: { batches: { batchId: string; quantity: number }[]; totalAvailable: number }
    }> = []

    for (const p of record.prescriptions) {
      const drug = state.drugs.find((d) => d.id === p.drugId)!
      const plan = selectBatchesForDispense(drug, p.quantity)
      if (plan.batches.length === 0) {
        return { success: false, reason: `药品 ${p.drugName} 库存不足` }
      }
      dispensePlans.push({ prescription: p, drug, plan })
    }

    const dispenseItems = dispensePlans.map(({ prescription, drug, plan }) => {
      const usedBatches = plan.batches
        .map((b) => {
          const batch = drug.batches.find((db) => db.id === b.batchId)
          return batch?.batchNo ?? ''
        })
        .filter(Boolean)
      const batchNo =
        usedBatches.length > 1
          ? `${usedBatches[0]}...`
          : usedBatches[0] ?? ''
      return {
        drugId: prescription.drugId,
        drugName: prescription.drugName,
        quantity: prescription.quantity,
        batchNo,
        unit: drug.unit,
      }
    })

    set((s) => {
      const newDrugs = s.drugs.map((d) => {
        const dispensePlan = dispensePlans.find((dp) => dp.drug.id === d.id)
        if (!dispensePlan) return d

        let newBatches = [...d.batches]
        for (const batchPlan of dispensePlan.plan.batches) {
          newBatches = newBatches.map((b) =>
            b.id === batchPlan.batchId
              ? { ...b, quantity: b.quantity - batchPlan.quantity }
              : b
          )
        }

        const newStock = newBatches.reduce((sum, b) => sum + b.quantity, 0)
        const activeBatches = newBatches.filter((b) => b.quantity > 0)
        let newBatchNo = d.batchNo
        let newExpiryDate = d.expiryDate
        if (activeBatches.length > 0) {
          const earliestExpiryBatch = activeBatches.reduce((earliest, b) =>
            new Date(b.expiryDate) < new Date(earliest.expiryDate) ? b : earliest
          )
          newBatchNo = earliestExpiryBatch.batchNo
          newExpiryDate = earliestExpiryBatch.expiryDate
        }

        const tempDrug = { ...d, batches: newBatches }
        const newStatus = recalcDrugStatus(tempDrug)

        return {
          ...d,
          batches: newBatches,
          stock: newStock,
          status: newStatus,
          batchNo: newBatchNo,
          expiryDate: newExpiryDate,
        }
      })

      return {
        drugs: newDrugs,
        medicalRecords: s.medicalRecords.map((r) =>
          r.id === recordId ? { ...r, dispensed: true } : r
        ),
        dispenseRecords: [
          {
            id: `disp-${Date.now()}`,
            recordId,
            petId: record.petId,
            petName: pet?.name ?? '',
            ownerName: owner?.name ?? '',
            items: dispenseItems,
            operator: s.currentUser.name,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
          ...s.dispenseRecords,
        ],
        operationLogs: [
          {
            id: `log-${Date.now()}`,
            userId: s.currentUser.id,
            userName: s.currentUser.name,
            action: '发药',
            module: '药房管理',
            detail: `病历 ${recordId} 发药，共 ${record.prescriptions.length} 种药品`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            ip: '192.168.1.100',
          },
          ...s.operationLogs,
        ],
      }
    })
    return { success: true }
  },

  updateBed: (id, data) =>
    set((state) => ({
      beds: state.beds.map((b) => (b.id === id ? { ...b, ...data } : b)),
    })),

  acknowledgeAlert: (inpId, alertIdx, handler) =>
    set((state) => ({
      inpatientRecords: state.inpatientRecords.map((rec) =>
        rec.id === inpId
          ? {
              ...rec,
              dailyNotes: rec.dailyNotes.map((note, idx) =>
                idx === alertIdx ? { ...note, content: `${note.content} [已处理: ${handler}]` } : note
              ),
            }
          : rec
      ),
    })),

  updateMember: (id, data) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),

  updateRecommendation: (memberId, recId, data) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              recommendations: m.recommendations.map((r) =>
                r.id === recId ? { ...r, ...data } : r
              ),
            }
          : m
      ),
    })),

  sendRecommendation: (memberId, recId, channels) =>
    set((state) => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const member = state.members.find((m) => m.id === memberId)
      const rec = member?.recommendations.find((r) => r.id === recId)
      const operationLogs = rec
        ? [
            {
              id: `log-${Date.now()}`,
              userId: state.currentUser.id,
              userName: state.currentUser.name,
              action: '推送',
              module: '会员运营',
              detail: `会员 ${member.id} 推荐【${rec.title}】通过 ${channels.join('/')} 发送`,
              timestamp: now,
              ip: '192.168.1.100',
            },
            ...state.operationLogs,
          ]
        : state.operationLogs
      return {
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                recommendations: m.recommendations.map((r) =>
                  r.id === recId
                    ? {
                        ...r,
                        status: 'sent',
                        sentAt: now,
                        sentChannels: [...new Set([...(r.sentChannels || []), ...channels])],
                        channels: r.channels,
                      }
                    : r
                ),
              }
            : m
        ),
        operationLogs,
      }
    }),

  dismissRecommendation: (memberId, recId) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              recommendations: m.recommendations.map((r) =>
                r.id === recId ? { ...r, status: 'dismissed' } : r
              ),
            }
          : m
      ),
    })),

  convertRecommendation: (memberId, recId) =>
    set((state) => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      return {
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                recommendations: m.recommendations.map((r) =>
                  r.id === recId ? { ...r, status: 'converted', convertedAt: now } : r
                ),
              }
            : m
        ),
      }
    }),

  getPetById: (id) => get().pets.find((p) => p.id === id),

  getOwnerById: (id) => get().owners.find((o) => o.id === id),

  getDoctorById: (id) => get().doctors.find((d) => d.id === id),

  getPetsByOwnerId: (id) => get().pets.filter((p) => p.ownerId === id),
  getPetsByOwner: (id) => get().pets.filter((p) => p.ownerId === id),

  getMedicalRecordsByPetId: (id) =>
    get().medicalRecords.filter((r) => r.petId === id),

  getMedicalRecordByAppointmentId: (id) =>
    get().medicalRecords.find((r) => r.appointmentId === id),

  getAppointmentById: (id) => get().appointments.find((a) => a.id === id),

  getMemberByOwnerId: (id) => get().members.find((m) => m.ownerId === id),

  getMemberById: (id) => get().members.find((m) => m.id === id),

  getDispenseRecordsByPetId: (id) =>
    get().dispenseRecords.filter((r) => r.petId === id),

  checkChipNo: (chipNo, excludeId) => {
    if (!chipNo) return true
    return !get().pets.some(
      (p) => p.chipNo && p.chipNo.toLowerCase() === chipNo.toLowerCase() && p.id !== excludeId
    )
  },

  checkPetOwnerConsistency: (params) => {
    const state = get()
    const { appointmentId, recordId, petId } = params
    const issues: string[] = []

    let appointment: Appointment | undefined
    let record: MedicalRecord | undefined
    let pet: Pet | undefined
    let owner: Owner | undefined

    if (appointmentId) {
      appointment = state.appointments.find((a) => a.id === appointmentId)
    }

    if (recordId) {
      record = state.medicalRecords.find((r) => r.id === recordId)
    } else if (appointment) {
      if (appointment.medicalRecordId) {
        record = state.medicalRecords.find((r) => r.id === appointment!.medicalRecordId)
      }
      if (!record) {
        record = state.medicalRecords.find((r) => r.appointmentId === appointmentId)
      }
    }

    if (petId) {
      pet = state.pets.find((p) => p.id === petId)
    }

    if (appointment && record) {
      if (record.petId !== appointment.petId) {
        issues.push('关联病历的宠物与预约宠物不一致')
      }
      if (record.ownerId !== appointment.ownerId) {
        issues.push('关联病历的主人与预约主人不一致')
      }
    }

    if (petId && appointment) {
      if (appointment.petId !== petId) {
        issues.push(`预约宠物与当前宠物不一致`)
      }
    }

    if (record) {
      owner = state.owners.find((o) => o.id === record.ownerId)
      if (!pet) {
        pet = state.pets.find((p) => p.id === record.petId)
      }
    } else if (appointment) {
      owner = state.owners.find((o) => o.id === appointment.ownerId)
      if (!pet) {
        pet = state.pets.find((p) => p.id === appointment.petId)
      }
    }

    return {
      valid: issues.length === 0,
      appointment,
      record,
      pet,
      owner,
      issues,
    }
  },
}))
