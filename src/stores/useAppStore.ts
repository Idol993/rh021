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
} from '@/types'

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

  toggleSidebar: () => void
  setCurrentUser: (user: User) => void
  addPet: (pet: Pet) => void
  updatePet: (id: string, data: Partial<Pet>) => void
  addMedicalRecord: (record: MedicalRecord) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  addOperationLog: (log: Omit<OperationLog, 'id'>) => void
  updateDrug: (id: string, data: Partial<Drug>) => void
  updateBed: (id: string, data: Partial<Bed>) => void
  acknowledgeAlert: (inpId: string, alertIdx: number, handler: string) => void
  updateMember: (id: string, data: Partial<Member>) => void
  getPetById: (id: string) => Pet | undefined
  getOwnerById: (id: string) => Owner | undefined
  getDoctorById: (id: string) => Doctor | undefined
  getPetsByOwnerId: (id: string) => Pet[]
  getMedicalRecordsByPetId: (id: string) => MedicalRecord[]
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

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCurrentUser: (user) => set({ currentUser: user }),

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

  getPetById: (id) => get().pets.find((p) => p.id === id),

  getOwnerById: (id) => get().owners.find((o) => o.id === id),

  getDoctorById: (id) => get().doctors.find((d) => d.id === id),

  getPetsByOwnerId: (id) => get().pets.filter((p) => p.ownerId === id),

  getMedicalRecordsByPetId: (id) =>
    get().medicalRecords.filter((r) => r.petId === id),
}))
