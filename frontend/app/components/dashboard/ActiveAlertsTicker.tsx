'use client'

import React, { useState, useEffect } from 'react'
import { ActiveAlert } from '../../types'
import { platformDataService } from '../../services/dataService'

interface ActiveAlertsTickerProps {
  alerts: ActiveAlert[]
  onSelectAlert?: (id: string) => void
  onDeleteAlert?: (id: string) => void
  onNavigateToAlerts?: () => void
}

export default function ActiveAlertsTicker({
  alerts,
  onSelectAlert,
  onDeleteAlert,
  onNavigateToAlerts,
}: ActiveAlertsTickerProps) {
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setStarredIds(platformDataService.getStarredIds('alert'))
  }, [])

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    platformDataService.toggleStar('alert', id)
    setStarredIds(new Set(platformDataService.getStarredIds('alert')))
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-error/20 text-error border-error/30'
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant'
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col h-[260px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant mb-2.5 shrink-0">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">
            campaign
          </span>
          Active Alerts Stream
        </h3>
        {onNavigateToAlerts && (
          <button
            type="button"
            onClick={onNavigateToAlerts}
            className="font-mono-label text-[10px] text-primary hover:underline uppercase font-bold"
          >
            View All ({alerts.length}) →
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-thin">
        {alerts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center font-mono-label text-[11px] text-on-surface-variant">
            No active alerts across response network.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onSelectAlert && onSelectAlert(alert.id)}
              className="p-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded transition-colors text-left flex flex-col gap-1.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(e, alert.id)}
                    className="p-0.5 rounded text-outline hover:text-amber-400 transition-colors"
                    title="Star / Favorite alert"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${starredIds.has(alert.id) ? 'text-amber-400 fill-current' : ''}`}>
                      {starredIds.has(alert.id) ? 'star' : 'star_border'}
                    </span>
                  </button>
                  <span className="font-mono-label text-[11px] font-bold text-primary truncate">
                    {alert.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onDeleteAlert && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteAlert(alert.id)
                      }}
                      className="p-0.5 rounded text-outline hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete alert"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  )}
                  <span className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${getSeverityStyle(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              </div>

              <p className="font-body-sm text-[12px] text-on-surface line-clamp-1">
                {alert.message}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono-label text-outline">
                <span className="truncate max-w-[160px]">📍 {alert.location || 'General Sector'}</span>
                <span>{alert.time || alert.alertTime || 'Just now'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
