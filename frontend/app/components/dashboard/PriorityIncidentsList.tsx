'use client'

import React from 'react'
import { PriorityIncident } from '../../types'

interface PriorityIncidentsListProps {
  incidents: PriorityIncident[]
  selectedIncidentId: string | null
  onSelectIncident: (id: string) => void
}

export default function PriorityIncidentsList({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}: PriorityIncidentsListProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col h-[260px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant mb-2.5 shrink-0">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 font-semibold text-[14px]">
          <span className="material-symbols-outlined text-primary text-[18px]">list_alt</span>
          Priority Incidents
        </h3>
        <span className="font-mono-label text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
          {incidents.length} active
        </span>
      </div>

      {/* Scrollable Container with custom scrollbar */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1.5 scrollbar-thin">
        {incidents.map((incident) => {
          const isSelected = selectedIncidentId === incident.id
          return (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident.id)}
              className={`flex justify-between items-center p-2.5 border rounded transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface-container-highest border-primary shadow-sm'
                  : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-body-sm font-semibold text-on-surface text-[13px] truncate">
                  {incident.title}
                </div>
                <div className="font-mono-label text-[11px] text-on-surface-variant truncate">
                  {incident.location} • {incident.impact}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`font-status-badge text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-error/15 text-error border-error/30'
                      : incident.severity === 'HIGH'
                      ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                      : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  {incident.severity}
                </span>
                <span className="font-mono-label text-[9px] text-on-surface-variant">
                  {incident.timeReported}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
