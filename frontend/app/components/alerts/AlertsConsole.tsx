'use client'

import { showConfirmDialog } from '../common/ConfirmDialog'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ActiveAlert } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import { platformDataService } from '../../services/dataService'

interface AlertsConsoleProps {
  alerts?: ActiveAlert[]
  selectedAlertId?: string | null
  onSelectAlert?: (alert: ActiveAlert | string) => void
  onNavigateToIncident?: (incId: string) => void
  onMarkReviewed?: (altId: string) => void
  onOpenAssessment?: () => void
}

export default function AlertsConsole({
  alerts: initialAlerts = [],
  selectedAlertId: initialSelectedAlertId,
  onSelectAlert,
  onNavigateToIncident,
  onMarkReviewed,
  onOpenAssessment,
}: AlertsConsoleProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setStarredIds(platformDataService.getStarredIds('alert'))
    if (initialAlerts.length > 0) {
      const firstId = initialSelectedAlertId || initialAlerts[0]?.id
      if (firstId) {
        platformDataService.markAsSeen('alert', firstId)
      }
    }
  }, [])

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    platformDataService.toggleStar('alert', id)
    setStarredIds(new Set(platformDataService.getStarredIds('alert')))
  }

  const handleDeleteAlert = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = await showConfirmDialog({
      title: `DISMISS ALERT ${id.toUpperCase()}`,
      message: `Are you sure you want to delete Alert ${id}? It will be permanently removed from the disaster broadcast registry and dashboard ticker.`,
      confirmLabel: 'DELETE ALERT',
      type: 'danger',
    })
    if (!confirmed) return
    setDeletingId(id)
    try {
      const ok = await platformDataService.deleteAlert(id)
      if (ok) {
        setAlertsList((prev) => prev.filter((a) => a.id !== id))
        if (activeAlertId === id) {
          setActiveAlertId(null)
        }
      }
    } catch (err) {
      console.error('Delete alert failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Real backend live state with initial fast population
  const [alertsList, setAlertsList] = useState<ActiveAlert[]>(initialAlerts)
  const [activeAlertId, setActiveAlertId] = useState<string | null>(initialSelectedAlertId || null)
  const [isLoading, setIsLoading] = useState<boolean>(initialAlerts.length === 0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  // Fast single fetch function with abort protection
  const fetchLiveAlerts = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await platformDataService.getAlerts(
        filterSeverity,
        filterCategory,
        undefined,
        undefined
      )
      setAlertsList(data)
      if (data.length > 0 && !activeAlertId) {
        setActiveAlertId(data[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching alerts from backend:', err)
      setErrorMessage('Unable to establish live connection to Alert Telemetry Stream.')
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [filterSeverity, filterCategory, activeAlertId])

  useEffect(() => {
    fetchLiveAlerts()
  }, [filterSeverity, filterCategory])

  const filteredAlerts = alertsList.filter((a) => {
    const matchesSeverity =
      filterSeverity === 'ALL' || a.severity.toLowerCase() === filterSeverity.toLowerCase()
    const matchesCategory =
      filterCategory === 'ALL' || a.category.toLowerCase() === filterCategory.toLowerCase()
    const matchesSearch =
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.source.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesCategory && matchesSearch
  })

  const selectedAlert =
    alertsList.find((a) => a.id === activeAlertId) || filteredAlerts[0] || null

  const handleSelect = (alert: ActiveAlert) => {
    setActiveAlertId(alert.id)
    platformDataService.markAsSeen('alert', alert.id)
    if (onSelectAlert) {
      onSelectAlert(alert)
    }
    setIsMobileDetailView(true)
  }

  const handleBackToList = () => {
    setIsMobileDetailView(false)
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      await platformDataService.reviewAlert(alertId)
      setAlertsList((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isReviewed: true } : a))
      )
      if (onMarkReviewed) {
        onMarkReviewed(alertId)
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
    }
  }

  const unreviewedCount = alertsList.filter((a) => !a.isReviewed).length

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden w-full">
      {/* Header Toolbar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-error/10 border border-error/20 flex items-center justify-center text-error shrink-0">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
                Early Warning &amp; Telemetry Alerts
              </h2>
              {unreviewedCount > 0 && (
                <span className="font-mono-label text-[9px] bg-error text-surface px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  {unreviewedCount} NEW
                </span>
              )}
            </div>
            <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
              Live multi-source early warning intelligence from SCADA, IMD radar, and field sensors
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search alerts, sensors..."
            className="flex-1 sm:w-56"
          />

          <button
            type="button"
            onClick={() => setStarredOnly(!starredOnly)}
            title={starredOnly ? 'Showing starred alerts only' : 'Filter by starred alerts'}
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
            <option value="warning">WARNING</option>
            <option value="info">INFO</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">Category: ALL</option>
            <option value="METEO">METEO</option>
            <option value="CIVIL">CIVIL</option>
            <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
            <option value="MEDICAL">MEDICAL</option>
            <option value="GOVERNMENT">GOVERNMENT</option>
          </select>

          <button
            type="button"
            onClick={() => fetchLiveAlerts()}
            className="p-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            title="Refresh alerts from backend"
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
            onClick={() => fetchLiveAlerts()}
            className="font-mono-label text-[11px] font-bold underline uppercase cursor-pointer hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Split Layout: Desktop 2-column | Mobile conditional 1-column */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* LEFT PANE: Alerts List */}
        <div
          className={`w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest transition-all ${
            isMobileDetailView ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredAlerts.length} Active Feeds
            </span>
            <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
              Database Stream
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {isLoading && alertsList.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-on-surface-variant font-mono-label text-[12px] gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Loading live alerts from database...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px] space-y-2">
                <span className="material-symbols-outlined text-[32px] text-outline block mx-auto">
                  check_circle
                </span>
                <p>No active alerts matching the selected filters.</p>
              </div>
            ) : (
              filteredAlerts.map((alt) => {
                const isSelected = selectedAlert?.id === alt.id
                return (
                  <div
                    key={alt.id}
                    onClick={() => handleSelect(alt)}
                    className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-2 relative ${
                      isSelected
                        ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                        : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                        alt.severity === 'critical'
                          ? 'bg-error'
                          : alt.severity === 'warning'
                          ? 'bg-tertiary'
                          : 'bg-primary'
                      }`}
                    />

                    <div className="flex items-start justify-between gap-2 pl-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {/* High-Visibility Star / Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(e, alt.id)}
                          className={`px-1.5 py-0.5 rounded border text-[13px] flex items-center gap-1 cursor-pointer transition-all ${
                            starredIds.has(alt.id)
                              ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold shadow-sm'
                              : 'bg-surface-container border-outline-variant text-outline hover:text-amber-300 hover:border-amber-400/50'
                          }`}
                          title={starredIds.has(alt.id) ? 'Starred (Click to unstar)' : 'Click to star / favorite'}
                        >
                          <span>{starredIds.has(alt.id) ? '★' : '☆'}</span>
                          <span className="text-[10px] font-mono-label">{starredIds.has(alt.id) ? 'STARRED' : 'STAR'}</span>
                        </button>

                        <span className="font-mono-label text-[11px] text-primary font-bold">
                          {alt.category}
                        </span>
                        <span
                          className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                            alt.severity === 'critical'
                              ? 'bg-error/15 text-error border border-error/30'
                              : alt.severity === 'warning'
                              ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        >
                          {alt.severity}
                        </span>
                        {alt.isReviewed && (
                          <span className="font-mono-label text-[8px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded">
                            ✓ REVIEWED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-label text-[10px] text-on-surface-variant">
                          {alt.alertTime || alt.timestamp}
                        </span>
                        {/* High-Visibility Delete Button */}
                        <button
                          type="button"
                          disabled={deletingId === alt.id}
                          onClick={(e) => handleDeleteAlert(e, alt.id)}
                          className="px-2 py-0.5 rounded border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 font-mono-label text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="Permanently delete alert"
                        >
                          <span>🗑️</span>
                          <span>{deletingId === alt.id ? 'DELETING...' : 'DELETE'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="pl-1 font-body-sm font-semibold text-[13px] text-on-surface leading-snug">
                      {alt.message}
                    </p>

                    <div className="pl-1 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="text-primary font-mono-label text-[11px] truncate">
                        {alt.source}
                      </span>
                      <span className="text-[10px] text-outline font-mono-label">
                        {alt.location}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Selected Alert Master Dossier */}
        <div
          className={`flex-1 flex flex-col h-full bg-surface overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin transition-all min-w-0 ${
            isMobileDetailView ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {selectedAlert ? (
            <>
              {/* Mobile Back to List Button */}
              <div className="md:hidden pb-1">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-primary hover:text-on-surface font-mono-label text-[12px] font-bold py-1.5 px-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  ← Back to Alerts Feed
                </button>
              </div>

              {/* 1. Header with Alert Severity */}
              <DetailsHeader
                badgeId={`ALERT FEED: ${selectedAlert.category}`}
                title={selectedAlert.message}
                severityBadge={selectedAlert.severity.toUpperCase()}
                statusText={selectedAlert.isReviewed ? 'STATUS: REVIEWED' : 'STATUS: UNREVIEWED'}
                statusColor={selectedAlert.isReviewed ? 'primary' : 'error'}
                accentColor={selectedAlert.severity === 'critical' ? 'error' : 'primary'}
                subItems={[
                  { label: 'Telemetry Source', value: selectedAlert.source, icon: 'podcasts' },
                  { label: 'Origin Location', value: selectedAlert.location, icon: 'location_on' },
                  { label: 'Timestamp', value: selectedAlert.alertTime || selectedAlert.timestamp || 'Just now' },
                  { label: 'Linked Incident', value: selectedAlert.incidentTitle || selectedAlert.incidentId || 'Central Command', highlight: true },
                ]}
              />

              {/* 2. Situational Intelligence & Directive */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                    Telemetry Ingestion &amp; Impact Analysis
                  </h4>
                  <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Proactive Trigger
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3 rounded border border-outline-variant leading-relaxed">
                    {selectedAlert.message}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-label">
                    <div className="p-2.5 bg-surface-container rounded border border-outline-variant/60">
                      <span className="text-outline block">Source Stream:</span>
                      <span className="text-primary font-bold">{selectedAlert.source}</span>
                    </div>
                    <div className="p-2.5 bg-surface-container rounded border border-outline-variant/60">
                      <span className="text-outline block">Target Sector:</span>
                      <span className="text-on-surface font-bold">{selectedAlert.location}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Authority Acknowledgment & Action Controls */}
              <section className="bg-surface-container-low border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-headline-sm text-[13px] font-bold text-on-surface">
                    Authority Command Review
                  </h5>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    {selectedAlert.isReviewed
                      ? 'This telemetry warning has been acknowledged and logged in central command records.'
                      : 'Acknowledge this telemetry alert to confirm review and update command dispatch state.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!selectedAlert.isReviewed && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-surface font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors shadow"
                    >
                      ✓ Acknowledge Alert
                    </button>
                  )}
                  {onNavigateToIncident && selectedAlert.incidentId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToIncident(selectedAlert.incidentId!)}
                      className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors"
                    >
                      View Incident →
                    </button>
                  )}
                  {onOpenAssessment && (
                    <button
                      type="button"
                      onClick={onOpenAssessment}
                      className="px-3.5 py-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors"
                    >
                      Ingest Recon →
                    </button>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an alert from the telemetry feed to inspect detailed intelligence.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
