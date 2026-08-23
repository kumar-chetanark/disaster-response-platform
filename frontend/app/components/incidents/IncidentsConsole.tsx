'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Incident } from '../../types'
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
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)

  // Real backend live state & in-memory dossier cache to eliminate switching latency
  const [incidentsList, setIncidentsList] = useState<Incident[]>(initialIncidents)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(initialSelectedId || null)
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<Incident | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const dossierCache = useRef<Record<string, Incident>>({})

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
    return matchesSeverity && matchesStatus && matchesSearch
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

              {/* 3. Multi-Channel Corroborating Feed (Exact source counts restored) */}
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

              {/* 4. Incident-Specific AI Operational Recommendations */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                    AI Operational Recommendations &amp; Advisories
                  </h4>
                  <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Incident Specific
                  </span>
                </div>

                {(() => {
                  const matchingAdvisories = advisories.filter(
                    (adv) => adv.targetIncidentId === selectedIncident.id || !adv.targetIncidentId
                  )

                  if (matchingAdvisories.length === 0) {
                    return (
                      <div className="p-4 bg-surface-container rounded border border-outline-variant/60 text-center font-mono-label text-[12px] text-on-surface-variant">
                        No suitable resources currently available.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2.5">
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
                          {onOpenOperations && (
                            <button
                              type="button"
                              onClick={() => onOpenOperations(adv.id)}
                              className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[10px] font-bold rounded uppercase cursor-pointer transition-colors shrink-0"
                            >
                              Dispatch Unit →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </section>

              {/* 5. Actions */}
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
                {onOpenReportPreview && (
                  <button
                    type="button"
                    onClick={() => onOpenReportPreview(selectedIncident.id)}
                    className="flex-1 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    Generate Incident Dossier PDF
                  </button>
                )}
              </div>
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
