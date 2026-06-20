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
  institution?: string
}

export interface DewormingRecord {
  type: string
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

export interface DrugBatch {
  id: string
  drugId: string
  batchNo: string
  productionDate: string
  expiryDate: string
  quantity: number
  receivedDate: string
  supplier?: string
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
  status: 'normal' | 'low_stock' | 'near_expiry' | 'expired' | 'locked'
  storageCondition: string
  batches: DrugBatch[]
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
  unit?: string
}

export interface MedicalRecord {
  id: string
  petId: string
  ownerId: string
  doctorId: string
  appointmentId?: string
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
  dispensed?: boolean
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
  medicalRecordId?: string
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
  memberNo: string
  level: '普通会员' | '银卡会员' | '金卡会员' | '钻石会员'
  tier: 'new' | 'silver' | 'gold' | 'platinum'
  points: number
  balance: number
  joinDate: string
  expiryDate: string
  discount: number
  totalSpent: number
  recommendations: Recommendation[]
}

export interface InboundRecord {
  id: string
  drugId: string
  drugName: string
  quantity: number
  batchNo: string
  expiryDate: string
  supplier?: string
  operator?: string
  timestamp: string
}

export interface DispenseRecord {
  id: string
  recordId: string
  petId: string
  petName: string
  ownerName: string
  items: {
    drugId: string
    drugName: string
    quantity: number
    batchNo: string
    unit: string
  }[]
  operator: string
  timestamp: string
}

export interface Recommendation {
  id: string
  memberId: string
  type: 'vaccine' | 'deworming' | 'rehab' | 'package' | 'insurance' | 'supplement'
  title: string
  description: string
  reason: string
  petId?: string
  petName?: string
  status: 'pending' | 'sent' | 'converted' | 'dismissed'
  channels: ('app' | 'sms' | 'wechat')[]
  sentChannels: ('app' | 'sms' | 'wechat')[]
  sentAt?: string
  convertedAt?: string
  createdAt: string
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
