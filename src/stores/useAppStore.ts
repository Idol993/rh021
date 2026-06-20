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
} from '@/types'

interface InboundRecord {
  id: string
  drugId: string
  drugName: string
  quantity: number
  batchNo: string
  expiryDate: string
  supplier: string
  operator: string
  timestamp: string
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

  toggleSidebar: () => void
  setCurrentUser: (user: User) => void
  addOwner: (owner: Owner) => void
  addPet: (pet: Pet) => void
  updatePet: (id: string, data: Partial<Pet>) => void
  addMedicalRecord: (record: MedicalRecord) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  addOperationLog: (log: Omit<OperationLog, 'id'>) => void
  updateDrug: (id: string, data: Partial<Drug>) => void
  inboundDrug: (id: string, quantity: number, batchNo: string, expiryDate: string, supplier: string) => { success: boolean; reason?: string; data?: { stock: number; batchNo: string } }
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
  getAppointmentById: (id: string) => Appointment | undefined
  getMemberByOwnerId: (id: string) => Member | undefined
  getMemberById: (id: string) => Member | undefined
  checkChipNo: (chipNo: string, excludeId?: string) => boolean
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
    if (quantity <= 0) return { success: false, reason: '入库数量必须为正数' }
    const today = new Date('2026-06-20')
    if (new Date(expiryDate) <= today) return { success: false, reason: '药品已过期，不允许入库' }
    const newStock = drug.stock + quantity
    let newStatus: Drug['status'] = drug.status
    if (newStatus === 'expired') newStatus = 'expired'
    else if (newStock < drug.minStock) newStatus = 'low_stock'
    else if (drug.status === 'expired') newStatus = 'expired'
    else {
      const daysLeft = Math.ceil((new Date(expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 30) newStatus = 'near_expiry'
      else newStatus = 'normal'
    }
    set((s) => ({
      drugs: s.drugs.map((d) =>
        d.id === id
          ? { ...d, stock: newStock, status: newStatus, expiryDate, batchNo }
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
    return { success: true, data: { stock: newStock, batchNo } }
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

  getAppointmentById: (id) => get().appointments.find((a) => a.id === id),

  getMemberByOwnerId: (id) => get().members.find((m) => m.ownerId === id),

  getMemberById: (id) => get().members.find((m) => m.id === id),

  checkChipNo: (chipNo, excludeId) => {
    if (!chipNo) return true
    return !get().pets.some(
      (p) => p.chipNo && p.chipNo.toLowerCase() === chipNo.toLowerCase() && p.id !== excludeId
    )
  },
}))
