'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { PlatformReport, Incident } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import { platformDataService } from '../../services/dataService'

interface ReportsConsoleProps {
  reports?: PlatformReport[]
  selectedReportId?: string | null
  incidents?: Incident[]
  onSelectReport?: (reportId: string) => void
  onGenerateReport?: (type: string, incidentId?: string) => void
  onDownloadPDF?: (reportId: string) => void
  onNavigateToIncident?: (incidentId: string) => void
}

export default function ReportsConsole({
  reports: initialReports = [],
  selectedReportId: initialSelectedId,
  incidents = [],
  onSelectReport,
  onGenerateReport,
  onDownloadPDF,
  onNavigateToIncident,
}: ReportsConsoleProps) {
  const [filterType, setFilterType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)

  // Real backend live state
  const [reportsList, setReportsList] = useState<PlatformReport[]>(initialReports)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(initialSelectedId || null)
  const [isLoading, setIsLoading] = useState<boolean>(initialReports.length === 0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  // PDF Preview & Generation Modal states
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [newRepType, setNewRepType] = useState<string>('SITREP')
  const [newRepTitle, setNewRepTitle] = useState<string>('')
  const [newRepAuthor, setNewRepAuthor] = useState<string>('Crisis Command Officer')
  const [newRepIncidentId, setNewRepIncidentId] = useState<string>('inc-a')
  const [newRepSummary, setNewRepSummary] = useState<string>('')

  const fetchLiveReports = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await platformDataService.getReports(undefined, filterType)
      setReportsList(data)
      if (data.length > 0) {
        setSelectedReportId((prev) => (prev && data.some((r) => r.id === prev) ? prev : data[0].id))
      }
    } catch (err: any) {
      console.error('[ReportsConsole] Error fetching live reports:', err)
      setErrorMessage('Unable to connect to backend reports database service.')
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [filterType])

  useEffect(() => {
    fetchLiveReports()
  }, [fetchLiveReports])

  const filteredReports = reportsList.filter((rep) => {
    const repTypeStr = String(rep.type || rep.reportType || '').toUpperCase()
    const activeFilter = filterType.toUpperCase()
    const matchesType = activeFilter === 'ALL' || repTypeStr === activeFilter

    const q = searchQuery.toLowerCase()
    const matchesSearch =
      rep.title.toLowerCase().includes(q) ||
      rep.id.toLowerCase().includes(q) ||
      rep.author.toLowerCase().includes(q) ||
      (rep.incidentTitle && rep.incidentTitle.toLowerCase().includes(q))

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

  const handleBackToList = () => {
    setIsMobileDetailView(false)
  }

  const handleDownloadPDF = (repId: string) => {
    if (onDownloadPDF) {
      onDownloadPDF(repId)
    } else {
      const targetUrl = `http://localhost:8000/api/reports/${encodeURIComponent(repId)}/pdf`
      window.open(targetUrl, '_blank')
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRepTitle.trim() || !newRepSummary.trim()) return

    try {
      const created = await platformDataService.createReport({
        report_type: newRepType,
        title: newRepTitle.trim(),
        author: newRepAuthor.trim(),
        incident_id: newRepIncidentId || undefined,
        summary: newRepSummary.trim(),
      })
      if (created) {
        setReportsList((prev) => [created, ...prev])
        setSelectedReportId(created.id)
        setIsCreateModalOpen(false)
        setNewRepTitle('')
        setNewRepSummary('')
      }
    } catch (err) {
      console.error('[ReportsConsole] Failed to create report on backend:', err)
    }
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
              Operational Reports &amp; Debriefs
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
              Archival SITREPs, Damage Assessments, Resource Audits, and PDF Generation
            </p>
          </div>
        </div>

        {/* Search, Filter, and Generate Action */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search reports archive..."
            className="flex-1 sm:w-56"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">All Report Types</option>
            <option value="SITREP">SITREP</option>
            <option value="AFTER_ACTION">AFTER-ACTION</option>
            <option value="DAMAGE_ASSESSMENT">DAMAGE ASSESSMENT</option>
            <option value="RESOURCE_AUDIT">RESOURCE AUDIT</option>
          </select>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Generate Report
          </button>

          <button
            type="button"
            onClick={() => fetchLiveReports()}
            className="p-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            title="Refresh reports from backend"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Error Banner if Backend is Unavailable */}
      {errorMessage && (
        <div className="px-6 py-2.5 bg-error/15 border-b border-error/30 flex items-center justify-between text-error font-body-sm text-[12px]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">cloud_off</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLiveReports()}
            className="font-mono-label text-[11px] font-bold underline uppercase cursor-pointer hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Split Layout: Desktop 2-column | Mobile conditional 1-column */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* LEFT PANE: Reports List */}
        <div
          className={`w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest transition-all ${
            isMobileDetailView ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredReports.length} Official Reports
            </span>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Live Database
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {isLoading && reportsList.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-on-surface-variant font-mono-label text-[12px] gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Loading reports from database...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px] space-y-2">
                <span className="material-symbols-outlined text-[32px] text-outline block mx-auto">
                  description
                </span>
                <p>No operational reports found in this view.</p>
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono-label text-[10px] text-primary font-bold uppercase bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                          {rep.type || rep.reportType}
                        </span>
                        <span className="font-mono-label text-[10px] text-on-surface-variant">
                          {rep.id}
                        </span>
                      </div>

                      <span className="font-mono-label text-[10px] text-on-surface-variant">
                        {rep.date || rep.timestamp}
                      </span>
                    </div>

                    <h4 className="font-headline-sm font-semibold text-[13px] text-on-surface leading-snug">
                      {rep.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono-label">
                      <span className="truncate max-w-[200px]">By: {rep.author}</span>
                      <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.2 rounded border border-emerald-500/30 text-[9px]">
                        PDF READY
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Selected Report Dossier */}
        <div
          className={`flex-1 flex flex-col h-full bg-surface overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin transition-all min-w-0 ${
            isMobileDetailView ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {selectedReport ? (
            <>
              {/* Mobile Back to List Button */}
              <div className="md:hidden pb-1">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-primary hover:text-on-surface font-mono-label text-[12px] font-bold py-1.5 px-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  ← Back to Reports List
                </button>
              </div>

              {/* 1. Header with Report Type */}
              <DetailsHeader
                badgeId={`REPORT DOSSIER: [${selectedReport.id}]`}
                title={selectedReport.title}
                severityBadge={selectedReport.type || (selectedReport.reportType as string) || 'SITREP'}
                statusText="OFFICIAL RELEASE"
                statusColor="primary"
                accentColor="primary"
                subItems={[
                  { label: 'Authoring Officer', value: selectedReport.author, icon: 'person' },
                  { label: 'Published Date', value: selectedReport.date || selectedReport.timestamp || 'Just now', icon: 'calendar_today' },
                  { label: 'Linked Incident', value: selectedReport.incidentTitle || selectedReport.incidentId || 'Central Command Network', highlight: true },
                  { label: 'Document Format', value: 'Standard Portable Document (PDF)' },
                ]}
              />

              {/* 2. Executive Summary & Operational Narrative */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">article</span>
                    Executive Summary &amp; Debrief Details
                  </h4>
                  <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Archived Dossier
                  </span>
                </div>

                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3.5 rounded border border-outline-variant leading-relaxed">
                  {selectedReport.summary}
                </p>

                {selectedReport.tags && selectedReport.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="font-mono-label text-[10px] text-outline uppercase mr-1">Tags:</span>
                    {selectedReport.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="font-mono-label text-[10px] bg-surface-container px-2 py-0.5 rounded border border-outline-variant text-on-surface-variant"
                      >
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* 3. Official PDF Download & Actions */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">picture_as_pdf</span>
                    Official Command PDF Document
                  </h5>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    Includes full incident metadata, multi-channel corroboration ledgers, reconnaissance surveys, and operational dispatches.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                    Preview Document
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedReport.id)}
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center gap-1.5 shadow"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download PDF
                  </button>
                </div>
              </section>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select a report from the archive to view details and download official PDF.
            </div>
          )}
        </div>
      </div>

      {/* PDF Document Preview Modal */}
      {previewModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant shrink-0">
              <div>
                <span className="font-mono-label text-[10px] text-primary font-bold uppercase">
                  OFFICIAL SITUATIONAL REPORT DOSSIER
                </span>
                <h3 className="font-headline-sm text-[15px] font-bold text-on-surface">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-[12px] text-on-surface scrollbar-thin">
              <div className="flex justify-between border-b border-outline-variant/60 pb-2 font-mono-label text-[10px]">
                <span>REPORT ID: <b className="text-primary">{selectedReport.id}</b></span>
                <span>TYPE: <b>{selectedReport.type || selectedReport.reportType}</b></span>
                <span>DATE: <b>{selectedReport.date || selectedReport.timestamp}</b></span>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-1">1. Executive Summary</h4>
                <p className="leading-relaxed bg-surface-container p-3 rounded">{selectedReport.summary}</p>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-1">2. Canonical Incident Reference</h4>
                <p className="leading-relaxed bg-surface-container p-3 rounded">
                  Linked Incident: <b>{selectedReport.incidentTitle || selectedReport.incidentId || 'Central Command Network'}</b>
                  <br />
                  Multi-channel corroborating ledgers, field reconnaissance drone surveys, and authority dispatches attached to official binary PDF release.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant shrink-0">
              <span className="font-mono-label text-[11px] text-on-surface-variant">
                Generated via Disaster Response Platform API
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-3.5 py-1.5 bg-surface-container-high text-on-surface font-mono-label text-[11px] rounded uppercase cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewModalOpen(false)
                    handleDownloadPDF(selectedReport.id)
                  }}
                  className="px-4 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer shadow"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <h3 className="font-headline-sm text-[15px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
                Generate Operational Report Dossier
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-body-sm text-[12px]">
              <div>
                <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  value={newRepTitle}
                  onChange={(e) => setNewRepTitle(e.target.value)}
                  placeholder="e.g. Sector 7G Storm Surge Recovery SITREP"
                  className="w-full bg-background border border-outline-variant rounded px-3 py-1.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Report Type</label>
                  <select
                    value={newRepType}
                    onChange={(e) => setNewRepType(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface focus:border-primary"
                  >
                    <option value="SITREP">SITREP</option>
                    <option value="AFTER_ACTION">AFTER-ACTION</option>
                    <option value="DAMAGE_ASSESSMENT">DAMAGE ASSESSMENT</option>
                    <option value="RESOURCE_AUDIT">RESOURCE AUDIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Linked Incident</label>
                  <select
                    value={newRepIncidentId}
                    onChange={(e) => setNewRepIncidentId(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface focus:border-primary"
                  >
                    <option value="inc-a">Incident #1 (inc-a)</option>
                    <option value="inc-b">Incident #2 (inc-b)</option>
                    <option value="inc-c">Incident #3 (inc-c)</option>
                    <option value="">None (Platform General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Author / Command Unit</label>
                <input
                  type="text"
                  value={newRepAuthor}
                  onChange={(e) => setNewRepAuthor(e.target.value)}
                  className="w-full bg-background border border-outline-variant rounded px-3 py-1.5 text-on-surface focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Executive Summary &amp; Narrative *</label>
                <textarea
                  required
                  rows={4}
                  value={newRepSummary}
                  onChange={(e) => setNewRepSummary(e.target.value)}
                  placeholder="Enter operational narrative, damage evaluation, and response actions..."
                  className="w-full bg-background border border-outline-variant rounded p-2.5 text-on-surface focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-surface-container-high text-on-surface font-mono-label text-[11px] rounded uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer shadow"
                >
                  Generate Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
