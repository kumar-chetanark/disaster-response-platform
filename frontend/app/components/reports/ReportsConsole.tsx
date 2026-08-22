'use client'

import React, { useState } from 'react'
import { PlatformReport } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import IncidentReportPreviewModal from './preview/IncidentReportPreviewModal'

interface ReportsConsoleProps {
  incidents?: any[]
  onNavigateToIncident?: (incId: string) => void
  reports?: PlatformReport[]
  selectedReportId?: string | null
  onSelectReport?: (reportId: string) => void
  onGenerateReport?: () => void
}

export default function ReportsConsole({
  reports: initialReports = [],
  selectedReportId: initialSelectedId,
  onSelectReport,
  onGenerateReport,
}: ReportsConsoleProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(initialSelectedId || null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)

  // Use provided reports or empty list
  const reportsList = initialReports

  const filteredReports = reportsList.filter((rep) => {
    const matchesType =
      filterType === 'ALL' || rep.reportType.toLowerCase() === filterType.toLowerCase()
    const matchesSearch =
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const selectedReport =
    reportsList.find((r) => r.id === selectedReportId) || filteredReports[0] || null

  const handleSelect = (rep: PlatformReport) => {
    setSelectedReportId(rep.id)
    if (onSelectReport) {
      onSelectReport(rep.id)
    }
    setIsMobileDetailView(true)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden w-full">
      {/* Header Toolbar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Operational Reports &amp; After-Action Debriefs
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
              Synthesized situation intelligence dossiers, casualty metrics, and printable PDF exports
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search report archive..."
            className="flex-1 sm:w-56"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="SITREP">SITREP</option>
            <option value="AFTER_ACTION">AFTER ACTION</option>
            <option value="DAMAGE_ASSESSMENT">DAMAGE ASSESSMENT</option>
            <option value="RESOURCE_AUDIT">RESOURCE AUDIT</option>
          </select>

          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center gap-1.5 shadow"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Preview &amp; Print PDF
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* LEFT PANE: Reports List */}
        <div
          className={`w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest transition-all ${
            isMobileDetailView ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredReports.length} Historical Dossiers
            </span>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Debrief Archive
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px] space-y-2">
                <span className="material-symbols-outlined text-[32px] text-outline block mx-auto">
                  folder_open
                </span>
                <p>Report archive is available once report records are generated.</p>
              </div>
            ) : (
              filteredReports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id
                return (
                  <div
                    key={rep.id}
                    onClick={() => handleSelect(rep)}
                    className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-2 relative ${
                      isSelected
                        ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                        : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono-label text-[10px] text-primary font-bold">
                          {rep.id}
                        </span>
                        <span className="font-mono-label text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded uppercase font-bold">
                          {rep.reportType}
                        </span>
                      </div>
                      <span className="font-mono-label text-[10px] text-on-surface-variant">
                        {rep.generatedAt}
                      </span>
                    </div>

                    <h4 className="font-headline-sm font-semibold text-[13px] text-on-surface leading-snug">
                      {rep.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono-label">
                      <span className="truncate">{rep.author}</span>
                      <span className="text-[10px] text-emerald-400">PDF Ready</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Selected Report Master Dossier */}
        <div
          className={`flex-1 flex flex-col h-full bg-surface overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin transition-all min-w-0 ${
            isMobileDetailView ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {selectedReport ? (
            <>
              {/* Mobile Back Button */}
              <div className="md:hidden pb-1">
                <button
                  type="button"
                  onClick={() => setIsMobileDetailView(false)}
                  className="flex items-center gap-1.5 text-primary hover:text-on-surface font-mono-label text-[12px] font-bold py-1.5 px-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  ← Back to Reports Archive
                </button>
              </div>

              {/* 1. Header */}
              <DetailsHeader
                badgeId={`REPORT DOSSIER: ${selectedReport.id}`}
                title={selectedReport.title}
                severityBadge={selectedReport.reportType}
                statusText="ARCHIVED DEBRIEF"
                statusColor="primary"
                accentColor="primary"
                subItems={[
                  { label: 'Author / Authority', value: selectedReport.author, icon: 'person' },
                  { label: 'Linked Incident', value: selectedReport.incidentId || 'Central Command', highlight: true },
                  { label: 'Date Generated', value: selectedReport.generatedAt || 'Today', icon: 'calendar_today' },
                  { label: 'Classification', value: 'OFFICIAL USE ONLY' },
                ]}
              />

              {/* 2. Executive Summary */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant">
                  <span className="material-symbols-outlined text-primary text-[18px]">summarize</span>
                  Executive Summary &amp; Operational Narrative
                </h4>
                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3 rounded border border-outline-variant leading-relaxed">
                  {selectedReport.summary}
                </p>
              </section>

              {/* 3. Metrics Summary */}
              {selectedReport.metrics && (
                <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant">
                    <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
                    Key Operational Metrics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-label text-[11px]">
                    {Object.entries(selectedReport.metrics).map(([key, val]) => (
                      <div key={key} className="p-2.5 bg-surface-container rounded border border-outline-variant/60">
                        <span className="text-outline block uppercase text-[9px]">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-primary font-bold text-[13px]">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer shadow transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Print / Save Official PDF
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select a report from the archive to inspect situational debrief metrics.
            </div>
          )}
        </div>
      </div>

      {/* PDF Modal */}
      {isPreviewModalOpen && (
        <IncidentReportPreviewModal
          incident={({
            affectedPopulationEst: '12,500 civilians',
            affectedAreaSqKm: '12.4 km²',
            sourceCounts: { citizenReports: 1, newsReports: 0, governmentReports: 0, weatherReports: 0, fieldAssessments: 1 },
            reports: [],
            associatedOperations: [],
            timeline: [],
            
            id: selectedReport?.incidentId || 'inc-a',
            title: selectedReport?.title || 'Cyclone Alpha 4  Sector 7G Coastal Basin',
            category: 'Cyclone' as any,
            type: 'cyclone',
            location: 'Sector 7G Coastal Basin',
            sector: 'Sector 7G',
            impact: selectedReport?.summary || 'Widespread coastal flooding',
            severity: 'CRITICAL',
            status: 'ACTIVE',
            timeReported: '10:35 AM',
            lastUpdated: 'Just now',
            priorityLevel: 'Level 1',
            resourceCoverage: '84%',
            isFieldVerified: true,
          }) as any}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </div>
  )
}
