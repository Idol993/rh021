import { useLocation } from 'react-router-dom'
import { Search, Bell, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

const routeTitles: Record<string, string> = {
  '/dashboard': '运营大屏',
  '/archives': '宠物档案',
  '/diagnosis': '诊疗工作台',
  '/pharmacy': '药房管理',
  '/inpatient': '住院监护',
  '/membership': '会员运营',
  '/finance': '财务报表',
  '/settings': '系统设置',
}

const roleLabels: Record<string, string> = {
  admin: '管理员',
  doctor: '医生',
  nurse: '护士',
  receptionist: '前台',
  pharmacist: '药剂师',
}

export default function Header() {
  const location = useLocation()
  const currentUser = useAppStore((s) => s.currentUser)

  const title = routeTitles[location.pathname] || '宠物医院管理系统'

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="text-lg font-semibold text-slate-800">{title}</div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索宠物、主人、病例..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-primary-300 transition-shadow"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 leading-tight">{currentUser.name}</span>
            <span className="text-xs text-slate-400 leading-tight">
              {roleLabels[currentUser.role] || currentUser.role}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  )
}
