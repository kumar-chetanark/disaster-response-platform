'use client'

import React, { useState } from 'react'
import { PlatformReport, ReportType, Incident } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import IncidentReportPreviewModal from './preview/IncidentReportPreviewModal'

interface ReportsConsoleProps {
  reports: PlatformReport[]
  incidents?: Incident[]
  selectedReportId: string | null
  onSelectReport: (id: string) => void
  onNavigateToIncident?: (incidentId: string) => void
}

export default function ReportsConsole({
  reports,
  incidents = [],
  selectedReportId,
  onSelectReport,
  onNavigateToIncident,
}: ReportsConsoleProps) {
  const [filterType, setFilterType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIncidentForPdf, setSelectedIncidentForPdf] = useState<string>(incidents[0]?.id || 'inc-a')
  
  // Preview modal state (fixes blank page)
  const [previewIncident, setPreviewIncident] = useState<Incident | null>(null)

  const selectedRep =
    reports.find((r) => r.id === selectedReportId) || reports[0]

  const filteredReports = reports.filter((r) => {
    const matchesType = filterType === 'ALL' || r.reportType === filterType
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const handleOpenPreview = (incidentId: string) => {
    const inc = incidents.find((i) => i.id === incidentId) || incidents[0]
    if (inc) {
      setPreviewIncident(inc)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Header / Filter Toolbar */}
      <div className="px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Platform Intelligence &amp; Historical Reports
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Unified mission debriefs, operational after-actions, and authority decision records
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search reports, authors..."
            className="w-56"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">Type: ALL</option>
            <option value="Incident Debrief">Incident Debrief</option>
            <option value="Assessment Mission Report">Assessment Report</option>
            <option value="Operation After-Action">Operation After-Action</option>
            <option value="Resource Utilization">Resource Utilization</option>
            <option value="Authority Decision Log">Authority Decision Log</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Reports List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest">
          {/* Quick PDF Generator Bar */}
          <div className="p-3 bg-surface-container-low border-b border-outline-variant space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-mono-label text-[10px] text-primary uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                Export Incident PDF Dossier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedIncidentForPdf}
                onChange={(e) => setSelectedIncidentForPdf(e.target.value)}
                className="flex-1 bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2 py-1 cursor-pointer truncate"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.id.toUpperCase()} — {inc.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleOpenPreview(selectedIncidentForPdf)}
                className="px-2.5 py-1 bg-primary text-on-primary font-mono-label text-[10px] font-bold rounded uppercase hover:bg-primary-container shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">visibility</span>
                View &amp; PDF
              </button>
            </div>
          </div>

          <div className="px-4 py-2 bg-surface-container-high border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredReports.length} Documented Records
            </span>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Historical Ledger
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredReports.map((rep) => {
              const isSelected = selectedRep?.id === rep.id
              return (
                <div
                  key={rep.id}
                  onClick={() => onSelectReport(rep.id)}
                  className={`p-3 rounded border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                    isSelected
                      ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-label text-[10px] text-primary font-bold">
                          {rep.id}
                        </span>
                        <span className="text-outline-variant text-[10px]">•</span>
                        <span className="font-mono-label text-[9px] bg-surface text-on-surface-variant px-1.5 py-0.2 rounded border border-outline-variant uppercase">
                          {rep.reportType}
                        </span>
                      </div>
                      <h4 className="font-body-sm font-semibold text-[13px] text-on-surface mt-0.5 leading-snug">
                        {rep.title}
                      </h4>
                    </div>

                    <span className="font-mono-label text-[9px] text-on-surface-variant shrink-0">
                      {rep.timestamp}
                    </span>
                  </div>

                  <p className="font-body-sm text-[11px] text-outline line-clamp-2">
                    {rep.summary}
                  </p>

                  <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono-label text-on-surface-variant">
                    <span>Author: {rep.author}</span>
                    <span className="text-primary">{rep.metricsSummary}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANE: Selected Report Detail Dossier */}
        <div className="flex-1 flex flex-col h-full bg-surface overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {selectedRep ? (
            <>
              {/* 1. Compact Consistent Details Header */}
              <DetailsHeader
                badgeId={`REPORT ID: ${selectedRep.id}`}
                title={selectedRep.title}
                statusText={`TYPE: ${selectedRep.reportType}`}
                statusColor="primary"
                accentColor="primary"
                subItems={[
                  { label: 'Author', value: selectedRep.author, icon: 'person' },
                  { label: 'Timestamp', value: selectedRep.timestamp },
                  ...(selectedRep.relatedIncidentId
                    ? [{ label: 'Incident Ref', value: selectedRep.relatedIncidentId.toUpperCase(), highlight: true }]
                    : []),
                ]}
                extraAction={
                  selectedRep.relatedIncidentId ? (
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(selectedRep.relatedIncidentId!)}
                      className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-bright text-primary border border-outline-variant font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                      View &amp; PDF
                    </button>
                  ) : undefined
                }
              />

              {/* 2. Executive Summary */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">summarize</span>
                  Executive Summary &amp; Findings
                </h4>
                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3.5 rounded border border-outline-variant leading-relaxed">
                  {selectedRep.summary}
                </p>
              </section>

              {/* 3. Tags and Indexing */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[16px]">label</span>
                  Intelligence Tags &amp; Taxonomies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRep.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-surface px-2.5 py-1 rounded text-[10px] font-mono-label text-primary border border-outline-variant"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>

              {/* 4. Actions */}
              {selectedRep.relatedIncidentId && onNavigateToIncident && (
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(selectedRep.relatedIncidentId!)}
                    className="px-4 py-2 bg-surface-container-high hover:bg-surface-bright text-primary border border-outline-variant font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">description</span>
                    Preview Official Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToIncident(selectedRep.relatedIncidentId!)}
                    className="px-4 py-2 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase tracking-wider hover:bg-primary-container transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Open Incident {selectedRep.relatedIncidentId.toUpperCase()} Dossier →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select a report from the historical ledger to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Incident Report Preview Modal */}
      {previewIncident && (
        <IncidentReportPreviewModal
          incident={previewIncident}
          onClose={() => setPreviewIncident(null)}
        />
      )}
    </div>
  )
}
