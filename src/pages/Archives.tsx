import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { differenceInYears } from 'date-fns'

const PAGE_SIZE = 8

export default function Archives() {
  const { pets, owners, getOwnerById } = useAppStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'dog' | 'cat'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'vaccine_expired' | 'vaccine_expiring' | 'has_allergy'>('all')
  const [page, setPage] = useState(1)

  const getPetStatuses = (pet: typeof pets[0]) => {
    const statuses: string[] = []
    if (pet.vaccineRecords.some(v => v.status === 'expired')) statuses.push('vaccine_expired')
    if (pet.vaccineRecords.some(v => v.status === 'expiring')) statuses.push('vaccine_expiring')
    if (pet.allergies.length > 0) statuses.push('has_allergy')
    return statuses
  }

  const filtered = useMemo(() => {
    return pets.filter(pet => {
      if (search) {
        const q = search.toLowerCase()
        const owner = getOwnerById(pet.ownerId)
        const match =
          pet.name.toLowerCase().includes(q) ||
          pet.breed.toLowerCase().includes(q) ||
          (pet.chipNo?.toLowerCase().includes(q) ?? false) ||
          (owner?.name.toLowerCase().includes(q) ?? false)
        if (!match) return false
      }
      if (speciesFilter !== 'all' && pet.species !== speciesFilter) return false
      if (statusFilter !== 'all') {
        const statuses = getPetStatuses(pet)
        if (!statuses.includes(statusFilter)) return false
      }
      return true
    })
  }, [pets, search, speciesFilter, statusFilter, getOwnerById])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const calcAge = (birthDate: string) => {
    const years = differenceInYears(new Date(), new Date(birthDate))
    return years < 1 ? '不足1岁' : `${years}岁`
  }

  const speciesLabel = (s: 'dog' | 'cat') => (s === 'dog' ? '犬' : '猫')

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">宠物档案管理</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/archives/new')}>
          <Plus size={16} />
          新建档案
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索宠物名称、品种、芯片号、主人..."
              className="input-field pl-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className="select-field w-auto"
            value={speciesFilter}
            onChange={e => { setSpeciesFilter(e.target.value as typeof speciesFilter); setPage(1) }}
          >
            <option value="all">全部物种</option>
            <option value="dog">犬</option>
            <option value="cat">猫</option>
          </select>
          <select
            className="select-field w-auto"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
          >
            <option value="all">全部状态</option>
            <option value="vaccine_expired">疫苗过期</option>
            <option value="vaccine_expiring">疫苗即将过期</option>
            <option value="has_allergy">有过敏史</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3">宠物名称</th>
              <th className="px-4 py-3">芯片号</th>
              <th className="px-4 py-3">品种</th>
              <th className="px-4 py-3">性别</th>
              <th className="px-4 py-3">年龄</th>
              <th className="px-4 py-3">体重</th>
              <th className="px-4 py-3">主人</th>
              <th className="px-4 py-3">状态标签</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map(pet => {
              const owner = getOwnerById(pet.ownerId)
              const statuses = getPetStatuses(pet)
              return (
                <tr key={pet.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/archives/${pet.id}`} className="font-bold text-primary-700 hover:underline">
                      {pet.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{pet.chipNo || '-'}</td>
                  <td className="px-4 py-3 text-sm">{pet.breed}</td>
                  <td className="px-4 py-3 text-sm">
                    {pet.gender === 'male' ? (
                      <span className="text-blue-600 font-medium">♂ 公</span>
                    ) : (
                      <span className="text-pink-500 font-medium">♀ 母</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{calcAge(pet.birthDate)}</td>
                  <td className="px-4 py-3 text-sm">{pet.weight}kg</td>
                  <td className="px-4 py-3 text-sm">{owner?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {statuses.includes('vaccine_expired') && (
                        <span className="status-badge bg-red-100 text-red-700">疫苗过期</span>
                      )}
                      {statuses.includes('vaccine_expiring') && (
                        <span className="status-badge bg-yellow-100 text-yellow-700">疫苗即将过期</span>
                      )}
                      {statuses.includes('has_allergy') && (
                        <span className="status-badge bg-orange-100 text-orange-700">有过敏史</span>
                      )}
                      {statuses.length === 0 && (
                        <span className="status-badge bg-green-100 text-green-700">正常</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/archives/${pet.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800 font-medium"
                    >
                      <Eye size={14} />
                      查看
                    </Link>
                  </td>
                </tr>
              )
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  暂无匹配的宠物档案
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">
            共 {filtered.length} 条记录，第 {currentPage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              上一页
            </button>
            <button
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
