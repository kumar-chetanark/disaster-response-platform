'use client'

import React from 'react'
import { Incident } from '../../../types'

interface IncidentReportPreviewModalProps {
  incident: Incident
  onClose: () => void
}

export default function IncidentReportPreviewModal({
  incident,
  onClose,
}: IncidentReportPreviewModalProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
        {/* Preview Modal Header */}
        <div className="px-6 py-3.5 bg-surface-container border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">description</span>
            <span className="font-headline-sm text-[14px] font-bold text-on-surface">
              Official Incident Report Preview • {incident.id.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase flex items-center gap-1.5 hover:bg-primary-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="p-8 overflow-y-auto space-y-6 font-body-base text-on-surface print:p-0 print:m-0 scrollbar-thin">
          {/* Header Banner */}
          <div className="border-b-2 border-primary pb-4">
            <div className="text-[10px] font-mono-label text-outline uppercase tracking-wider">
              DISASTER RESPONSE PLATFORM • OFFICIAL INCIDENT DOSSIER
            </div>
            <h1 className="font-display-lg text-[22px] font-bold text-on-surface mt-1">
              {incident.title}
            </h1>
            <div className="text-[12px] font-mono-label text-on-surface-variant mt-1">
              Incident ID: <span className="text-primary font-bold">{incident.id.toUpperCase()}</span> • Sector: {incident.sector} • Location: {incident.location}
            </div>
          </div>

          {/* KPI Summary Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container p-4 rounded border border-outline-variant text-center font-mono-label">
            <div>
              <span className="text-[9px] text-outline uppercase block">Severity</span>
              <span className={`text-[14px] font-bold ${incident.severity === 'CRITICAL' ? 'text-error' : 'text-tertiary'}`}>
                {incident.severity}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-outline uppercase block">Priority</span>
              <span className="text-[14px] font-bold text-on-surface">{incident.priorityLevel}</span>
            </div>
            <div>
              <span className="text-[9px] text-outline uppercase block">Affected Pop.</span>
              <span className="text-[14px] font-bold text-error">{incident.affectedPopulationEst}</span>
            </div>
            <div>
              <span className="text-[9px] text-outline uppercase block">Area Scope</span>
              <span className="text-[14px] font-bold text-on-surface">{incident.affectedAreaSqKm} sq km</span>
            </div>
          </div>

          {/* Section 1: Impact */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-mono-label font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1">
              1. Situational Impact &amp; Accessibility
            </h3>
            <p className="text-[13px] text-on-surface bg-surface-container-low p-3.5 rounded border border-outline-variant leading-relaxed">
              {incident.impact}
            </p>
          </div>

          {/* Section 2: Multi-Source Intelligence Corroboration */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-mono-label font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1">
              2. Multi-Source Intelligence Corroboration
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono-label text-center text-[11px]">
              <div className="p-2 bg-surface-container rounded border border-outline-variant">
                <span className="text-[9px] text-outline block">Citizen</span>
                <span className="font-bold">{incident.sourceCounts?.citizenReports || 0}</span>
              </div>
              <div className="p-2 bg-surface-container rounded border border-outline-variant">
                <span className="text-[9px] text-outline block">News</span>
                <span className="font-bold">{incident.sourceCounts?.newsReports || 0}</span>
              </div>
              <div className="p-2 bg-surface-container rounded border border-outline-variant">
                <span className="text-[9px] text-outline block">Government</span>
                <span className="font-bold">{incident.sourceCounts?.governmentReports || 0}</span>
              </div>
              <div className="p-2 bg-surface-container rounded border border-outline-variant">
                <span className="text-[9px] text-outline block">IMD / Radar</span>
                <span className="font-bold">{incident.sourceCounts?.weatherReports || 0}</span>
              </div>
              <div className="p-2 bg-surface-container rounded border border-outline-variant">
                <span className="text-[9px] text-outline block">Field Recon</span>
                <span className="font-bold text-emerald-400">{incident.sourceCounts?.fieldAssessments || 0}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Field Assessments */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-mono-label font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1">
              3. Field Assessment Status
            </h3>
            {incident.isFieldVerified ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded text-[12px] font-mono-label space-y-1">
                <div className="text-emerald-400 font-bold">✓ Field Reconnaissance Verified</div>
                <div className="text-on-surface">Spatial damage assessment completed. Road blockage and rooftop isolation confirmed.</div>
              </div>
            ) : (
              <div className="p-3 bg-surface-container rounded border border-outline-variant text-[12px] font-mono-label text-outline">
                Not yet assessed by field reconnaissance assets.
              </div>
            )}
          </div>

          {/* Section 4: Progression Timeline */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-mono-label font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1">
              4. Incident Progression Timeline
            </h3>
            <div className="space-y-2">
              {(incident.timeline || []).map((t) => (
                <div key={t.id} className="p-2.5 bg-surface-container-low rounded border border-outline-variant text-[12px]">
                  <span className="font-mono-label text-[10px] text-primary font-bold">[{t.timestamp}]</span>{' '}
                  <span className="font-semibold text-on-surface">{t.title}:</span>{' '}
                  <span className="text-on-surface-variant">{t.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Active Operations */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-mono-label font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1">
              5. Active Operations &amp; Tracks
            </h3>
            <div className="flex flex-wrap gap-2">
              {(incident.associatedOperations || []).map((op, idx) => (
                <span key={idx} className="bg-surface-container px-3 py-1 rounded text-[11px] font-mono-label text-on-surface border border-outline-variant">
                  {op}
                </span>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="pt-4 border-t border-outline-variant text-[10px] font-mono-label text-outline flex items-center justify-between">
            <span>Generated on {new Date().toLocaleString()} by Authority Command Platform</span>
            <span>Confidential Operational Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  )
}
