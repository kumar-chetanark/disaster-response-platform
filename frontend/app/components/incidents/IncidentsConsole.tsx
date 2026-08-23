'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Incident, IncidentConfidenceTelemetry, EvidenceBreakdownItem, ContradictionItem, IncidentRequirementsResponse, IncidentCapabilityRequirement, OperationRecord, LiveOperationalTelemetry, ResourceTelemetryState, IncidentIntelligenceTelemetry, DecisionActionItem, IncidentGeospatialContext, GeospatialResource, GeospatialOperation } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import { platformDataService } from '../../services/dataService'

interface IncidentsConsoleProps {
  incidents?: Incident[]
  selectedIncidentId?: string | null
  advisories?: any[]
  onSelectIncident?: (id: string) => void
  onOpenAssessment?: () => void
  onOpenOperations?: (opId?: string) => void
  onOpenReportPreview?: (reportId?: string) => void
}

export default function IncidentsConsole({
  incidents: initialIncidents = [],
  selectedIncidentId: initialSelectedId = null,
  advisories = [],
  onSelectIncident,
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
  }, [])

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    platformDataService.toggleStar('incident', id)
    setStarredIds(new Set(platformDataService.getStarredIds('incident')))
  }

  const handleDeleteIncident = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to permanently delete Incident ${id}? This action cannot be undone and will clean up all associated alerts and logs across the platform.`)) {
      return
    }
    setDeletingId(id)
    try {
      const ok = await platformDataService.deleteIncident(id)
      if (ok) {
        setIncidentsList((prev) => prev.filter((i) => i.id !== id))
        if (selectedIncidentId === id) {
          setSelectedIncidentId(null)
          setSelectedIncidentDetail(null)
        }
      }
    } catch (err) {
      console.error('Delete incident failed:', err)
    } finally {
      setDeletingId(null)
    }
  }
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)

  // Real backend live state & in-memory dossier cache to eliminate switching latency
  const [incidentsList, setIncidentsList] = useState<Incident[]>(initialIncidents)
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
      const refreshedOps = await platformDataService.getIncidentOperations(selectedIncident.id)
      setIncidentOperations(refreshedOps)
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
        const refreshedOps = await platformDataService.getIncidentOperations(selectedIncident.id)
        setIncidentOperations(refreshedOps)
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
    try {
      if (onOpenReportPreview) {
        onOpenReportPreview(selectedIncident.id)
      } else {
        const newReport = await platformDataService.createReport({
          title: `SITREP — ${selectedIncident.title} (${selectedIncident.location})`,
          report_type: 'Situation Report',
          incident_id: selectedIncident.id,
          author: 'Commander R. Vance',
          status: 'OFFICIAL',
          summary: `Comprehensive operational situation dossier for ${selectedIncident.title}. Priority Level: ${selectedIncident.priorityLevel || selectedIncident.severity}. Status: ${selectedIncident.status}. Estimated affected population: ${selectedIncident.affectedPopulationEst || 0}.`,
        })
        if (newReport) {
          setReportSuccessMsg(`Dossier SITREP generated successfully (ID: ${newReport.id}).`)
          if (typeof window !== 'undefined') {
            window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/${newReport.id}/download`, '_blank')
          }
        }
      }
    } catch (err: any) {
      console.error('Error generating dossier report:', err)
      setStatusActionError(err.message || 'Failed to generate SITREP report.')
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
      }
    } catch (err: any) {
      console.error('Failed to transition incident status:', err)
      setStatusActionError(err.message || 'Status transition failed')
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
                      <div className="flex items-center gap-1.5 flex-wrap">
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

                      <span className="font-mono-label text-[10px] text-on-surface-variant">
                        {inc.lastUpdated || inc.timeReported}
                      </span>
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
          {selectedIncident ? (
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
                  { label: 'Affected Population', value: selectedIncident.affectedPopulationEst || 'Estimated ~12,500' },
                ]}
              />

              {/* 2. Situational Impact & Ground Verification */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                    Situational Impact &amp; Field Verification
                  </h4>
                  {selectedIncident.isFieldVerified ? (
                    <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Field Recon Verified
                    </span>
                  ) : (
                    <span className="font-mono-label text-[10px] text-tertiary bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/20">
                      Unverified Sensor Model
                    </span>
                  )}
                </div>

                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3 rounded border border-outline-variant leading-relaxed">
                  {selectedIncident.impact || 'Ground impact model synchronized with central command intelligence.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono-label text-[11px]">
                  <div className="p-2 bg-surface-container rounded border border-outline-variant/60">
                    <span className="text-outline block text-[10px]">Resource Coverage</span>
                    <span className="text-primary font-bold text-[12px]">{selectedIncident.resourceCoverage || '60%'}</span>
                  </div>
                  <div className="p-2 bg-surface-container rounded border border-outline-variant/60">
                    <span className="text-outline block text-[10px]">Estimated Area</span>
                    <span className="text-on-surface font-bold text-[12px]">{selectedIncident.affectedAreaSqKm || '12.4 km²'}</span>
                  </div>
                  <div className="p-2 bg-surface-container rounded border border-outline-variant/60">
                    <span className="text-outline block text-[10px]">First Reported</span>
                    <span className="text-on-surface font-bold text-[12px]">{selectedIncident.timeReported || '10:35 AM'}</span>
                  </div>
                  <div className="p-2 bg-surface-container rounded border border-outline-variant/60">
                    <span className="text-outline block text-[10px]">Last Signal</span>
                    <span className="text-on-surface font-bold text-[12px]">{selectedIncident.lastUpdated || 'Just now'}</span>
                  </div>
                </div>
              </section>

              {/* 2. Automated Incident Intelligence & Decision Support (Phase 8 Decision Layer) */}
              <section className="bg-surface-container-lowest border border-primary/40 rounded-lg p-4 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                    <div>
                      <h4 className="font-headline-sm text-[13px] font-bold text-on-surface">
                        Automated Incident Intelligence &amp; Decision Support
                      </h4>
                      <div className="text-[10px] font-mono-label text-on-surface-variant">
                        DECISION SUPPORT — AUTHORITY ACTION REQUIRED
                      </div>
                    </div>
                  </div>
                  {intelligenceData && (
                    <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                      intelligenceData.confidence.level === 'HIGH'
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40'
                        : intelligenceData.confidence.level === 'MODERATE'
                        ? 'bg-amber-950/30 text-amber-400 border-amber-500/40'
                        : 'bg-red-950/30 text-red-400 border-red-500/40'
                    }`}>
                      {intelligenceData.confidence.score}% CONFIDENCE • {intelligenceData.priority.level}
                    </span>
                  )}
                </div>

                {intelligenceData ? (
                  <div className="space-y-3">
                    {/* Situation Narrative */}
                    <div className="p-3 bg-surface-container rounded border border-outline-variant/80 text-[12px] font-body-sm leading-relaxed text-on-surface">
                      <span className="font-bold text-primary font-mono-label mr-1.5 uppercase text-[11px]">Intelligence Brief:</span>
                      {intelligenceData.situation_summary}
                    </div>

                    {/* Blocking Factors & Warnings if any */}
                    {intelligenceData.decision_support.warnings.length > 0 && (
                      <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded space-y-1">
                        {intelligenceData.decision_support.warnings.map((w: string, idx: number) => (
                          <div key={idx} className="text-[11px] text-amber-300 font-mono-label flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            {w}
                          </div>
                        ))}
                      </div>
                    )}
                    {intelligenceData.decision_support.blocking_factors.length > 0 && (
                      <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded space-y-1">
                        {intelligenceData.decision_support.blocking_factors.map((bf: string, idx: number) => (
                          <div key={idx} className="text-[11px] text-red-300 font-mono-label flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">block</span>
                            {bf}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommended Decision Directives */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono-label text-on-surface-variant font-bold uppercase">
                        Recommended Tactical Actions:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {intelligenceData.decision_support.recommended_actions.map((act: DecisionActionItem, idx: number) => (
                          <div key={idx} className="p-2.5 bg-surface-container rounded border border-outline-variant/80 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                                  act.priority === 'CRITICAL'
                                    ? 'bg-red-950/30 text-red-400 border-red-500/30'
                                    : act.priority === 'HIGH'
                                    ? 'bg-amber-950/30 text-amber-400 border-amber-500/30'
                                    : 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30'
                                }`}>
                                  {act.priority}
                                </span>
                                <span className="font-mono-label font-bold text-primary">
                                  {act.action}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant font-body-sm leading-snug">
                                {act.reason}
                              </p>
                            </div>
                            {act.resource_id && (
                              <button
                                type="button"
                                disabled={isDeployingResource === act.resource_id}
                                onClick={() => handleApproveAndDeploy(`rec-${act.resource_id}`, act.resource_id!, act.reason)}
                                className="px-3 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[10px] font-bold rounded uppercase cursor-pointer transition-colors shrink-0 flex items-center gap-1 self-start sm:self-auto"
                              >
                                <span className="material-symbols-outlined text-[13px]">send</span>
                                Execute {act.action} →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container rounded border border-outline-variant text-center font-mono-label text-[11px] text-on-surface-variant">
                    Synthesizing intelligence vectors...
                  </div>
                )}
              </section>

              {/* 3. Geospatial Command Center & Live Incident Map (Phase 9) */}
              <section className="bg-surface-container-lowest border border-cyan-500/40 rounded-lg p-4 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-[20px]">explore</span>
                    <div>
                      <h4 className="font-headline-sm text-[13px] font-bold text-on-surface">
                        GEOSPATIAL COMMAND CENTER
                      </h4>
                      <div className="text-[10px] font-mono-label text-on-surface-variant">
                        LIVE INCIDENT • RESOURCE • MISSION POSITION
                      </div>
                    </div>
                  </div>
                  {geospatialData && (
                    <div className="flex items-center gap-2">
                      <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        geospatialData.map_summary.incident_coordinates_available
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-950/30 text-amber-400 border-amber-500/40'
                      }`}>
                        {geospatialData.map_summary.incident_coordinates_available ? 'GPS GEO-MAPPED' : 'COORDINATES UNAVAILABLE'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Map Grid / Geospatial Entity Matrix */}
                {geospatialData ? (
                  <div className="space-y-3">
                    {/* Map Legend Bar */}
                    <div className="flex flex-wrap items-center gap-3 p-2 bg-surface-container rounded border border-outline-variant text-[10px] font-mono-label">
                      <span className="text-on-surface-variant font-bold uppercase">MAP LEGEND:</span>
                      <span className="flex items-center gap-1 text-red-400">
                        <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> INCIDENT
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> AVAILABLE SQUAD
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span> ASSIGNED
                      </span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span> EN ROUTE
                      </span>
                      <span className="flex items-center gap-1 text-purple-400">
                        <span className="h-2 w-2 rounded-full bg-purple-500 inline-block"></span> ON SCENE
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <span className="h-2 w-2 rounded-full bg-cyan-500 inline-block"></span> ACTIVE MISSION
                      </span>
                    </div>

                    {/* Operational Map Canvas & Entities Layer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Left 2 Cols: Tactical Geographic Radar / Sector Positions */}
                      <div className="md:col-span-2 bg-surface-container-low rounded border border-outline-variant/80 p-3 space-y-2 relative min-h-[220px]">
                        <div className="flex items-center justify-between text-[11px] font-mono-label text-on-surface-variant pb-1 border-b border-outline-variant/60">
                          <span className="font-bold uppercase text-primary">Sector Grid Position:</span>
                          <span>{geospatialData.incident.location_name}</span>
                        </div>

                        {/* Incident Position Card */}
                        <div
                          onClick={() => setSelectedMapEntity({ type: 'incident', data: geospatialData.incident })}
                          className="p-2.5 bg-red-950/20 border border-red-500/40 rounded cursor-pointer hover:border-red-400 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-400 text-[18px]">crisis_alert</span>
                            <div>
                              <div className="text-[12px] font-bold text-on-surface">{geospatialData.incident.title}</div>
                              <div className="text-[10px] font-mono-label text-on-surface-variant">
                                {geospatialData.incident.severity} • {geospatialData.incident.status} • {geospatialData.incident.priority_level}
                              </div>
                            </div>
                          </div>
                          <div className="text-right font-mono-label text-[10px]">
                            <div className="text-red-400 font-bold">TARGET INCIDENT</div>
                            <div className="text-on-surface-variant">
                              {geospatialData.incident.coordinates_available
                                ? `${geospatialData.incident.latitude?.toFixed(4)}, ${geospatialData.incident.longitude?.toFixed(4)}`
                                : 'COORDINATES UNAVAILABLE'}
                            </div>
                          </div>
                        </div>

                        {/* Active Missions Overlay */}
                        {geospatialData.operations.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-mono-label uppercase text-cyan-400 font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">navigation</span>
                              Active Missions ({geospatialData.operations.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {geospatialData.operations.map((op: GeospatialOperation) => (
                                <div
                                  key={op.operation_id}
                                  onClick={() => setSelectedMapEntity({ type: 'operation', data: op })}
                                  className="p-2 bg-surface-container rounded border border-cyan-500/40 cursor-pointer hover:border-cyan-400 transition-colors text-[11px] font-mono-label flex flex-col justify-between"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-cyan-300 truncate mr-1">{op.resource_name}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 shrink-0">
                                      {op.status}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-on-surface-variant truncate">
                                    Obj: {op.mission_objective}
                                  </div>
                                  <div className="text-[9px] text-on-surface-variant mt-1 flex items-center justify-between border-t border-outline-variant/40 pt-1">
                                    <span>Auth: {op.authorized_by.split(' ')[0]}</span>
                                    <span className="text-cyan-400 font-bold">
                                      {op.distance_to_incident_km !== null ? `${op.distance_to_incident_km} km away` : 'Dist N/A'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Surrounding Tracked Squads */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-mono-label uppercase text-on-surface-variant font-bold flex items-center justify-between">
                            <span>Tracked Units in Sector ({geospatialData.resources.length})</span>
                            <span className="text-outline font-normal">
                              {geospatialData.map_summary.mapped_resources_count} GPS Enabled
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {geospatialData.resources.slice(0, 4).map((r: GeospatialResource) => (
                              <div
                                key={r.resource_id}
                                onClick={() => setSelectedMapEntity({ type: 'resource', data: r })}
                                className="p-2 bg-surface-container rounded border border-outline-variant/80 cursor-pointer hover:border-primary/60 transition-colors text-[11px] font-mono-label flex items-center justify-between"
                              >
                                <div className="truncate mr-2">
                                  <div className="font-bold text-on-surface truncate">{r.name}</div>
                                  <div className="text-[9px] text-on-surface-variant capitalize">
                                    {r.category} • {r.base_location}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                                    r.operational_state === 'AVAILABLE'
                                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                                      : 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30'
                                  }`}>
                                    {r.operational_state}
                                  </span>
                                  <div className="text-[9px] text-on-surface-variant mt-0.5">
                                    {r.distance_to_incident_km !== null ? `${r.distance_to_incident_km} km` : 'Pos Known'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right 1 Col: Selected Entity Inspector / Telemetry Inspector */}
                      <div className="bg-surface-container rounded border border-outline-variant/80 p-3 space-y-2 font-mono-label text-[11px]">
                        <div className="text-[10px] uppercase font-bold text-primary pb-1 border-b border-outline-variant/60 flex items-center justify-between">
                          <span>Entity Inspector:</span>
                          <span className="text-on-surface-variant">{selectedMapEntity ? selectedMapEntity.type.toUpperCase() : 'SELECT ENTITY'}</span>
                        </div>

                        {selectedMapEntity ? (
                          <div className="space-y-2">
                            {selectedMapEntity.type === 'incident' && (
                              <div className="space-y-1 text-on-surface">
                                <div className="font-bold text-[12px]">{selectedMapEntity.data.title}</div>
                                <div className="text-on-surface-variant text-[10px]">Location: {selectedMapEntity.data.location_name}</div>
                                <div className="text-on-surface-variant text-[10px]">Severity: {selectedMapEntity.data.severity}</div>
                                <div className="text-on-surface-variant text-[10px]">Confidence: {selectedMapEntity.data.confidence_score}%</div>
                                <div className="text-on-surface-variant text-[10px]">
                                  Coordinates: {selectedMapEntity.data.coordinates_available
                                    ? `${selectedMapEntity.data.latitude}, ${selectedMapEntity.data.longitude}`
                                    : 'COORDINATES UNAVAILABLE'}
                                </div>
                              </div>
                            )}
                            {selectedMapEntity.type === 'operation' && (
                              <div className="space-y-1 text-on-surface">
                                <div className="font-bold text-[12px] text-cyan-400">Mission #{selectedMapEntity.data.operation_id}</div>
                                <div className="text-on-surface-variant text-[10px]">Unit: {selectedMapEntity.data.resource_name}</div>
                                <div className="text-on-surface-variant text-[10px]">Status: {selectedMapEntity.data.status}</div>
                                <div className="text-on-surface-variant text-[10px]">Authorized By: {selectedMapEntity.data.authorized_by}</div>
                                <div className="text-on-surface-variant text-[10px]">Objective: {selectedMapEntity.data.mission_objective}</div>
                                <div className="text-cyan-300 text-[10px]">
                                  Distance: {selectedMapEntity.data.distance_to_incident_km !== null
                                    ? `${selectedMapEntity.data.distance_to_incident_km} km`
                                    : 'Position estimated'}
                                </div>
                              </div>
                            )}
                            {selectedMapEntity.type === 'resource' && (
                              <div className="space-y-1 text-on-surface">
                                <div className="font-bold text-[12px]">{selectedMapEntity.data.name}</div>
                                <div className="text-on-surface-variant text-[10px]">Category: {selectedMapEntity.data.category}</div>
                                <div className="text-on-surface-variant text-[10px]">Base: {selectedMapEntity.data.base_location}</div>
                                <div className="text-on-surface-variant text-[10px]">Status: {selectedMapEntity.data.operational_state}</div>
                                <div className="text-on-surface-variant text-[10px]">Personnel: {selectedMapEntity.data.personnel_count} active</div>
                                <div className="text-emerald-400 text-[10px]">
                                  Distance to Incident: {selectedMapEntity.data.distance_to_incident_km !== null
                                    ? `${selectedMapEntity.data.distance_to_incident_km} km`
                                    : 'LAST KNOWN POSITION'}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-on-surface-variant text-[10px] py-8 text-center leading-relaxed">
                            Click any incident, squad, or mission card to inspect real-time geospatial telemetry.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container rounded border border-outline-variant text-center font-mono-label text-[11px] text-on-surface-variant">
                    Loading geospatial command telemetry...
                  </div>
                )}
              </section>

              {/* 4. Evidence & Explainable Confidence Telemetry */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                    Multi-Source Evidence &amp; Confidence Ledger
                  </h4>
                  {confidenceData ? (
                    <div className="flex items-center gap-2">
                      <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        confidenceData.confidence_level === 'HIGH'
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40'
                          : confidenceData.confidence_level === 'MODERATE'
                          ? 'bg-amber-950/30 text-amber-400 border-amber-500/40'
                          : 'bg-red-950/30 text-red-400 border-red-500/40'
                      }`}>
                        {confidenceData.confidence_score}% CONFIDENCE ({confidenceData.confidence_level})
                      </span>
                      <span className="font-mono-label text-[10px] text-on-surface-variant">
                        {confidenceData.independent_source_count} INDEPENDENT {confidenceData.independent_source_count === 1 ? 'SOURCE' : 'SOURCES'}
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono-label text-[10px] text-outline">
                      {isLoadingConfidence ? 'Calculating telemetry...' : 'INSUFFICIENT EVIDENCE'}
                    </span>
                  )}
                </div>

                {confidenceData ? (
                  <div className="space-y-3">
                    {/* Score Breakdown Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {confidenceData.breakdown.map((b: EvidenceBreakdownItem, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-surface-container rounded border border-outline-variant/70 flex flex-col justify-between text-[11px]"
                        >
                          <div className="flex items-center justify-between font-mono-label">
                            <span className="text-primary font-bold">{b.source_type} ({b.count})</span>
                            <span className={b.contribution >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                              {b.contribution >= 0 ? `+${b.contribution}` : b.contribution} pts
                            </span>
                          </div>
                          <p className="font-body-sm text-[11px] text-on-surface-variant mt-1 leading-snug">
                            {b.reason}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Contradictions Alert if any */}
                    {confidenceData.contradictions && confidenceData.contradictions.length > 0 && (
                      <div className="p-3 bg-red-950/20 border border-red-500/30 rounded space-y-1">
                        <div className="flex items-center gap-1.5 text-red-400 font-mono-label text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[15px]">report_problem</span>
                          {confidenceData.contradictions.length} Conflicting Evidence Item(s) Flagged
                        </div>
                        {confidenceData.contradictions.map((c: ContradictionItem) => (
                          <div key={c.id} className="text-[11px] text-red-300/90 font-body-sm">
                            • [{c.timestamp}] {c.source_label}: {c.reason} ({c.penalty} pts)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container rounded border border-outline-variant text-center font-mono-label text-[11px] text-on-surface-variant">
                    Initial evidence ingested. Multi-source corroboration in progress.
                  </div>
                )}
              </section>

              {/* 4. Multi-Channel Corroborating Feed */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
                    Multi-Channel Corroboration ({totalSourcesCount} Total Signals)
                  </h4>
                  <div className="flex items-center gap-1.5 font-mono-label text-[10px] flex-wrap">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 font-bold">
                      {citizenCount} Citizen {citizenCount === 1 ? 'Report' : 'Reports'}
                    </span>
                    {newsCount > 0 && (
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface rounded border border-outline-variant">
                        {newsCount} News
                      </span>
                    )}
                    {govCount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 rounded border border-emerald-500/30">
                        {govCount} Government
                      </span>
                    )}
                    {weatherCount > 0 && (
                      <span className="px-2 py-0.5 bg-sky-950/20 text-sky-400 rounded border border-sky-500/30">
                        {weatherCount} Weather/IMD
                      </span>
                    )}
                    {reconCount > 0 && (
                      <span className="px-2 py-0.5 bg-tertiary/10 text-tertiary rounded border border-tertiary/20">
                        {reconCount} Field Recon
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedIncident.reports && selectedIncident.reports.length > 0 ? (
                    selectedIncident.reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 bg-surface-container rounded border border-outline-variant/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-label text-[10px] text-primary font-bold">
                              {rep.sourceLabel || rep.sourceType}
                            </span>
                            <span className="font-mono-label text-[9px] bg-surface-container-high px-1.5 py-0.2 rounded border border-outline-variant">
                              {rep.channelBadge || 'SOURCE'}
                            </span>
                          </div>
                          <span className="font-mono-label text-[10px] text-on-surface-variant">
                            {rep.timestamp}
                          </span>
                        </div>
                        <p className="font-body-sm text-[12px] text-on-surface leading-relaxed">
                          {rep.summary}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-surface-container rounded border border-outline-variant text-center font-mono-label text-[11px] text-on-surface-variant">
                      Single corroborating source attached.
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Live Command Center Operational Telemetry (Phase 7 Real-Time Synchronization) */}
              <section className="bg-surface-container-lowest border border-cyan-500/30 rounded-lg p-4 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                    </span>
                    Live Operational Command Telemetry
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-label text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">sync</span>
                      LIVE • Updated {lastRefreshedSec}s ago
                    </span>
                  </div>
                </div>

                {/* Telemetry Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center font-mono-label">
                  <div className="p-2.5 bg-surface-container rounded border border-outline-variant">
                    <div className="text-[18px] font-bold text-cyan-400">
                      {telemetryData ? telemetryData.active_operation_count : 0}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5">Active Missions</div>
                  </div>
                  <div className="p-2.5 bg-surface-container rounded border border-outline-variant">
                    <div className="text-[18px] font-bold text-amber-400">
                      {telemetryData ? telemetryData.resources_assigned : 0}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5">Assigned</div>
                  </div>
                  <div className="p-2.5 bg-surface-container rounded border border-outline-variant">
                    <div className="text-[18px] font-bold text-blue-400">
                      {telemetryData ? telemetryData.resources_en_route : 0}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5">En Route</div>
                  </div>
                  <div className="p-2.5 bg-surface-container rounded border border-outline-variant">
                    <div className="text-[18px] font-bold text-purple-400">
                      {telemetryData ? telemetryData.resources_on_scene : 0}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5">On Scene</div>
                  </div>
                  <div className="p-2.5 bg-surface-container rounded border border-outline-variant">
                    <div className="text-[18px] font-bold text-emerald-400">
                      {telemetryData ? telemetryData.resources_available : 0}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5">Available</div>
                  </div>
                  <div className="p-2.5 bg-surface-container rounded border border-outline-variant">
                    <div className="text-[18px] font-bold text-emerald-300">
                      {telemetryData ? telemetryData.completed_operation_count : 0}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5">Completed</div>
                  </div>
                </div>

                {/* Resource State Grid */}
                {telemetryData && telemetryData.latest_resource_states && telemetryData.latest_resource_states.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-mono-label text-on-surface-variant font-bold uppercase flex items-center justify-between">
                      <span>Live Squad Readiness &amp; Deployment:</span>
                      <span className="text-[10px] text-outline font-normal">
                        {telemetryData.latest_resource_states.length} Active Tracked Units
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {telemetryData.latest_resource_states.slice(0, 6).map((res: ResourceTelemetryState) => (
                        <div key={res.resource_id} className="p-2 bg-surface-container rounded border border-outline-variant/70 text-[11px] flex items-center justify-between font-mono-label">
                          <div className="truncate mr-2">
                            <div className="font-bold text-on-surface truncate">{res.name}</div>
                            <div className="text-[9px] text-on-surface-variant capitalize">{res.category} • {res.last_updated}</div>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 border ${
                            res.status === 'AVAILABLE'
                              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                              : 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30'
                          }`}>
                            {res.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* 5. Incident-Specific AI Operational Recommendations & Requirements */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                    Resource Requirements &amp; AI Recommendations
                  </h4>
                  <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Incident Specific
                  </span>
                </div>

                {/* Capability Requirements Breakdown */}
                {requirementsData && requirementsData.requirements && requirementsData.requirements.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono-label text-on-surface-variant font-bold uppercase">
                      Required Tactical Capabilities:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {requirementsData.requirements.map((req: IncidentCapabilityRequirement, idx: number) => (
                        <div key={idx} className="p-2.5 bg-surface-container rounded border border-outline-variant text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono-label font-bold text-primary uppercase">
                              {req.capability} (min {req.minimum_units} unit)
                            </span>
                            <span className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              req.priority === 'CRITICAL' ? 'bg-red-950/30 text-red-400 border border-red-500/30' : 'bg-amber-950/30 text-amber-400 border border-amber-500/30'
                            }`}>
                              {req.priority}
                            </span>
                          </div>
                          <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                            {req.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deployError && (
                  <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded text-red-400 text-[11px] font-mono-label">
                    {deployError}
                  </div>
                )}

                {/* Recommended Matching Resources */}
                {(() => {
                  const matchingAdvisories = advisories.filter(
                    (adv) => adv.targetIncidentId === selectedIncident.id || !adv.targetIncidentId
                  )

                  if (matchingAdvisories.length === 0) {
                    return (
                      <div className="p-3 bg-surface-container rounded border border-outline-variant/60 text-center font-mono-label text-[11px] text-on-surface-variant">
                        No suitable resources currently available.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono-label text-on-surface-variant font-bold uppercase">
                        Recommended Matching Units:
                      </div>
                      {matchingAdvisories.map((adv) => (
                        <div
                          key={adv.id}
                          className="p-3 bg-surface-container rounded border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono-label text-[11px] text-primary font-bold">
                                {adv.resourceName || adv.recommendedResourceName}
                              </span>
                              <span className="font-mono-label text-[9px] bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                                {adv.metrics?.capabilityMatch || 95}% MATCH
                              </span>
                              {adv.resourceId && (
                                <span className="font-mono-label text-[9px] text-outline">
                                  ID: {adv.resourceId}
                                </span>
                              )}
                            </div>
                            <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                              {adv.reason || adv.details} • ETA: {adv.metrics?.travelTime || '15 mins'}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={isDeployingResource === adv.resourceId}
                            onClick={() => handleApproveAndDeploy(adv.id, adv.resourceId || adv.id, adv.reason)}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[10px] font-bold rounded uppercase cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            {isDeployingResource === adv.resourceId ? 'Deploying...' : 'Approve & Deploy →'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Live Operations & Mission Tracking for this incident */}
                {incidentOperations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-outline-variant">
                    <div className="text-[11px] font-mono-label text-on-surface-variant font-bold uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-cyan-400">near_me</span>
                      Active Mission Deployments ({incidentOperations.length})
                    </div>
                    {incidentOperations.map((op) => (
                      <div key={op.id} className="p-3 bg-surface-container-high rounded border border-cyan-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-label text-[11px] text-cyan-400 font-bold">
                              MISSION #{op.id}: {op.resourceName}
                            </span>
                            <span className="font-mono-label text-[9px] bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                              {op.state}
                            </span>
                          </div>
                          <span className="font-mono-label text-[10px] text-on-surface-variant">
                            {op.dispatchedTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface font-body-sm">
                          {op.missionObjective}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {op.state === 'ASSIGNED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOpStatus(op.id, 'DISPATCHED')}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono-label text-[9px] font-bold rounded uppercase cursor-pointer"
                            >
                              Dispatch Unit →
                            </button>
                          )}
                          {op.state === 'DISPATCHED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOpStatus(op.id, 'EN_ROUTE')}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono-label text-[9px] font-bold rounded uppercase cursor-pointer"
                            >
                              Mark En Route →
                            </button>
                          )}
                          {op.state === 'EN_ROUTE' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOpStatus(op.id, 'ON_SCENE')}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono-label text-[9px] font-bold rounded uppercase cursor-pointer"
                            >
                              Mark On Scene →
                            </button>
                          )}
                          {(op.state === 'ON_SCENE' || op.state === 'IN_PROGRESS' || op.state === 'IN OPERATION') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOpStatus(op.id, 'COMPLETED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono-label text-[9px] font-bold rounded uppercase cursor-pointer"
                            >
                              Complete Mission ✓
                            </button>
                          )}
                          {op.state !== 'COMPLETED' && op.state !== 'CANCELLED' && op.state !== 'RECALLED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOpStatus(op.id, 'RECALLED')}
                              className="px-2.5 py-1 bg-surface-container-highest hover:bg-outline-variant text-on-surface-variant font-mono-label text-[9px] font-bold rounded uppercase cursor-pointer"
                            >
                              Recall Resource
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 5. Authority Lifecycle & Operational Actions */}
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

                {statusActionError && (
                  <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded text-red-400 text-[11px] font-mono-label">
                    {statusActionError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5">
                  {selectedIncident.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusTransition('ACTIVE', 'Verified and escalated to ACTIVE emergency by command authority')}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Verify &amp; Activate →
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusTransition('MONITORING', 'Moved to active radar/field monitoring')}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-cyan-400 font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Move to Monitoring
                      </button>
                    </>
                  )}

                  {selectedIncident.status === 'ACTIVE' && (
                    <>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusTransition('MONITORING', 'Active response stabilized, transitioned to monitoring')}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-cyan-400 font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Transition to Monitoring
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusTransition('RESOLVED', 'Crisis contained and field operations concluded')}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">task_alt</span>
                        Resolve Incident
                      </button>
                    </>
                  )}

                  {selectedIncident.status === 'MONITORING' && (
                    <>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusTransition('ACTIVE', 'Incident escalating, reactivated emergency response')}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Re-escalate to Active
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusTransition('RESOLVED', 'Monitoring period completed successfully')}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">task_alt</span>
                        Resolve Incident
                      </button>
                    </>
                  )}

                  {selectedIncident.status === 'RESOLVED' && (
                    <div className="w-full p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded text-emerald-400 font-mono-label text-[11px] text-center flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Incident formally closed &amp; resolved in disaster registry. Read-only archive.
                    </div>
                  )}
                </div>
              </section>

              {/* 6. Operational Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {onOpenAssessment && (
                  <button
                    type="button"
                    onClick={onOpenAssessment}
                    className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">sensors</span>
                    Launch Field Assessment →
                  </button>
                )}
                <button
                  type="button"
                  disabled={isGeneratingReport}
                  onClick={handleGenerateDossierReport}
                  className="flex-1 py-2.5 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">{isGeneratingReport ? 'hourglass_top' : 'picture_as_pdf'}</span>
                  {isGeneratingReport ? 'Generating Official SITREP...' : 'Generate Incident Dossier PDF'}
                </button>
              </div>
              {reportSuccessMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded text-emerald-400 font-mono-label text-[11px] flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {reportSuccessMsg}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an incident from the registry to view detailed intelligence dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
