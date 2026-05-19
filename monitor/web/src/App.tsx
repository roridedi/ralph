import { NavLink, Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from './api/client'
import { useWebSocket } from './api/useWebSocket'
import { Dashboard } from './pages/Dashboard'
import { Stories } from './pages/Stories'
import { ConsolePage } from './pages/Console'
import { History } from './pages/History'
import { Settings } from './pages/Settings'

const navItems = [
  ['/', 'Dashboard'],
  ['/stories', 'Stories'],
  ['/console', 'Console'],
  ['/history', 'History'],
  ['/settings', 'Settings'],
] as const

export default function App() {
  useWebSocket()

  useQuery({ queryKey: queryKeys.prd, queryFn: api.getPrd })
  useQuery({ queryKey: queryKeys.progress, queryFn: api.getProgress })
  useQuery({ queryKey: queryKeys.runStatus, queryFn: api.getRunStatus })
  useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings })
  useQuery({ queryKey: queryKeys.archive, queryFn: api.getArchive })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Ralph Monitor</h1>
            <p className="text-sm text-slate-400">Local-only monitoring and management for Ralph runs</p>
          </div>
          <nav className="flex gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {navItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/console" element={<ConsolePage />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
