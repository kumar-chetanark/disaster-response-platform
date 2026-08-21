'use client'

import React from 'react'

export default function TopHeader() {
  return (
    <header className="h-header-height w-full bg-surface-container border-b border-outline-variant fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-surface text-[16px]">radar</span>
          </div>
          <h1 className="font-headline-sm text-[15px] font-bold text-on-surface tracking-tight">
            Disaster Response Platform
          </h1>
        </div>

        <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>

        <div className="hidden sm:flex items-center gap-4 font-mono-label text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="uppercase tracking-wider text-emerald-400">System Live</span>
          </div>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">sync</span>
            <span>Last Sync: 10s ago</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right mr-2 hidden md:block">
          <div className="font-body-sm text-on-surface font-medium leading-tight">Cmdr. J. Vance</div>
          <div className="text-[11px] text-on-surface-variant font-mono-label uppercase tracking-wider">
            Authority Level 5
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[18px]">shield_person</span>
        </div>
      </div>
    </header>
  )
}
