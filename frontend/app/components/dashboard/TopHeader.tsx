'use client'

import React from 'react'

interface TopHeaderProps {
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export default function TopHeader({
  isSidebarCollapsed = false,
  onToggleSidebar,
}: TopHeaderProps) {
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

      {/* Authority Profile & Timestamp */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="font-mono-label text-[11px] text-primary font-bold">
            10:42:15 ZULU
          </span>
          <span className="font-body-sm text-[10px] text-on-surface-variant">
            Sector 7 Command Hub
          </span>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-outline-variant">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-primary/40 flex items-center justify-center text-primary font-bold text-[12px]">
            JV
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-body-sm text-[12px] font-bold text-on-surface leading-tight">
              Cmdr. J. Vance
            </span>
            <span className="font-mono-label text-[10px] text-emerald-400">
              Authority Level 5
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
