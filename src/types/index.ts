export interface Owner {
  id: string
  name: string
  phone: string
  address: string
  wechat?: string
  createdAt: string
}

export interface VaccineRecord {
  name: string
  date: string
  expiryDate: string
  batchNo: string
  status: 'valid' | 'expiring' | 'expired'
}

export interface DewormingRecord {
  date: string
  drugName: string
  nextDate: string
}

export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat'
  breed: string
  gender: 'male' | 'female'
  birthDate: string
  weight: number
  color: string
  ownerId: string
  allergies: string[]
  vaccineRecords: VaccineRecord[]
  dewormingRecords: DewormingRecord[]
  neutered: boolean
  chipNo?: string
  createdAt: string
}

export interface Drug {
  id: string
  name: string
  category: 'antibiotic' | 'antifungal' | 'antiparasitic' | 'analgesic' | 'antiemetic' | 'gastrointestinal' | 'corticosteroid' | 'antihistamine' | 'sedative' | 'nutritional'
  specification: string
  unit: string
  price: number
  stock: number
  minStock: number
  manufacturer: string
  batchNo: string
  productionDate: string
  expiryDate: string
  status: 'normal' | 'low_stock' | 'near_expiry' | 'expired'
  storageCondition: string
}

export interface PrescriptionItem {
  drugId: string
  drugName: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
}

export interface ExamResult {
  item: string
  result: string
  reference: string
  abnormal: boolean
}

export interface MedicalRecord {
  id: string
  petId: string
  ownerId: string
  doctorId: string
  date: string
  chiefComplaint: string
  presentIllness: string
  temperature: number
  heartRate: number
  weight: number
  diagnosis: string
  prescriptions: PrescriptionItem[]
  examResults: ExamResult[]
  treatmentPlan: string
  followUpDate: string
  status: 'completed' | 'follow_up' | 'hospitalized'
}

export interface Appointment {
  id: string
  petId: string
  ownerId: string
  doctorId: string
  date: string
  time: string
  type: '初诊' | '复诊' | '疫苗接种' | '驱虫' | '体检' | '手术'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface Doctor {
  id: string
  name: string
  title: string
  specialty: string
  phone: string
  avatar?: string
  schedule: string[]
}

export interface InpatientRecord {
  id: string
  petId: string
  ownerId: string
  bedId: string
  doctorId: string
  admitDate: string
  expectedDischargeDate: string
  actualDischargeDate?: string
  diagnosis: string
  treatmentPlan: string
  dailyNotes: { date: string; content: string }[]
  status: 'admitted' | 'discharged' | 'transferred'
}

export interface Bed {
  id: string
  number: string
  ward: string
  type: '普通' | '重症' | '隔离' | '产房'
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  currentPetId?: string
  dailyRate: number
}

export interface Member {
  id: string
  ownerId: string
  level: '普通会员' | '银卡会员' | '金卡会员' | '钻石会员'
  points: number
  balance: number
  joinDate: string
  expiryDate: string
  discount: number
  totalSpent: number
  recommendations: string[]
}

export interface FinanceRecord {
  date: string
  income: number
  expense: number
  details: { category: string; amount: number }[]
}

export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist'
  phone: string
  email: string
  status: 'active' | 'inactive'
  lastLogin: string
}

export interface DashboardStats {
  totalPets: number
  totalOwners: number
  todayAppointments: number
  inpatients: number
  monthlyIncome: number
  monthlyExpense: number
  drugAlertCount: number
  vaccineExpiringCount: number
  bedOccupancyRate: number
  memberCount: number
}

export interface OperationLog {
  id: string
  userId: string
  userName: string
  action: string
  module: string
  detail: string
  timestamp: string
  ip: string
}
