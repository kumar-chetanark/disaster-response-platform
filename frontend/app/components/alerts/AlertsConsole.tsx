'use client'

import React, { useState } from 'react'
import { ActiveAlert, AlertCategory } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'

interface AlertsConsoleProps {
  alerts: ActiveAlert[]
  selectedAlertId: string | null
  onSelectAlert: (id: string) => void
  onNavigateToIncident: (incidentId: string) => void
  onMarkReviewed: (alertId: string) => void
}

export default function AlertsConsole({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onNavigateToIncident,
  onMarkReviewed,
}: AlertsConsoleProps) {
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedAlert =
    alerts.find((alt) => alt.id === selectedAlertId) || alerts[0]

  const filteredAlerts = alerts.filter((alt) => {
    const matchesCat = filterCategory === 'ALL' || alt.category === filterCategory
    const matchesSearch =
      alt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Header / Filter Toolbar */}
      <div className="px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">campaign</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Proactive External Alerts &amp; Early Warnings
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              External radar, IMD meteorological bulletins, and government telemetries corroborating operational incidents
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search alert feeds..."
            className="w-56"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">Category: ALL</option>
            <option value="METEO">METEO / IMD</option>
            <option value="CIVIL">CIVIL / EVAC</option>
            <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
            <option value="MEDICAL">MEDICAL</option>
            <option value="GOVERNMENT">GOVERNMENT</option>
            <option value="SATELLITE">SATELLITE</option>
          </select>
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Alerts List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest">
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredAlerts.length} Ingested Alerts
            </span>
            <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
              Live External Streams
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredAlerts.map((alt) => {
              const isSelected = selectedAlert?.id === alt.id
              return (
                <div
                  key={alt.id}
                  onClick={() => onSelectAlert(alt.id)}
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded uppercase font-bold border ${
                          alt.category === 'METEO'
                            ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30'
                            : alt.category === 'CIVIL'
                            ? 'bg-amber-950/30 text-amber-400 border-amber-500/30'
                            : alt.category === 'MEDICAL'
                            ? 'bg-error/15 text-error border-error/30'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {alt.category}
                      </span>
                      <span className="font-mono-label text-[10px] text-outline">
                        {alt.source}
                      </span>
                    </div>

                    <span className="font-mono-label text-[9px] text-on-surface-variant shrink-0">
                      {alt.time}
                    </span>
                  </div>

                  <p className="pl-1 font-body-sm text-[12px] text-on-surface leading-snug line-clamp-2">
                    {alt.message}
                  </p>

                  <div className="pl-1 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono-label text-on-surface-variant">
                    <div className="flex items-center gap-1 text-primary">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      <span>{alt.location}</span>
                    </div>

                    {alt.relatedIncidentTitle && (
                      <span className="text-outline truncate max-w-[150px]">
                        Linked: {alt.relatedIncidentTitle}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANE: Selected Alert Detail Dossier */}
        <div className="flex-1 flex flex-col h-full bg-surface overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {selectedAlert ? (
            <>
              {/* 1. Compact Consistent Details Header */}
              <DetailsHeader
                badgeId={`ALERT FEED: ${selectedAlert.id}`}
                title={selectedAlert.source}
                severityBadge={selectedAlert.severity.toUpperCase()}
                statusText={`CATEGORY: ${selectedAlert.category}`}
                statusColor={selectedAlert.severity === 'critical' ? 'error' : 'primary'}
                accentColor={selectedAlert.severity === 'critical' ? 'error' : 'primary'}
                subItems={[
                  { label: 'Location', value: selectedAlert.location, icon: 'location_on' },
                  { label: 'Timestamp', value: selectedAlert.time },
                ]}
                extraAction={
                  <button
                    type="button"
                    onClick={() => onMarkReviewed(selectedAlert.id)}
                    className={`px-3.5 py-1.5 font-mono-label text-[11px] font-bold rounded uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedAlert.isReviewedByAuthority
                        ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/40'
                        : 'bg-primary text-on-primary hover:bg-primary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {selectedAlert.isReviewedByAuthority ? 'check_circle' : 'task_alt'}
                    </span>
                    {selectedAlert.isReviewedByAuthority ? 'Reviewed' : 'Acknowledge'}
                  </button>
                }
              />

              {/* 2. Alert Content Box */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">feed</span>
                  Raw Telemetry / Intelligence Broadcast Message
                </h4>
                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3.5 rounded border border-outline-variant leading-relaxed">
                  {selectedAlert.message}
                </p>
              </section>

              {/* 3. Connected Unified Incident Context */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">link</span>
                    Associated Unified Incident
                  </h4>
                  <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Correlated by Event Deduplication Engine
                  </span>
                </div>

                {selectedAlert.relatedIncidentId ? (
                  <div className="p-3.5 bg-surface-container-low border border-outline-variant rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-mono-label text-[10px] text-primary font-bold">
                        {selectedAlert.relatedIncidentId.toUpperCase()}
                      </span>
                      <h5 className="font-body-sm font-bold text-[13px] text-on-surface">
                        {selectedAlert.relatedIncidentTitle}
                      </h5>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">
                        This alert supplies intelligence to this primary incident record without spawning duplicate records.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToIncident(selectedAlert.relatedIncidentId!)}
                      className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-bright text-primary border border-outline-variant font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      View Incident Dossier →
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container-low rounded border border-outline-variant text-[11px] text-on-surface-variant font-mono-label">
                    No active incident explicitly linked yet. Alert is monitored under general situational surveillance.
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an alert from the feed to inspect details and linked incidents.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
