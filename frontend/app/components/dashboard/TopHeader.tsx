'use client'

import React, { useState, useEffect } from 'react'

interface TopHeaderProps {
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onLogout?: () => void
  userRole?: string
}

export default function TopHeader({
  isSidebarCollapsed = false,
  onToggleSidebar,
  onLogout,
  userRole = 'AUTHORITY',
}: TopHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-header-height fixed top-0 left-0 right-0 bg-surface-container border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 z-50">
      {/* Brand, Hamburger Toggle & Node Status */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-colors cursor-pointer mr-1"
            title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-surface shadow-sm">
            <span className="material-symbols-outlined text-[16px]">shield</span>
          </div>
          <span className="font-headline-sm text-[14px] sm:text-[15px] font-bold text-on-surface tracking-tight truncate">
            DISASTER RESPONSE PLATFORM
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 ml-3 font-mono-label text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Operational Node Active</span>
        </div>
      </div>

      {/* Authority Profile, Real-Time Clock & Logout Button */}
      <div className="flex items-center gap-3 sm:gap-4">
        {timeStr && (
          <div className="hidden md:flex flex-col text-right font-mono">
            <span className="text-[12px] text-sky-400 font-bold tracking-wider">
              {timeStr}
            </span>
            <span className="text-[10px] text-slate-400">
              {dateStr}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2.5 pl-3 border-l border-outline-variant">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0369a1] border border-sky-400/40 flex items-center justify-center text-white font-bold text-[12px] shadow-sm">
            CK
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-body-sm text-[12px] font-bold text-on-surface leading-tight">
              Chetan Kumar
            </span>
            <span className="font-mono-label text-[10px] text-emerald-400 font-semibold">
              Authority Level 5
            </span>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white font-mono text-[11px] font-bold uppercase rounded-lg transition-all shadow cursor-pointer ml-1"
            title="Log out of Operational Authority Session"
          >
            <span className="material-symbols-outlined text-[16px] text-red-400">logout</span>
            <span className="hidden sm:inline">LOG OUT</span>
          </button>
        )}
      </div>
    </header>
  )
}
