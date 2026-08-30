'use client'

import { toast } from 'react-toastify'

import React, { useState, useEffect, useRef } from 'react'
import { Incident, IncidentConfidenceTelemetry, EvidenceBreakdownItem, ContradictionItem, IncidentRequirementsResponse, IncidentCapabilityRequirement, OperationRecord, LiveOperationalTelemetry, ResourceTelemetryState, IncidentIntelligenceTelemetry, DecisionActionItem, IncidentGeospatialContext, GeospatialResource, GeospatialOperation } from '../../types'
import { showConfirmDialog } from '../common/ConfirmDialog'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import { platformDataService } from '../../services/dataService'

interface IncidentsConsoleProps {
  incidents?: Incident[]
  selectedIncidentId?: string | null
  advisories?: any[]
  onSelectIncident?: (id: string) => void
  onDeleteIncident?: (id: string) => void
  onOpenAssessment?: () => void
  onOpenOperations?: (opId?: string) => void
  onOpenReportPreview?: (reportId?: string) => void
}

export default function IncidentsConsole({
  incidents: initialIncidents = [],
  selectedIncidentId: initialSelectedId = null,
  advisories = [],
  onSelectIncident,
  onDeleteIncident,
  onOpenAssessment,
  onOpenOperations,
  onOpenReportPreview,
}: IncidentsConsoleProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [starredOnly, setStarredOnly] = useState(false)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setStarredIds(platformDataService.getStarredIds('incident'))
    if (initialIncidents.length > 0) {
      const firstId = initialSelectedId || initialIncidents[0]?.id
      if (firstId) {
        platformDataService.markAsSeen('incident', firstId)
      }
    }
  }, [])

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    platformDataService.toggleStar('incident', id)
    setStarredIds(new Set(platformDataService.getStarredIds('incident')))
  }

  const handleDeleteIncident = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (onDeleteIncident) {
      await onDeleteIncident(id)
      setIncidentsList((prev) => prev.filter((i) => i.id !== id))
      if (selectedIncidentId === id) {
        setSelectedIncidentId(null)
        setSelectedIncidentDetail(null)
      }
      return
    }

    const confirmed = await showConfirmDialog({
      title: `DELETE INCIDENT ${id.toUpperCase()}`,
      message: `Are you sure you want to permanently delete Incident ${id}? This action cannot be undone and will clean up all associated alerts and logs across the platform.`,
      confirmLabel: 'PERMANENTLY DELETE',
      type: 'danger',
    })
    if (!confirmed) return
    setDeletingId(id)
    try {
      await platformDataService.deleteIncident(id)
      setIncidentsList((prev) => prev.filter((i) => i.id !== id))
      if (selectedIncidentId === id) {
        setSelectedIncidentId(null)
        setSelectedIncidentDetail(null)
      }
      toast.success(`Incident ${id} deleted successfully.`, { theme: 'light' })
    } catch (err) {
      console.error('Delete incident failed:', err)
    } finally {
      setDeletingId(null)
    }
  }
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)

  // Real backend live state & in-memory dossier cache to eliminate switching latency
  const [incidentsList, setIncidentsList] = useState<Incident[]>(initialIncidents)

  useEffect(() => {
    setIncidentsList(initialIncidents)
  }, [initialIncidents])
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(initialSelectedId || null)
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<Incident | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false)
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null)
  const [statusActionError, setStatusActionError] = useState<string | null>(null)
  const [confidenceData, setConfidenceData] = useState<IncidentConfidenceTelemetry | null>(null)
  const [isLoadingConfidence, setIsLoadingConfidence] = useState<boolean>(false)
  const [requirementsData, setRequirementsData] = useState<IncidentRequirementsResponse | null>(null)
  const [incidentOperations, setIncidentOperations] = useState<OperationRecord[]>([])
  const [isDeployingResource, setIsDeployingResource] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [telemetryData, setTelemetryData] = useState<LiveOperationalTelemetry | null>(null)
  const [intelligenceData, setIntelligenceData] = useState<IncidentIntelligenceTelemetry | null>(null)
  const [geospatialData, setGeospatialData] = useState<IncidentGeospatialContext | null>(null)
  const [selectedMapEntity, setSelectedMapEntity] = useState<{ type: 'incident' | 'resource' | 'operation'; data: any } | null>(null)


  const [lastRefreshedSec, setLastRefreshedSec] = useState<number>(0)



  const dossierCache = useRef<Record<string, Incident>>({})


  const handleApproveAndDeploy = async (recId: string, resId: string, notes?: string) => {
    if (!selectedIncident || isDeployingResource) return
    setIsDeployingResource(resId)
    setDeployError(null)
    try {
      await platformDataService.approveResourceAllocation(recId, selectedIncident.id, resId, notes)
      const [refreshedOps, refreshedIntel] = await Promise.all([
        platformDataService.getIncidentOperations(selectedIncident.id),
        platformDataService.getIncidentIntelligence(selectedIncident.id)
      ])
      setIncidentOperations(refreshedOps)
      if (refreshedIntel) {
        setIntelligenceData(refreshedIntel)
      }
      if (typeof window !== 'undefined') { window.dispatchEvent(new Event('storage')) }
    } catch (err: any) {
      console.error('Failed to approve deployment:', err)
      setDeployError(err.message || 'Deployment authorization failed')
    } finally {
      setIsDeployingResource(null)
    }
  }

  const handleUpdateOpStatus = async (opId: string, newStatus: string) => {
    try {
      await platformDataService.updateOperationStatus(opId, newStatus)
      if (selectedIncident) {
        const [refreshedOps, refreshedIntel] = await Promise.all([
          platformDataService.getIncidentOperations(selectedIncident.id),
          platformDataService.getIncidentIntelligence(selectedIncident.id)
        ])
        setIncidentOperations(refreshedOps)
        if (refreshedIntel) {
          setIntelligenceData(refreshedIntel)
        }
        if (typeof window !== 'undefined') { window.dispatchEvent(new Event('storage')) }
      }
    } catch (err: any) {
      console.error('Failed to update operation status:', err)
      setDeployError(err.message || 'Operation status transition failed')
    }
  }


  const handleGenerateDossierReport = async () => {
    if (!selectedIncident || isGeneratingReport) return
    setIsGeneratingReport(true)
    setReportSuccessMsg(null)
    setStatusActionError(null)

    try {
      const inc = selectedIncident
      const newReport = await platformDataService.createReport({
        title: `Incident SITREP — ${inc.title} [${inc.id.toUpperCase()}]`,
        report_type: 'SITREP' as any,
        incident_id: inc.id,
        author: 'Command Operations Authority',
        status: 'COMPLETED' as any,
        summary: `INCIDENT OPERATIONAL REPORT\n- Incident ID: ${inc.id}\n- Title: ${inc.title}\n- Location: ${inc.location || 'Noida, Uttar Pradesh'}\n- Disaster Type: ${(inc.type || 'Disaster').toUpperCase()}\n- Severity: ${inc.severity}\n- Priority Level: ${inc.priorityLevel || 'Level 1'}\n- Status: ${inc.status}\n- Affected Population: ${inc.affectedPopulationEst || 45}\n- Last Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}\n- Description: ${inc.impact || inc.title}`,
        metrics_summary: `Severity: ${inc.severity} | Status: ${inc.status} | Population: ${inc.affectedPopulationEst || 45}`,
        tags: `${inc.type || 'disaster'}, ${inc.severity}, ${inc.status}, SITREP`,
      })
      if (newReport) {
        toast.success(`Official SITREP report generated (ID: ${newReport.id}) and published to Reports tab.`, { theme: 'dark' }); setReportSuccessMsg(`Official SITREP report generated (ID: ${newReport.id}) and published to Reports tab.`)
      }
    } catch (err: any) {
      console.error('Error generating report:', err)
      setStatusActionError(err?.message || 'Failed to generate incident report.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleStatusTransition = async (targetStatus: string, notes?: string) => {
    if (!selectedIncident || isUpdatingStatus) return
    setIsUpdatingStatus(true)
    setStatusActionError(null)
    try {
      const updated = await platformDataService.updateIncidentStatus(selectedIncident.id, targetStatus, notes)
      if (updated) {
        setSelectedIncidentDetail(updated)
        dossierCache.current[updated.id] = updated
        setIncidentsList((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)))
        toast.success(`Incident status transitioned to ${targetStatus}.`, { theme: 'light' })
      }
    } catch (err: any) {
      console.error('Failed to transition incident status:', err)
      setStatusActionError(err.message || 'Status transition failed')
      toast.error(err.message || 'Status transition failed', { theme: 'light' })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // 1. Fetch live incidents list
  useEffect(() => {
    let isMounted = true
    async function loadLiveIncidents() {
      try {
        const data = await platformDataService.getIncidents(searchQuery, filterSeverity, filterStatus)
        if (isMounted) {
          setIncidentsList(data)
          if (data.length > 0 && !selectedIncidentId) {
            setSelectedIncidentId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching live incidents list:', err)
      }
    }
    loadLiveIncidents()
    return () => { isMounted = false }
  }, [searchQuery, filterSeverity, filterStatus])


  // Live Operational Telemetry Polling (Every 4 seconds with cleanup)
  useEffect(() => {
    if (!selectedIncidentId) return
    let isMounted = true

    const fetchTelemetry = async () => {
      try {
        const [tData, iData, gData] = await Promise.all([
          platformDataService.getIncidentTelemetry(selectedIncidentId),
          platformDataService.getIncidentIntelligence(selectedIncidentId),
          platformDataService.getIncidentGeospatial(selectedIncidentId)
        ])
        if (isMounted) {
          if (tData) setTelemetryData(tData)
          if (iData) setIntelligenceData(iData)
          if (gData) setGeospatialData(gData)
          setLastRefreshedSec(0)
        }
      } catch (err) {
        console.error('Error fetching live telemetry/intelligence:', err)
      }
    }

    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 4000)
    const tickInterval = setInterval(() => {
      if (isMounted) setLastRefreshedSec((prev) => prev + 1)
    }, 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
      clearInterval(tickInterval)
    }
  }, [selectedIncidentId])

  // 2. Fetch or retrieve from cache the full 16-dimension canonical dossier with zero-lag UI response
  useEffect(() => {
    if (!selectedIncidentId) return

    // If already in memory cache, display immediately without network latency
    if (dossierCache.current[selectedIncidentId]) {
      setSelectedIncidentDetail(dossierCache.current[selectedIncidentId])
      setIsLoadingDetail(false)
      return
    }

    let isMounted = true
    setIsLoadingDetail(true)
    
    async function loadIncidentDossier() {
      try {
        const detail = await platformDataService.getIncidentById(selectedIncidentId!)
        if (isMounted && detail) {
          dossierCache.current[selectedIncidentId!] = detail
          setSelectedIncidentDetail(detail)
        }
      } catch (err) {
        console.error('Error fetching incident detail:', err)
      } finally {
        if (isMounted) setIsLoadingDetail(false)
      }
    }
    loadIncidentDossier()
    return () => { isMounted = false }
  }, [selectedIncidentId])

  const filteredIncidents = incidentsList.filter((inc) => {
    const matchesSeverity =
      filterSeverity === 'ALL' || inc.severity.toLowerCase() === filterSeverity.toLowerCase()
    const matchesStatus =
      filterStatus === 'ALL' || inc.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStar = !starredOnly || starredIds.has(inc.id)
    return matchesSeverity && matchesStatus && matchesSearch && matchesStar
  })

  // Get index for stable simple naming: Incident #1, Incident #2, etc.
  const getIncidentNumber = (incId: string): number => {
    const idx = incidentsList.findIndex((i) => i.id === incId)
    return idx >= 0 ? idx + 1 : 1
  }

  const selectedIncident =
    selectedIncidentDetail || incidentsList.find((i) => i.id === selectedIncidentId) || filteredIncidents[0] || null

  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncidentId(inc.id)
    if (onSelectIncident) {
      onSelectIncident(inc.id)
    }
    setIsMobileDetailView(true)
  }

  const handleBackToList = () => {
    setIsMobileDetailView(false)
  }

  // Corroboration counts derived from live backend sources
  const totalSourcesCount = selectedIncident?.reports?.length || 1
  const citizenCount = selectedIncident?.sourceCounts?.citizenReports || (selectedIncident?.reports?.filter(r => r.sourceType === 'CITIZEN').length) || 1
  const newsCount = selectedIncident?.sourceCounts?.newsReports || (selectedIncident?.reports?.filter(r => r.sourceType === 'NEWS').length) || 0
  const govCount = selectedIncident?.sourceCounts?.governmentReports || (selectedIncident?.reports?.filter(r => r.sourceType === 'GOVERNMENT').length) || 0
  const weatherCount = selectedIncident?.sourceCounts?.weatherReports || (selectedIncident?.reports?.filter(r => r.sourceType === 'WEATHER').length) || 0
  const reconCount = selectedIncident?.sourceCounts?.fieldAssessments || (selectedIncident?.reports?.filter(r => r.sourceType === 'FIELD_ASSESSMENT').length) || (selectedIncident?.isFieldVerified ? 1 : 0)

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden w-full">
      {/* Header Toolbar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">crisis_alert</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Canonical Incident Registry
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
              Multi-source deduplicated incident records • Real-time field intelligence
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search canonical registry..."
            className="flex-1 sm:w-60"
          />

          <button
            type="button"
            onClick={() => setStarredOnly(!starredOnly)}
            title={starredOnly ? 'Showing starred incidents only' : 'Filter by starred incidents'}
            className={`px-2.5 py-1.5 rounded border transition-colors cursor-pointer flex items-center gap-1.5 font-mono-label text-[11px] ${
              starredOnly
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                : 'bg-background border-outline-variant text-outline hover:text-on-surface'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${starredOnly ? 'text-amber-400 fill-current' : ''}`}>
              star
            </span>
            <span>Starred</span>
          </button>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">Severity: ALL</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">Status: ALL</option>
            <option value="active">ACTIVE</option>
            <option value="contained">CONTAINED</option>
            <option value="monitoring">MONITORING</option>
            <option value="resolved">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Desktop 2-column | Mobile conditional 1-column */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* LEFT PANE: Incident Master List */}
        <div
          className={`w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest transition-all ${
            isMobileDetailView ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredIncidents.length} Canonical Events
            </span>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Live Database
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
                No incidents match the active search/filters.
              </div>
            ) : (
              filteredIncidents.map((inc, index) => {
                const isSelected = selectedIncident?.id === inc.id
                const incidentNumber = index + 1
                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                      isSelected
                        ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                        : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-error'
                          : inc.severity === 'HIGH'
                          ? 'bg-tertiary'
                          : 'bg-primary'
                      }`}
                    />

                    <div className="flex items-start justify-between gap-2 pl-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {/* High-Visibility Star / Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(e, inc.id)}
                          className={`px-1.5 py-0.5 rounded border text-[13px] flex items-center gap-1 cursor-pointer transition-all ${
                            starredIds.has(inc.id)
                              ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold shadow-sm'
                              : 'bg-surface-container border-outline-variant text-outline hover:text-amber-300 hover:border-amber-400/50'
                          }`}
                          title={starredIds.has(inc.id) ? 'Starred (Click to unstar)' : 'Click to star / favorite'}
                        >
                          <span>{starredIds.has(inc.id) ? '★' : '☆'}</span>
                          <span className="text-[10px] font-mono-label">{starredIds.has(inc.id) ? 'STARRED' : 'STAR'}</span>
                        </button>

                        <span className="font-mono-label text-[12px] font-bold text-primary">
                          Incident #{incidentNumber}
                        </span>
                        <span
                          className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-error/15 text-error border border-error/30'
                              : inc.severity === 'HIGH'
                              ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        {inc.isFieldVerified && (
                          <span className="font-mono-label text-[8px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-bold">
                            ✓ VERIFIED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-label text-[10px] text-on-surface-variant">
                          {inc.lastUpdated || inc.timeReported}
                        </span>
                        {/* High-Visibility Delete Button */}
                        <button
                          type="button"
                          disabled={deletingId === inc.id}
                          onClick={(e) => handleDeleteIncident(e, inc.id)}
                          className="px-2 py-0.5 rounded border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 font-mono-label text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="Permanently delete incident"
                        >
                          <span>🗑️</span>
                          <span>{deletingId === inc.id ? 'DELETING...' : 'DELETE'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="pl-1 font-body-sm font-semibold text-[13px] text-on-surface leading-snug line-clamp-1">
                      {inc.title}
                    </p>

                    <div className="pl-1 flex items-center justify-between text-[11px] text-on-surface-variant font-mono-label">
                      <span className="truncate max-w-[180px]">📍 {inc.location}</span>
                      <span className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/60">
                        {inc.resourceCoverage || '60%'} Cov
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Selected Incident Master Dossier */}
        <div
          className={`flex-1 flex flex-col h-full bg-surface overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin transition-all min-w-0 ${
            isMobileDetailView ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {selectedIncident ? (() => {
            const rawSources = selectedIncident.reports || []
            const sourceCounts: Record<string, number> = {}
            rawSources.forEach((r: any) => {
              const stype = r.sourceType || 'SOURCE'
              sourceCounts[stype] = (sourceCounts[stype] || 0) + 1
            })
            const sourceBreakdown = (intelligenceData?.confidence as any)?.sources_breakdown || sourceCounts

            return (
            <>
              {/* Mobile Back to List Button */}
              <div className="md:hidden pb-1">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-primary hover:text-on-surface font-mono-label text-[12px] font-bold py-1.5 px-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  ← Back to Incident List
                </button>
              </div>

              {/* 1. Header with Simple Identifier & Complete Sub-Title */}
              <DetailsHeader
                badgeId={`INCIDENT #${getIncidentNumber(selectedIncident.id)} • [${selectedIncident.id.toUpperCase()}]`}
                title={selectedIncident.title}
                severityBadge={selectedIncident.severity}
                statusText={selectedIncident.status}
                statusColor={selectedIncident.status === 'ACTIVE' ? 'error' : 'primary'}
                accentColor={selectedIncident.severity === 'CRITICAL' ? 'error' : 'primary'}
                subItems={[
                  { label: 'Location', value: selectedIncident.location, icon: 'location_on' },
                  { label: 'Disaster Type', value: (selectedIncident.type || 'Disaster').toUpperCase() },
                  { label: 'Priority Level', value: selectedIncident.priorityLevel || 'Level 1', highlight: true },
                  { label: 'Affected Population', value: selectedIncident.affectedPopulationEst || '45' },
                ]}
                extraAction={
                  <button
                    type="button"
                    onClick={handleGenerateDossierReport}
                    disabled={isGeneratingReport}
                    className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-[12px] font-bold font-mono uppercase rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isGeneratingReport ? 'hourglass_top' : 'description'}
                    </span>
                    {isGeneratingReport ? 'GENERATING...' : 'GENERATE REPORT'}
                  </button>
                }
              />

              {/* 2. Automated Incident Intelligence & Decision Support */}
              <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                {/* Header with high contrast badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-variant/60 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-[14px] font-bold text-on-surface">
                        Incident Intelligence &amp; Decision Support
                      </h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Automated situational assessment, threat breakdown &amp; dispatch directives
                      </p>
                    </div>
                  </div>

                  {intelligenceData && (
                    <div className="flex items-center gap-2">
                      <span className={`font-mono-label text-[10px] px-2.5 py-1 rounded-md font-bold uppercase border ${
                        intelligenceData.confidence.level === 'HIGH'
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                          : intelligenceData.confidence.level === 'MODERATE'
                          ? 'bg-amber-950/30 text-amber-400 border-amber-500/30'
                          : 'bg-red-950/30 text-red-400 border-red-500/30'
                      }`}>
                        {intelligenceData.confidence.score}% Confidence ({intelligenceData.confidence.level})
                      </span>
                    </div>
                  )}
                </div>

                {intelligenceData ? (
                  <div className="space-y-4">
                    {/* Clear, Highly Structured Situational Assessment & Recon Module */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                      {/* Structured Situational Assessment & Corroboration Card */}
                      <div className="lg:col-span-2 p-4 bg-surface-container/70 rounded-xl border border-outline-variant/80 space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                          <div className="text-[11px] font-mono-label text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                            Situational Assessment:
                          </div>
                          <span className="font-mono-label text-[10px] text-on-surface-variant">
                            SECTOR: <strong className="text-on-surface">{selectedIncident.location || 'Active Zone'}</strong>
                          </span>
                        </div>

                        {/* Point-Wise Informational Briefing */}
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 gap-2.5 font-mono-label text-[11px]">
                            {/* Point 1: Crisis & Severity Evaluation */}
                            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/60 flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">crisis_alert</span>
                              <div className="space-y-1 flex-1">
                                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                  Crisis &amp; Severity Evaluation
                                </div>
                                <div className="text-[12px] text-on-surface font-body-sm leading-relaxed">
                                  <strong className="text-primary font-bold">{selectedIncident.title}</strong> is evaluated as a <span className="text-red-400 font-bold uppercase">{selectedIncident.severity}</span> severity <strong className="text-on-surface">{selectedIncident.category}</strong> emergency in <strong className="text-on-surface">{selectedIncident.location}</strong>.
                                </div>
                              </div>
                            </div>

                            {/* Point 2: Priority Level & Evidence Corroboration */}
                            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/60 flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-[18px] text-cyan-400 shrink-0 mt-0.5">verified</span>
                              <div className="space-y-1 flex-1">
                                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                  Priority Level &amp; Corroboration Certainty
                                </div>
                                <div className="text-[12px] text-on-surface font-body-sm leading-relaxed">
                                  Operational Priority is set at <strong className="text-cyan-400 font-bold">{intelligenceData.priority?.level || selectedIncident.priorityLevel || 'Level 1'}</strong> (Priority Index: <strong className="text-on-surface">{intelligenceData.priority?.score || 46.5}/100</strong>) with <strong className="text-emerald-400">{intelligenceData.confidence.score}% evidence confidence</strong> across <strong className="text-on-surface">{totalSourcesCount} independent field source(s)</strong>.
                                </div>
                              </div>
                            </div>

                            {/* Point 3: Primary Threat Vectors & Ground Impact */}
                            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/60 flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0 mt-0.5">warning</span>
                              <div className="space-y-1 flex-1">
                                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                  Primary Hazard Vectors &amp; Ground Impact
                                </div>
                                <div className="text-[12px] text-on-surface font-body-sm leading-relaxed">
                                  {String(selectedIncident.category).toLowerCase().includes('flood') || String(selectedIncident.category).toLowerCase().includes('cyclone')
                                    ? 'Ground water inundation • Submerged transit corridors • Critical risk to trapped civilians on upper floors.'
                                    : String(selectedIncident.category).toLowerCase().includes('fire')
                                    ? 'Active rapid flame spread • Dense smoke plume toxicity • Immediate evacuation corridor clearance needed.'
                                    : String(selectedIncident.category).toLowerCase().includes('building') || String(selectedIncident.category).toLowerCase().includes('landslide') || String(selectedIncident.category).toLowerCase().includes('earthquake')
                                    ? 'Severe structural collapse hazards • Heavy debris blocking access roads • Trapped victims requiring specialized extraction.'
                                    : 'Volatile crisis conditions • Unstable structural environment • Immediate sector triage required.'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Merged Multi-Channel Corroboration & Confidence Ledger */}
                        <div className="pt-2 border-t border-outline-variant/60 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-cyan-400 text-[16px]">verified</span>
                              <span className="font-mono-label text-[11px] font-bold text-on-surface uppercase tracking-wider">
                                Multi-Channel Corroboration &amp; Confidence Ledger
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {Object.entries(sourceBreakdown).map(([stype, cnt]) => {
                                const normalizedType = stype.toUpperCase().replace('_', ' ')
                                const displayLabel = normalizedType.includes('CITIZEN')
                                  ? 'CITIZEN'
                                  : normalizedType.includes('GOV')
                                  ? 'GOVERNMENT'
                                  : normalizedType.includes('RECON') || normalizedType.includes('AERIAL') || normalizedType.includes('ASSESSMENT')
                                  ? 'FIELD ASSESSMENT'
                                  : normalizedType.includes('WEATHER')
                                  ? 'WEATHER / IMD'
                                  : normalizedType.includes('NEWS')
                                  ? 'NEWS WIRE'
                                  : normalizedType

                                return (
                                  <span
                                    key={stype}
                                    className={`font-mono-label text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${
                                      displayLabel === 'CITIZEN'
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : displayLabel === 'GOVERNMENT'
                                        ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30'
                                        : displayLabel === 'FIELD ASSESSMENT'
                                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                        : 'bg-surface-container text-on-surface-variant border-outline-variant'
                                    }`}
                                  >
                                    {String(cnt)} {displayLabel}
                                  </span>
                                )
                              })}
                            </div>
                          </div>

                          {/* Raw Telemetry & Field Source Logs */}
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                            {selectedIncident.reports && selectedIncident.reports.length > 0 ? (
                              selectedIncident.reports.map((rep) => (
                                <div
                                  key={rep.id}
                                  className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/70 space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono-label text-[10px] text-primary font-bold">
                                        {rep.sourceLabel || rep.sourceType}
                                      </span>
                                      <span className="font-mono-label text-[9px] bg-surface-container-high px-1.5 py-0.2 rounded border border-outline-variant text-on-surface-variant font-bold">
                                        {rep.channelBadge || 'SOURCE'}
                                      </span>
                                    </div>
                                    <span className="font-mono-label text-[10px] text-on-surface-variant">
                                      {rep.timestamp}
                                    </span>
                                  </div>
                                  <p className="font-body-sm text-[11px] text-on-surface leading-snug">
                                    {rep.summary}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant text-center font-mono-label text-[11px] text-on-surface-variant">
                                Single corroborating source attached.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Live Field Assessment & Verification Dossier */}
                      <div className="p-4 bg-surface-container/70 rounded-xl border border-outline-variant/80 flex flex-col justify-between gap-3.5 shadow-xs">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                            <span className="text-[11px] font-mono-label text-primary uppercase font-bold flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
                              Field Assessment Findings
                            </span>
                            {intelligenceData.latest_assessment || selectedIncident.isFieldVerified ? (
                              <span className="font-mono-label text-[9px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                INGESTED
                              </span>
                            ) : (
                              <span className="font-mono-label text-[9px] text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                                PENDING RECON
                              </span>
                            )}
                          </div>

                          {intelligenceData.latest_assessment ? (
                            <div className="space-y-2.5 text-[11px] font-mono-label">
                              {/* Modality & Confidence Header Banner */}
                              <div className="p-2.5 bg-surface-container rounded-lg border border-primary/30 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-on-surface-variant font-bold uppercase tracking-wider">
                                    {intelligenceData.latest_assessment.id}
                                  </span>
                                  <span className="text-primary font-bold">
                                    {intelligenceData.latest_assessment.timestamp}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                                    {intelligenceData.latest_assessment.mode} • {intelligenceData.latest_assessment.confidence}% CONF
                                  </span>
                                </div>
                              </div>

                              {/* Structured Field Data Table */}
                              <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60 space-y-2">
                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">Place / Area:</span>
                                  <span className="text-on-surface font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.area_surveyed || selectedIncident.location || 'Active Zone'}
                                  </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">Weather:</span>
                                  <span className="text-cyan-400 font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.weather || 'Clear'}
                                  </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">Damaged Structures:</span>
                                  <span className="text-red-400 font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.structures_damaged} unit(s)
                                  </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">Road Status:</span>
                                  <span className="text-amber-400 font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.road_accessibility}
                                  </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">People Observed:</span>
                                  <span className="text-primary font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.people_observed || 'None reported'}
                                  </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">Hazards Detected:</span>
                                  <span className="text-red-300 font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.hazards_detected || 'None flagged'}
                                  </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                                  <span className="text-on-surface-variant text-[11px] shrink-0">Rec. Resources:</span>
                                  <span className="text-emerald-400 font-bold text-right text-[11px]">
                                    {intelligenceData.latest_assessment.recommended_resources || 'Standard response'}
                                  </span>
                                </div>

                                {intelligenceData.latest_assessment.evacuation_status && (
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-on-surface-variant text-[11px] shrink-0">Evacuation Route:</span>
                                    <span className={`font-bold text-right text-[11px] ${
                                      intelligenceData.latest_assessment.evacuation_status === 'Clear' || intelligenceData.latest_assessment.evacuation_status.includes('Clear')
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                    }`}>
                                      {intelligenceData.latest_assessment.evacuation_status}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {intelligenceData.latest_assessment.operator_notes && (
                                <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60 space-y-1">
                                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                                    Operator Notes:
                                  </span>
                                  <p className="text-[11px] font-body-sm text-on-surface italic leading-snug">
                                    "{intelligenceData.latest_assessment.operator_notes}"
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 text-[11px] font-mono-label text-on-surface-variant">
                              <div className="flex items-center justify-between">
                                <span>Resource Coverage:</span>
                                <strong className="text-primary">{selectedIncident.resourceCoverage || '60%'}</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Estimated Perimeter:</span>
                                <strong className="text-on-surface">{selectedIncident.affectedAreaSqKm || '12.4 km²'}</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>First Ingested:</span>
                                <strong className="text-on-surface">{selectedIncident.timeReported || '10:35 AM'}</strong>
                              </div>
                              <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug bg-surface-container p-2.5 rounded-lg border border-outline-variant/60">
                                No field assessment report submitted yet. Dispatch UAV or ground unit to ingest damage metrics.
                              </p>
                            </div>
                          )}
                        </div>

                        {onOpenAssessment && (
                          <button
                            type="button"
                            onClick={onOpenAssessment}
                            className="w-full py-2 px-3 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary font-mono-label text-[11px] font-bold rounded-lg uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">satellite_alt</span>
                            Conduct New Assessment →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Warnings & Constraints if any */}
                    {(intelligenceData.decision_support.warnings.length > 0 || intelligenceData.decision_support.blocking_factors.length > 0) && (
                      <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-1.5 font-mono-label text-[11px]">
                        {intelligenceData.decision_support.warnings.map((w: string, idx: number) => (
                          <div key={idx} className="text-amber-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[15px]">warning</span>
                            <span>{w}</span>
                          </div>
                        ))}
                        {intelligenceData.decision_support.blocking_factors.map((bf: string, idx: number) => (
                          <div key={idx} className="text-red-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[15px]">block</span>
                            <span>{bf}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Unified Tactical Deployments & Matching Squads */}
                    <div className="space-y-2.5">
                      <div className="text-[11px] font-mono-label text-on-surface-variant font-bold uppercase flex items-center justify-between">
                        <span>Tactical Action Directives &amp; Resource Allocation:</span>
                        <span className="text-[10px] text-primary">Single-Click Dispatch</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {intelligenceData.decision_support.recommended_actions.map((act: DecisionActionItem, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-surface-container/70 hover:bg-surface-container border border-outline-variant/70 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-mono-label text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                                  act.priority === 'CRITICAL'
                                    ? 'bg-red-950/30 text-red-400 border-red-500/30'
                                    : act.priority === 'HIGH'
                                    ? 'bg-amber-950/30 text-amber-400 border-amber-500/30'
                                    : 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30'
                                }`}>
                                  {act.priority}
                                </span>
                                <span className="font-mono-label font-bold text-on-surface text-[12px]">
                                  {act.action}
                                </span>
                                {act.capability && (
                                  <span className="font-mono-label text-[9px] text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20 uppercase">
                                    {act.capability}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-on-surface-variant font-body-sm leading-relaxed">
                                {act.reason}
                              </p>
                            </div>

                            {act.resource_id && (
                              <button
                                type="button"
                                disabled={isDeployingResource === act.resource_id}
                                onClick={() => handleApproveAndDeploy(`rec-${act.resource_id}`, act.resource_id!, act.reason)}
                                className="px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded-lg uppercase cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[15px]">send</span>
                                {isDeployingResource === act.resource_id ? 'Dispatching...' : 'Deploy Squad →'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-surface-container rounded-lg border border-outline-variant text-center font-mono-label text-[11px] text-on-surface-variant">
                    Synthesizing intelligence vectors and tactical matching...
                  </div>
                )}
              </section>



              {/* 4. Evidence & Explainable Confidence Telemetry */}
              {/* 4. Authority Lifecycle & Operational Actions */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                    Authority Lifecycle Control
                  </h4>
                  <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                    selectedIncident.status === 'ACTIVE'
                      ? 'bg-red-950/30 text-red-400 border-red-500/40'
                      : selectedIncident.status === 'PENDING'
                      ? 'bg-amber-950/30 text-amber-400 border-amber-500/40'
                      : selectedIncident.status === 'MONITORING'
                      ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/40'
                      : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40'
                  }`}>
                    STATUS: {selectedIncident.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('ACTIVE')}
                    disabled={selectedIncident.status === 'ACTIVE' || isUpdatingStatus}
                    className={`px-3 py-1.5 rounded font-mono-label text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      selectedIncident.status === 'ACTIVE'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 opacity-50 cursor-not-allowed'
                        : 'bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/30'
                    }`}
                  >
                    Set Active
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('MONITORING')}
                    disabled={selectedIncident.status === 'MONITORING' || isUpdatingStatus}
                    className={`px-3 py-1.5 rounded font-mono-label text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      selectedIncident.status === 'MONITORING'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 opacity-50 cursor-not-allowed'
                        : 'bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    Set Monitoring
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('RESOLVED')}
                    disabled={selectedIncident.status === 'RESOLVED' || isUpdatingStatus}
                    className={`px-3 py-1.5 rounded font-mono-label text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      selectedIncident.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 opacity-50 cursor-not-allowed'
                        : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Resolve Incident
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateDossierReport()}
                    disabled={isGeneratingReport}
                    className="ml-auto px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-primary/40 text-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">description</span>
                    {isGeneratingReport ? 'Compiling SITREP...' : 'Generate SITREP Dossier'}
                  </button>
                </div>
              </section>
            </>
            )
          })() : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an incident from the registry to view detailed intelligence dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
