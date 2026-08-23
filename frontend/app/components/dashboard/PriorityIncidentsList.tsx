'use client'

import React, { useState, useEffect } from 'react'
import { Incident } from '../../types'
import { platformDataService } from '../../services/dataService'

interface PriorityIncidentsListProps {
  incidents: Incident[]
  onSelectIncident?: (id: string) => void
  onDeleteIncident?: (id: string) => void
}

export default function PriorityIncidentsList({
  incidents,
  onSelectIncident,
  onDeleteIncident,
}: PriorityIncidentsListProps) {
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setStarredIds(platformDataService.getStarredIds('incident'))
  }, [])

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    platformDataService.toggleStar('incident', id)
    setStarredIds(new Set(platformDataService.getStarredIds('incident')))
  }

  const getSeverityBadgeStyle = (severity: string) => {
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

  if (incidents.length === 0) {
    return (
      <div className="bg-surface-container rounded-lg border border-outline-variant p-6 text-center text-on-surface-variant font-mono-label text-[12px]">
        No active incidents reported in central disaster registry.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {incidents.slice(0, 6).map((incident) => (
        <div
          key={incident.id}
          onClick={() => onSelectIncident && onSelectIncident(incident.id)}
          className="bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-outline rounded-lg p-4 transition-all cursor-pointer space-y-2.5 shadow-sm relative group"
        >
          {/* Header: Star + Title + Actions + Severity */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* Star Button */}
              <button
                type="button"
                onClick={(e) => handleToggleStar(e, incident.id)}
                className="p-0.5 rounded text-outline hover:text-amber-400 transition-colors"
                title="Star / Favorite incident"
              >
                <span className={`material-symbols-outlined text-[18px] ${starredIds.has(incident.id) ? 'text-amber-400 fill-current' : ''}`}>
                  {starredIds.has(incident.id) ? 'star' : 'star_border'}
                </span>
              </button>
              <h3 className="font-body-base text-body-base font-semibold text-on-surface leading-tight truncate">
                {incident.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Delete Button */}
              {onDeleteIncident && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteIncident(incident.id)
                  }}
                  className="p-1 rounded text-outline hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Delete incident"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
              <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 border ${getSeverityBadgeStyle(incident.severity)}`}>
                {incident.severity}
              </span>
            </div>
          </div>

          {/* Details Bar */}
          <div className="flex items-center justify-between font-mono-label text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/60">
            <span className="truncate max-w-[200px]">📍 {incident.location}</span>
            <span>Status: <strong className="text-primary">{incident.status}</strong></span>
          </div>
        </div>
      ))}
    </div>
  )
}
