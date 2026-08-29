'use client'

import { showConfirmDialog } from '../common/ConfirmDialog'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ActiveAlert } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import { platformDataService, ExternalAlert, IngestionStatus } from '../../services/dataService'
import { toast } from 'react-toastify'

interface AlertsConsoleProps {
  alerts?: ActiveAlert[]
  selectedAlertId?: string | null
  onSelectAlert?: (alert: ActiveAlert | string) => void
  onNavigateToIncident?: (incId: string) => void
  onMarkReviewed?: (altId: string) => void
  onOpenAssessment?: () => void
  onViewOnMap?: (lat: number, lon: number, title: string) => void
  onIncidentCreated?: (incId: string) => void
}

export default function AlertsConsole({
  alerts: initialAlerts = [],
  selectedAlertId: initialSelectedAlertId,
  onSelectAlert,
  onNavigateToIncident,
  onMarkReviewed,
  onOpenAssessment,
  onViewOnMap,
  onIncidentCreated,
}: AlertsConsoleProps) {
  // Navigation Sub-Tab: 'INTERNAL' (Citizen & Sensor Alerts) vs 'EXTERNAL' (Worldwide Disaster Intelligence / GDACS)
  const [activeSubTab, setActiveSubTab] = useState<'INTERNAL' | 'EXTERNAL'>('EXTERNAL')

  // Internal Alerts States
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // External Global Alerts States
  const [externalAlerts, setExternalAlerts] = useState<ExternalAlert[]>([])
  const [isLoadingExternal, setIsLoadingExternal] = useState(false)
  const [externalFilterType, setExternalFilterType] = useState('ALL')
  const [externalFilterSeverity, setExternalFilterSeverity] = useState('ALL')
  const [externalFilterStatus, setExternalFilterStatus] = useState('ALL')
  const [externalSearchQuery, setExternalSearchQuery] = useState('')
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Review Modal State for External Alert Dossier
  const [reviewingAlert, setReviewingAlert] = useState<ExternalAlert | null>(null)
  const [reviewingInternalAlert, setReviewingInternalAlert] = useState<ActiveAlert | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const [alertsList, setAlertsList] = useState<ActiveAlert[]>(initialAlerts)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(initialSelectedAlertId || (initialAlerts[0]?.id ?? null))

  // 1. Initial Load & Background Ingestion Status Polling
  const loadExternalData = useCallback(async () => {
    setIsLoadingExternal(true)
    try {
      const [extList, statusData] = await Promise.all([
        platformDataService.getExternalAlerts({
          eventType: externalFilterType,
          severity: externalFilterSeverity,
          status: externalFilterStatus,
          limit: 100,
        }),
        platformDataService.getIngestionStatus(),
      ])
      setExternalAlerts(extList)
      if (statusData) setIngestionStatus(statusData)
    } catch (err) {
      console.error('Failed to fetch external alerts:', err)
    } finally {
      setIsLoadingExternal(false)
    }
  }, [externalFilterType, externalFilterSeverity, externalFilterStatus])

  useEffect(() => {
    loadExternalData()
    const interval = setInterval(loadExternalData, 15000)
    return () => clearInterval(interval)
  }, [loadExternalData])

  useEffect(() => {
    setStarredIds(platformDataService.getStarredIds('alert'))
  }, [])

  // Manual Trigger Ingestion
  const handleManualIngest = async () => {
    setIsSyncing(true)
    try {
      const res = await platformDataService.triggerManualIngest()
      if (res) {
        setIngestionStatus(res)
        toast.success(`GDACS Ingestion Complete: ${res.newAlerts} new alerts, ${res.updatedAlerts} updated.`, { theme: 'light' })
        loadExternalData()
      }
    } catch (err: any) {
      toast.error('Failed to trigger manual GDACS sync.', { theme: 'light' })
    } finally {
      setIsSyncing(false)
    }
  }

  // Convert External Alert to Incident
  const handleConvertToIncident = async (alert: ExternalAlert) => {
    const confirmed = await showConfirmDialog({
      title: `CREATE INCIDENT FROM GLOBAL ALERT`,
      message: `Convert ${alert.title} (${alert.country || 'Global'}) into an active Incident? This will instantiate an official incident record in the Incident Command Console. No resources will be automatically dispatched.`,
      confirmLabel: 'CREATE INCIDENT',
      type: 'warning',
    })
    if (!confirmed) return

    setIsConverting(true)
    try {
      const res = await platformDataService.convertExternalAlertToIncident(alert.id)
      if (res && res.incident_id) {
        toast.success(`Incident ${res.incident_title || res.incident_id} created from ${alert.source} alert!`, { theme: 'light' })
        setReviewingAlert(null)
        loadExternalData()
        if (onIncidentCreated) onIncidentCreated(res.incident_id)
        if (onNavigateToIncident) onNavigateToIncident(res.incident_id)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert alert to incident', { theme: 'light' })
    } finally {
      setIsConverting(false)
    }
  }

  // Update External Alert Status (e.g. REVIEWED, REJECTED)
  const handleUpdateStatus = async (alertId: string, status: string) => {
    try {
      const ok = await platformDataService.updateExternalAlertStatus(alertId, status)
      if (ok) {
        toast.success(`Alert marked as ${status}.`, { theme: 'light' })
        setExternalAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: status as any } : a))
        if (reviewingAlert && reviewingAlert.id === alertId) {
          setReviewingAlert(prev => prev ? { ...prev, status: status as any } : null)
        }
      }
    } catch (err) {
      toast.error('Failed to update alert status.', { theme: 'light' })
    }
  }

  // Filtered External Alerts
  const filteredExternalAlerts = externalAlerts
    .filter(a => {
      if (externalFilterType !== 'ALL' && a.eventType !== externalFilterType) return false
      if (externalFilterSeverity !== 'ALL' && a.severity !== externalFilterSeverity) return false
      if (externalFilterStatus !== 'ALL' && a.status !== externalFilterStatus) return false
      if (externalSearchQuery) {
        const q = externalSearchQuery.toLowerCase()
        return (
          a.title.toLowerCase().includes(q) ||
          (a.country && a.country.toLowerCase().includes(q)) ||
          (a.locationName && a.locationName.toLowerCase().includes(q)) ||
          a.eventType.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return timeB - timeA
    })

  // Selected Alert for Internal Sub-Tab
  const selectedAlert = alertsList.find(a => a.id === selectedAlertId) || alertsList[0] || null

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">crisis_alert</span>
            <h1 className="font-headline-sm text-[20px] font-bold text-on-surface">
              Alerts &amp; Disaster Intelligence Console
            </h1>
          </div>
          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
            Real-time global early warning feeds, sensor alerts, and authority triage workflows.
          </p>
        </div>

        {/* Global Pipeline Health Status Badge & Manual Ingest Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant font-mono text-[11px]">
            <span className={`w-2 h-2 rounded-full ${ingestionStatus?.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div className="flex flex-col">
              <span className="font-bold text-on-surface">
                {ingestionStatus?.source || 'GDACS'} • {ingestionStatus?.status || 'CONNECTED'}
              </span>
              <span className="text-[9.5px] text-slate-400">
                {ingestionStatus?.lastSuccessfulSync ? `Synced ${new Date(ingestionStatus.lastSuccessfulSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Polling'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualIngest}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-60"
            title="Fetch latest worldwide disaster alerts immediately"
          >
            <span className={`material-symbols-outlined text-[15px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            <span>{isSyncing ? 'SYNCING...' : 'SYNC GDACS'}</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('EXTERNAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[12px] font-bold transition-all cursor-pointer ${
            activeSubTab === 'EXTERNAL'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          <span>EXTERNAL DISASTER INTELLIGENCE (GDACS)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
            {externalAlerts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('INTERNAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[12px] font-bold transition-all cursor-pointer ${
            activeSubTab === 'INTERNAL'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          <span>CITIZEN &amp; SENSOR ALERTS</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
            {alertsList.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: EXTERNAL WORLDWIDE DISASTER INTELLIGENCE (GDACS)                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'EXTERNAL' && (
        <div className="space-y-4">
          {/* External Alerts Filter Bar */}
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400 font-bold uppercase mr-1">Filter:</span>
              
              {/* Event Type Filter */}
              <select
                value={externalFilterType}
                onChange={(e) => setExternalFilterType(e.target.value)}
                className="bg-background border border-outline-variant rounded px-2.5 py-1 text-on-surface outline-none focus:border-primary"
              >
                <option value="ALL">All Event Types</option>
                <option value="EARTHQUAKE">Earthquake</option>
                <option value="FLOOD">Flood</option>
                <option value="TROPICAL_CYCLONE">Tropical Cyclone</option>
                <option value="VOLCANIC_ACTIVITY">Volcanic Activity</option>
                <option value="WILDFIRE">Wildfire</option>
                <option value="DROUGHT">Drought</option>
                <option value="TSUNAMI">Tsunami</option>
                <option value="OTHER">Other Hazards</option>
              </select>

              {/* Severity Filter */}
              <select
                value={externalFilterSeverity}
                onChange={(e) => setExternalFilterSeverity(e.target.value)}
                className="bg-background border border-outline-variant rounded px-2.5 py-1 text-on-surface outline-none focus:border-primary"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical (Red)</option>
                <option value="HIGH">High (Orange)</option>
                <option value="MEDIUM">Medium (Green)</option>
              </select>

              {/* Status Filter */}
              <select
                value={externalFilterStatus}
                onChange={(e) => setExternalFilterStatus(e.target.value)}
                className="bg-background border border-outline-variant rounded px-2.5 py-1 text-on-surface outline-none focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New (Unreviewed)</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="VALIDATED">Validated</option>
                <option value="CONVERTED_TO_INCIDENT">Converted to Incident</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Keyword Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={externalSearchQuery}
                onChange={(e) => setExternalSearchQuery(e.target.value)}
                placeholder="Search country, event, title..."
                className="w-full bg-background border border-outline-variant rounded px-3 py-1 text-[12px] text-on-surface outline-none focus:border-primary placeholder:text-outline"
              />
            </div>
          </div>

          {/* External Alerts Cards Grid */}
          {isLoadingExternal ? (
            <div className="p-8 text-center font-mono text-[12px] text-slate-400 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-sky-400">sync</span>
              <span>Fetching worldwide disaster intelligence from GDACS...</span>
            </div>
          ) : filteredExternalAlerts.length === 0 ? (
            <div className="p-8 bg-surface-container rounded-xl border border-outline-variant text-center space-y-2">
              <span className="material-symbols-outlined text-[32px] text-slate-500">public_off</span>
              <p className="font-mono text-[12px] text-slate-400">
                No external disaster alerts matching current filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredExternalAlerts.map((alert) => {
                const isConverted = alert.status === 'CONVERTED_TO_INCIDENT'
                const isCritical = alert.severity === 'CRITICAL'
                const isHigh = alert.severity === 'HIGH'

                return (
                  <div
                    key={alert.id}
                    className={`p-4 bg-surface rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isConverted
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : isCritical
                        ? 'border-red-500/40 bg-red-950/10 hover:border-red-500'
                        : isHigh
                        ? 'border-orange-500/40 bg-orange-950/10 hover:border-orange-500'
                        : 'border-outline-variant hover:border-primary/50'
                    }`}
                  >
                    {/* Header: Event Type & Country Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono-label text-[10px] font-bold text-sky-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">public</span>
                          {alert.source} • {alert.eventType}
                        </span>

                        <span
                          className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            isCritical
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : isHigh
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          {alert.alertLevel || alert.severity}
                        </span>
                      </div>

                      <h3 className="font-body-base text-[13px] font-bold text-on-surface line-clamp-2 leading-tight">
                        {(() => {
                        let t = alert.title.replace(`[${alert.source}] `, '').trim()
                        // Clean redundant severity prefix text from RSS feed titles
                        t = t.replace(/^(Green|Orange|Red)\s+(notification for\s+|alert in\s+|flood alert in\s+|forest fire notification in\s+|earthquake.*?in\s+|tropical cyclone\s+)/i, (match, p1) => {
                          if (match.toLowerCase().includes('tropical cyclone')) return 'Tropical Cyclone '
                          if (match.toLowerCase().includes('forest fire')) return 'Forest fires in '
                          if (match.toLowerCase().includes('flood')) return 'Flood in '
                          if (match.toLowerCase().includes('earthquake')) return 'Earthquake in '
                          return ''
                        })
                        return t
                      })()}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-300">
                        <span className="material-symbols-outlined text-[13px] text-red-400">pin_drop</span>
                        <span className="truncate">{alert.country || alert.locationName || 'International'}</span>
                      </div>


                    </div>

                    {/* Footer / Status & Action Buttons */}
                    <div className="pt-2 border-t border-outline-variant flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        {alert.status === 'CONVERTED_TO_INCIDENT' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Converted
                          </span>
                        ) : (
                          <span>Status: <strong className="text-slate-300">{alert.status}</strong></span>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {alert.latitude && alert.longitude && (
                          <button
                            type="button"
                            onClick={() => onViewOnMap && onViewOnMap(alert.latitude!, alert.longitude!, alert.title)}
                            className="px-2 py-1 bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-sky-400 font-mono text-[10px] font-bold rounded transition-colors"
                            title="View on Map"
                          >
                            MAP
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setReviewingAlert(alert)}
                          className="px-2.5 py-1 bg-primary text-on-primary font-mono text-[10px] font-bold rounded transition-colors hover:bg-primary-fixed"
                        >
                          REVIEW
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: CITIZEN & SENSOR ALERTS (EXISTING WORKFLOW)                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'INTERNAL' && (
        <div className="space-y-4">
          {alertsList.length === 0 ? (
            <div className="p-8 bg-surface-container rounded-xl border border-outline-variant text-center space-y-2">
              <span className="material-symbols-outlined text-[32px] text-slate-500">notifications_off</span>
              <p className="font-mono text-[12px] text-slate-400">
                No active citizen or sensor alerts currently reported.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {alertsList.map((alert) => {
                const isCritical = alert.severity.toLowerCase() === 'critical'
                const isWarning = alert.severity.toLowerCase() === 'warning'
                const isSelected = selectedAlertId === alert.id

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlertId(alert.id)
                      setReviewingInternalAlert(alert)
                      if (onSelectAlert) onSelectAlert(alert)
                    }}
                    className={`p-4 bg-surface rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                      isSelected
                        ? 'border-primary shadow-md bg-surface-container'
                        : isCritical
                        ? 'border-red-500/40 bg-red-950/10 hover:border-red-500 hover:shadow-lg'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500 hover:shadow-lg'
                        : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono-label text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">sensors</span>
                          {alert.category}
                        </span>

                        <span
                          className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            isCritical
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <h4 className="font-body-base text-[13px] font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {alert.message}
                      </h4>

                      <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[11px] text-slate-300">
                        <span className="material-symbols-outlined text-[13px] text-red-400">pin_drop</span>
                        <span className="truncate">{alert.location}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {alert.alertTime}
                      </span>

                      <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>VIEW DETAILS</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTHORITY REVIEW DOSSIER FOR GLOBAL DISASTER ALERT                 */}
      {/* ========================================================================= */}
      {reviewingAlert && (() => {
        const raw = typeof reviewingAlert.rawData === 'string' 
          ? JSON.parse(reviewingAlert.rawData) 
          : reviewingAlert.rawData || {}

        const severityMetrics = raw.severity_metrics || (raw.severitydata?.severitytext) || null
        const popExposure = raw.population_exposure || reviewingAlert.populationAffectedEst || null
        const glideCode = raw.glide || null
        const sourceAgency = raw.source || reviewingAlert.source || 'GDACS'
        const alertScore = reviewingAlert.alertScore != null ? reviewingAlert.alertScore.toFixed(2) : null
        const latFormatted = reviewingAlert.latitude != null ? `${Math.abs(reviewingAlert.latitude).toFixed(4)}° ${reviewingAlert.latitude >= 0 ? 'N' : 'S'}` : 'N/A'
        const lonFormatted = reviewingAlert.longitude != null ? `${Math.abs(reviewingAlert.longitude).toFixed(4)}° ${reviewingAlert.longitude >= 0 ? 'E' : 'W'}` : 'N/A'

        return (
          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div className="bg-[#0b1329] border border-sky-500/40 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl font-sans text-[12px] overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1e293b] shrink-0 bg-[#0b1329]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sky-400 text-[22px]">public</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-white leading-tight">
                        Global Disaster Intelligence Dossier
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-sky-900/60 border border-sky-400/40 text-sky-300">
                        {sourceAgency}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-mono text-slate-400 mt-0.5">
                      Event ID: <strong className="text-white">{reviewingAlert.externalId}</strong> &bull; Status: <strong className="text-emerald-400">{reviewingAlert.status}</strong> {glideCode ? `• GLIDE: ${glideCode}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewingAlert(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Dossier Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-140px)] scrollbar-thin">
                
                {/* Event Headline */}
                <div className="p-3.5 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] text-sky-400 uppercase font-bold tracking-wider">
                      PRIMARY EVENT CLASSIFICATION
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                      reviewingAlert.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : reviewingAlert.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {reviewingAlert.alertLevel || reviewingAlert.severity} ALERT
                    </span>
                  </div>
                  <h2 className="text-[15px] font-bold text-white leading-snug">
                    {reviewingAlert.title.replace(`[${reviewingAlert.source}] `, '')}
                  </h2>
                </div>

                {/* Structured Multi-Card Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                  
                  {/* Location & Country */}
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] flex flex-col justify-between">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-red-400">pin_drop</span>
                      Target Region
                    </span>
                    <span className="text-white font-bold text-[12px] truncate block">
                      {reviewingAlert.country || 'International Zone'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {reviewingAlert.locationName || reviewingAlert.countries || 'Global Vector'}
                    </span>
                  </div>

                  {/* Geographic Coordinates */}
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] flex flex-col justify-between">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-sky-400">explore</span>
                      Coordinates
                    </span>
                    <span className="text-sky-300 font-bold text-[11.5px] block">
                      {latFormatted}
                    </span>
                    <span className="text-sky-300 font-bold text-[11.5px] block">
                      {lonFormatted}
                    </span>
                  </div>

                  {/* Physical Severity Metrics / Magnitude */}
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] flex flex-col justify-between">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-amber-400">speed</span>
                      Physical Metric
                    </span>
                    <span className="text-amber-300 font-bold text-[12px] block">
                      {severityMetrics || `${reviewingAlert.eventType} Alert`}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Severity: <strong className="text-white">{reviewingAlert.severity}</strong>
                    </span>
                  </div>

                  {/* Population Exposure / Impact */}
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] flex flex-col justify-between">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-emerald-400">group</span>
                      Exposure Impact
                    </span>
                    <span className="text-emerald-400 font-bold text-[12px] block">
                      {popExposure || 'Population at Risk'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Score: <strong className="text-white">{alertScore || 'Active'}</strong>
                    </span>
                  </div>
                </div>

                {/* Situation Description & Incident Impact Briefing */}
                <div className="p-4 bg-[#0f172a] rounded-xl border border-[#1e293b] space-y-2">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-sky-400">description</span>
                    OFFICIAL DISASTER SITUATION SUMMARY &amp; TELEMETRY
                  </span>
                  <p className="text-[12.5px] text-slate-200 leading-relaxed font-sans">
                    {reviewingAlert.description || 'No detailed qualitative summary broadcast by external alert feed.'}
                  </p>
                </div>

                {/* Metadata Timestamps & External Verification URL */}
                <div className="p-3 bg-[#090d1a] rounded-xl border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>
                      Published: <strong className="text-slate-200">{reviewingAlert.publishedAt ? new Date(reviewingAlert.publishedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}</strong>
                    </span>
                    <span>
                      Feed: <strong className="text-sky-300">{sourceAgency} Global API</strong>
                    </span>
                  </div>

                  {reviewingAlert.sourceUrl && (
                    <a
                      href={reviewingAlert.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Open Official Report Dossier</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Controls Footer */}
              <div className="p-4 sm:p-5 border-t border-[#1e293b] bg-[#0b1329] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(reviewingAlert.id, 'REVIEWED')}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">done</span>
                    <span>MARK REVIEWED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(reviewingAlert.id, 'REJECTED')}
                    className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-mono text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">block</span>
                    <span>REJECT</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {reviewingAlert.latitude && reviewingAlert.longitude && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewOnMap) {
                          onViewOnMap(reviewingAlert.latitude!, reviewingAlert.longitude!, reviewingAlert.title)
                          setReviewingAlert(null)
                        }
                      }}
                      className="px-3.5 py-1.5 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">explore</span>
                      <span>VIEW ON MAP</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleConvertToIncident(reviewingAlert)}
                    disabled={isConverting || reviewingAlert.status === 'CONVERTED_TO_INCIDENT'}
                    className={`px-4 py-2 rounded-lg font-mono text-[11.5px] font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                      reviewingAlert.status === 'CONVERTED_TO_INCIDENT'
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-[#1e293b]'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">add_task</span>
                    <span>{isConverting ? 'CREATING INCIDENT...' : reviewingAlert.status === 'CONVERTED_TO_INCIDENT' ? 'ALREADY CONVERTED' : 'CREATE INCIDENT'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ========================================================================= */}
      {/* MODAL: CITIZEN & SENSOR ALERT DETAILS DOSSIER                            */}
      {/* ========================================================================= */}
      {reviewingInternalAlert && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#0b1329] border border-amber-500/40 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl font-sans text-[12px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1e293b] shrink-0 bg-[#0b1329]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-[22px]">emergency</span>
                <div>
                  <h3 className="text-[15px] font-bold text-white leading-tight">
                    Alert Dossier • {reviewingInternalAlert.category}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    Source: {reviewingInternalAlert.source} &bull; Timestamp: {reviewingInternalAlert.alertTime}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewingInternalAlert(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div>
                <span className="font-mono text-[10px] text-amber-400 uppercase font-bold tracking-wider block mb-1">
                  ALERT MESSAGE / DISPATCH BROADCAST
                </span>
                <h2 className="text-[14px] font-bold text-white leading-snug">
                  {reviewingInternalAlert.message}
                </h2>
              </div>

              {/* Detail Metrics */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                <div className="p-2.5 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px] uppercase">Incident Location</span>
                  <span className="text-white font-bold block truncate">{reviewingInternalAlert.location}</span>
                </div>

                <div className="p-2.5 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px] uppercase">Severity Assessment</span>
                  <span className={`font-bold block uppercase ${
                    reviewingInternalAlert.severity.toLowerCase() === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {reviewingInternalAlert.severity}
                  </span>
                </div>

                <div className="p-2.5 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px] uppercase">Linked Incident</span>
                  <span className="text-sky-400 font-bold block truncate">
                    {reviewingInternalAlert.incidentId || 'Pending Canonical Link'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px] uppercase">Review Status</span>
                  <span className={`font-bold block ${reviewingInternalAlert.isReviewedByAuthority ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {reviewingInternalAlert.isReviewedByAuthority ? 'Reviewed by Authority' : 'Pending Triage'}
                  </span>
                </div>
              </div>

              {/* Linked Incident Direct Action */}
              {reviewingInternalAlert.incidentId && (
                <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-lg space-y-1">
                  <span className="font-mono text-[10px] text-sky-300 uppercase font-bold tracking-wider block">
                    LINKED CANONICAL INCIDENT
                  </span>
                  <p className="text-[11.5px] text-slate-200">
                    This emergency alert is attached to Incident <strong>{reviewingInternalAlert.incidentId}</strong> ({reviewingInternalAlert.location}).
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#1e293b] bg-[#0b1329] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onMarkReviewed) onMarkReviewed(reviewingInternalAlert.id)
                  toast.success('Alert marked as reviewed.', { theme: 'light' })
                  setReviewingInternalAlert(prev => prev ? { ...prev, isReviewedByAuthority: true } : null)
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                MARK REVIEWED
              </button>

              <div className="flex items-center gap-2">
                {reviewingInternalAlert.incidentId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToIncident) {
                        onNavigateToIncident(reviewingInternalAlert.incidentId!)
                        setReviewingInternalAlert(null)
                      }
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-mono text-[11px] font-bold rounded-lg transition-all hover:bg-primary-fixed flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>OPEN INCIDENT DOSSIER</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
