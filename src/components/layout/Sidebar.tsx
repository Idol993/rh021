import { NavLink } from 'react-router-dom'
import {
  PawPrint,
  LayoutDashboard,
  FolderOpen,
  Stethoscope,
  Pill,
  BedDouble,
  Crown,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { Drug, InpatientRecord } from '@/types'

const navItems = [
  { path: '/dashboard', label: '运营大屏', icon: LayoutDashboard },
  { path: '/archives', label: '宠物档案', icon: FolderOpen },
  { path: '/diagnosis', label: '诊疗工作台', icon: Stethoscope },
  { path: '/pharmacy', label: '药房管理', icon: Pill, badge: 'drug' as const },
  { path: '/inpatient', label: '住院监护', icon: BedDouble, badge: 'inpatient' as const },
  { path: '/membership', label: '会员运营', icon: Crown },
  { path: '/finance', label: '财务报表', icon: BarChart3 },
  { path: '/settings', label: '系统设置', icon: Settings },
]

export default function Sidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const drugs = useAppStore((s) => s.drugs)
  const inpatientRecords = useAppStore((s) => s.inpatientRecords)
  const drugAlertCount = drugs.filter((d: Drug) => d.status !== 'normal').length
  const inpatientCount = inpatientRecords.filter((r: InpatientRecord) => r.status === 'admitted').length

  return (
    <aside
      className="h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300"
      style={{ width: sidebarCollapsed ? 64 : 256 }}
    >
      <div className="h-16 flex items-center px-4 gap-3 shrink-0">
        <PawPrint className="w-8 h-8 text-primary-700 shrink-0" />
        {!sidebarCollapsed && (
          <span className="font-serif font-bold text-xl text-primary-700 whitespace-nowrap">
            PetCare Pro
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${isActive ? 'nav-item-active' : 'nav-item'} flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors relative`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
            {item.badge === 'drug' && drugAlertCount > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {drugAlertCount}
              </span>
            )}
            {item.badge === 'inpatient' && inpatientCount > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {inpatientCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 p-2 border-t border-slate-200">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          )}
        </button>
      </div>
    </aside>
  )
}
