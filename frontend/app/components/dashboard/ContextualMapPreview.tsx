'use client'

import React from 'react'

export default function ContextualMapPreview() {
  return (
    <div className="bg-surface border border-outline-variant rounded-lg flex flex-col overflow-hidden relative h-64">
      <div className="absolute top-2 left-2 z-10 bg-surface/90 border border-outline-variant px-2 py-1 rounded backdrop-blur text-[10px] font-mono-label text-on-surface flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        Incident Map - Overview
      </div>

      <div className="flex-1 w-full bg-surface-container-lowest relative map-grid flex items-center justify-center overflow-hidden">
        {/* SVG Coastline & Sector contour overlay */}
        <svg
          viewBox="0 0 400 200"
          className="w-full h-full object-cover opacity-40 text-outline"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M 0,130 Q 80,110 140,140 T 260,100 T 400,120 L 400,200 L 0,200 Z" fill="#131b2e" />
          <path d="M 0,130 Q 80,110 140,140 T 260,100 T 400,120" stroke="#38bdf8" strokeDasharray="3 3" />
        </svg>

        {/* Shaded Hazard Polygon */}
        <div
          style={{ top: '35%', left: '25%', width: '130px', height: '75px' }}
          className="absolute bg-error/15 border border-dashed border-error/50 rounded-lg flex items-center justify-center"
        >
          <span className="font-mono-label text-[9px] text-error font-bold tracking-wider">SECTOR 7E (SURGE)</span>
        </div>

        {/* Map blips */}
        <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_8px_rgba(255,180,171,0.6)]"></div>
        <div className="absolute top-[60%] left-[60%] w-2.5 h-2.5 bg-tertiary rounded-full shadow-[0_0_6px_rgba(255,183,134,0.6)]"></div>
        <div className="absolute top-[30%] left-[72%] w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_6px_rgba(234,179,8,0.6)]"></div>

        <div className="absolute bottom-2 right-2 text-[9px] font-mono-label text-on-surface-variant bg-surface-container/80 px-2 py-0.5 rounded border border-outline-variant">
          LAT 29.7604° N · LON 95.3698° W
        </div>
      </div>
    </div>
  )
}
