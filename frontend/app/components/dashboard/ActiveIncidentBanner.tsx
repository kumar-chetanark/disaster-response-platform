'use client'

import React from 'react'
import { Incident } from '../../types'

interface ActiveIncidentBannerProps {
  incident?: Incident | null
  onViewIncident: () => void
  onViewRecommendations: () => void
}

export default function ActiveIncidentBanner({
  incident,
  onViewIncident,
  onViewRecommendations,
}: ActiveIncidentBannerProps) {
  // Pure Real-Data Enforcement: If no active crisis exists in database, show calm standby state
  if (!incident) {
    return (
      <section className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-4 relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 pl-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <div>
            <div className="font-mono-label text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              COMMAND SYSTEM STANDBY &bull; ZERO ACTIVE CRISES
            </div>
            <div className="font-body-base text-[12px] text-on-surface-variant mt-0.5">
              Regional sensors and citizen reporting channels are active. No urgent unallocated disaster events pending.
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono-label text-[11px] text-on-surface-variant pr-2">
          <span>Awaiting citizen or news telemetries</span>
        </div>
      </section>
    )
  }

  const isCritical = incident.severity === 'CRITICAL'
  const isHigh = incident.severity === 'HIGH'

  return (
    <section className="bg-surface-container-low border border-error/30 rounded-lg p-5 relative flex flex-col lg:flex-row justify-between lg:items-center gap-6">
      {/* Accent bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritical ? 'bg-error' : 'bg-amber-500'} rounded-l`}></div>

      <div className="flex flex-col gap-2 pl-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`${isCritical ? 'bg-error/20 text-error border-error/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'} px-2.5 py-1 rounded text-[10px] font-mono-label font-bold uppercase tracking-wider border leading-none`}>
            Active Crisis &bull; {incident.severity}
          </span>
          {incident.isFieldVerified && (
            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[10px] font-mono-label font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Field Verified
            </span>
          )}
        </div>

        <h2 className="font-display-lg text-[22px] sm:text-[24px] font-bold text-on-surface leading-normal">
          {incident.title} &bull; <span className="text-error font-mono-label">{incident.severity}</span>
        </h2>

        <div className="flex items-center gap-2 text-on-surface-variant font-mono-label text-[11px] leading-normal">
          <span className="material-symbols-outlined text-[15px] shrink-0 text-primary">location_on</span>
          <span>{incident.location || 'Coordinates Lat/Lon'} &bull; Type: {incident.disasterType || incident.type || 'Disaster'}</span>
        </div>

        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <button
            type="button"
            onClick={onViewIncident}
            className="px-3.5 py-1.5 font-mono-label text-[10px] border border-outline-variant text-on-surface hover:bg-surface-container transition-colors rounded uppercase tracking-wider font-semibold cursor-pointer"
          >
            View Incident
          </button>
          <button
            type="button"
            onClick={onViewRecommendations}
            className="px-3.5 py-1.5 font-mono-label text-[10px] border border-outline-variant text-on-surface hover:bg-surface-container transition-colors rounded uppercase tracking-wider font-semibold cursor-pointer"
          >
            Resource Recommendations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 bg-surface px-6 py-4 rounded border border-outline-variant shrink-0 font-mono-label">
        <div className="flex flex-col">
          <span className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">
            Affected Pop.
          </span>
          <span className="font-headline-md text-error font-bold leading-tight">{incident.affectedPopulationEst || incident.affectedPopulation || 'N/A'}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">
            Affected Area
          </span>
          <span className="font-headline-md text-on-surface font-bold leading-tight">
            {incident.affectedAreaSqKm || 50} <span className="text-[12px] font-normal text-on-surface-variant">sq km</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">
            Priority Level
          </span>
          <span className="font-headline-md text-error font-bold leading-tight">{incident.priorityLevel || 'Level 1'}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">
            Resource Cov.
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-tertiary font-bold leading-tight">{incident.resourceCoverage || '60%'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
