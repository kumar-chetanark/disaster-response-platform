'use client'

import React from 'react'
import { ActiveAlert } from '../../types'

interface ActiveAlertsTickerProps {
  alerts: ActiveAlert[]
}

export default function ActiveAlertsTicker({ alerts }: ActiveAlertsTickerProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col h-[260px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant mb-2.5 shrink-0">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 font-semibold text-[14px]">
          <span className="material-symbols-outlined text-tertiary text-[18px]">campaign</span>
          Active Alerts
        </h3>
        <span className="flex items-center gap-1.5 font-mono-label text-[11px] text-emerald-500 uppercase bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Stream
        </span>
      </div>

      {/* Scrollable Container with custom scrollbar */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1.5 scrollbar-thin">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-2.5 bg-surface-container-low border border-outline-variant rounded flex flex-col gap-1 hover:border-outline transition-colors"
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-mono-label text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                  alert.category === 'INFRASTRUCTURE'
                    ? 'text-error bg-error/10 border border-error/20'
                    : alert.category === 'CIVIL'
                    ? 'text-tertiary bg-tertiary/10 border border-tertiary/20'
                    : alert.category === 'MEDICAL'
                    ? 'text-pink-400 bg-pink-950/20 border border-pink-500/30'
                    : 'text-primary bg-primary/10 border border-primary/20'
                }`}
              >
                {alert.category}
              </span>
              <span className="font-mono-label text-[10px] text-on-surface-variant">{alert.time}</span>
            </div>
            <p className="font-body-sm text-[12px] text-on-surface leading-snug">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
