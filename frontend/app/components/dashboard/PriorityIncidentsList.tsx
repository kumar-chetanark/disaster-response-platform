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
              {/* High-Visibility Star Button */}
              <button
                type="button"
                onClick={(e) => handleToggleStar(e, incident.id)}
                className={`px-1.5 py-0.5 rounded border text-[13px] flex items-center gap-1 cursor-pointer transition-all ${
                  starredIds.has(incident.id)
                    ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold shadow-sm'
                    : 'bg-surface-container-highest border-outline-variant text-outline hover:text-amber-300 hover:border-amber-400/50'
                }`}
                title="Star / Favorite incident"
              >
                <span>{starredIds.has(incident.id) ? '★' : '☆'}</span>
                <span className="text-[10px] font-mono-label">{starredIds.has(incident.id) ? 'STARRED' : 'STAR'}</span>
              </button>
              <h3 className="font-body-base text-body-base font-semibold text-on-surface leading-tight truncate">
                {incident.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* High-Visibility Delete Button */}
              {onDeleteIncident && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteIncident(incident.id)
                  }}
                  className="px-2 py-0.5 rounded border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 font-mono-label text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Delete incident"
                >
                  <span>🗑️</span>
                  <span>DELETE</span>
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
