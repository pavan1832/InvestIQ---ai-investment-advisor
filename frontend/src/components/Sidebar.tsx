import { NavLink, useNavigate } from 'react-router-dom'
import { TrendingUp, LayoutDashboard, Upload, Lightbulb, History, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',    icon: Upload,          label: 'Upload Portfolio' },
  { to: '/insights',  icon: Lightbulb,       label: 'AI Insights' },
  { to: '/history',   icon: History,         label: 'History' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-64 min-h-screen bg-surface-card border-r border-surface-border flex flex-col py-6 px-4 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-display text-xl text-white">Vestara</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-border'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-surface-border pt-4 mt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 bg-brand-600/30 rounded-lg flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-100 font-medium truncate">{user?.full_name || 'Investor'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
