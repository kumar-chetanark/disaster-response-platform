'use client'

import React from 'react'

interface ActiveIncidentBannerProps {
  onViewIncident: () => void
  onViewRecommendations: () => void
  affectedPop?: string
  priorityLevel?: string
  resourceCoverage?: string
  isReassessed?: boolean
}

export default function ActiveIncidentBanner({
  onViewIncident,
  onViewRecommendations,
  affectedPop = '2.4M',
  priorityLevel = 'Level 1',
  resourceCoverage = '84%',
  isReassessed = false,
}: ActiveIncidentBannerProps) {
  return (
    <section className="bg-surface-container-low border border-error/30 rounded-lg p-5 relative flex flex-col lg:flex-row justify-between lg:items-center gap-6">
      {/* Red vertical accent bar on left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-error rounded-l"></div>

      <div className="flex flex-col gap-2 pl-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-error/20 text-error px-2.5 py-1 rounded text-[10px] font-mono-label font-bold uppercase tracking-wider border border-error/30 leading-none">
            Active Crisis
          </span>
          {isReassessed && (
            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[10px] font-mono-label font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Field Verified
            </span>
          )}
        </div>

        <h2 className="font-display-lg text-[22px] sm:text-[24px] font-bold text-on-surface leading-normal">
          Cyclone Alpha 4 — <span className="text-error font-mono-label">CRITICAL</span>
        </h2>

        <div className="flex items-center gap-2 text-on-surface-variant font-mono-label text-[11px] leading-normal">
          <span className="material-symbols-outlined text-[15px] shrink-0">location_on</span>
          <span>Sector 7G, Coastal Region</span>
        </div>

        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <button
            type="button"
            onClick={onViewIncident}
            className="px-3.5 py-1.5 font-mono-label text-[10px] border border-outline-variant text-on-surface hover:bg-surface-container transition-colors rounded uppercase tracking-wider font-semibold"
          >
            View Incident
          </button>
          <button
            type="button"
            onClick={onViewRecommendations}
            className="px-3.5 py-1.5 font-mono-label text-[10px] border border-outline-variant text-on-surface hover:bg-surface-container transition-colors rounded uppercase tracking-wider font-semibold"
          >
            Resource Recommendations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 bg-surface px-6 py-4 rounded border border-outline-variant shrink-0">
        <div className="flex flex-col">
          <span className="text-on-surface-variant font-mono-label text-[10px] uppercase tracking-wider mb-1">
            Affected Pop.
          </span>
          <span className="font-headline-md text-error font-bold leading-tight">{affectedPop}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-on-surface-variant font-mono-label text-[10px] uppercase tracking-wider mb-1">
            Affected Area
          </span>
          <span className="font-headline-md text-on-surface font-bold leading-tight">
            1,420 <span className="text-[12px] font-normal text-on-surface-variant">sq km</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-on-surface-variant font-mono-label text-[10px] uppercase tracking-wider mb-1">
            Priority Level
          </span>
          <span className="font-headline-md text-error font-bold leading-tight">{priorityLevel}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-on-surface-variant font-mono-label text-[10px] uppercase tracking-wider mb-1">
            Resource Cov.
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-tertiary font-bold leading-tight">{resourceCoverage}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
