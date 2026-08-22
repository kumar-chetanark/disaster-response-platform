'use client'

import React, { useState } from 'react'
import { Incident, AllocationAdvisory, ResourceUnit } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'

interface IncidentsConsoleProps {
  incidents: Incident[]
  selectedIncidentId: string | null
  advisories: AllocationAdvisory[]
  resources?: ResourceUnit[]
  onSelectIncident: (id: string) => void
  onOpenAssessment: () => void
  onNavigateToResources?: () => void
}

export default function IncidentsConsole({
  incidents,
  selectedIncidentId,
  advisories,
  onSelectIncident,
  onOpenAssessment,
}: IncidentsConsoleProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeReportTab, setActiveReportTab] = useState<'all' | 'citizen' | 'news' | 'gov' | 'field'>('all')

  const selectedIncident =
    incidents.find((inc) => inc.id === selectedIncidentId) || incidents[0]

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSeverity = filterSeverity === 'ALL' || inc.severity === filterSeverity
    const matchesStatus = filterStatus === 'ALL' || inc.status === filterStatus
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesStatus && matchesSearch
  })

  const incidentReports = selectedIncident?.reports || []
  const filteredReports = incidentReports.filter((rep) => {
    if (activeReportTab === 'all') return true
    if (activeReportTab === 'citizen') return rep.sourceType === 'CITIZEN' || rep.sourceType === 'SMS' || rep.sourceType === 'IVR'
    if (activeReportTab === 'news') return rep.sourceType === 'NEWS'
    if (activeReportTab === 'gov') return rep.sourceType === 'GOVERNMENT' || rep.sourceType === 'WEATHER'
    if (activeReportTab === 'field') return rep.sourceType === 'FIELD_ASSESSMENT'
    return true
  })

  // Match advisories specifically tied to the selected incident
  const relevantAdvisories = advisories.filter(
    (adv) =>
      adv.targetIncidentId === selectedIncident?.id ||
      (selectedIncident?.id === 'inc-a' && (adv.targetIncident.includes('Incident A') || adv.targetIncident.includes('Sector 7G'))) ||
      (selectedIncident?.id === 'inc-b' && adv.targetIncident.includes('Incident B'))
  )

  const totalReportsCount =
    (selectedIncident?.sourceCounts?.citizenReports || 0) +
    (selectedIncident?.sourceCounts?.newsReports || 0) +
    (selectedIncident?.sourceCounts?.governmentReports || 0) +
    (selectedIncident?.sourceCounts?.weatherReports || 0) +
    (selectedIncident?.sourceCounts?.fieldAssessments || 0)

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Header / Filter Toolbar */}
      <div className="px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Incident Registry &amp; Multi-Source Corroboration
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Master Registry • Multi-channel streams correlated to singular disaster records
            </p>
          </div>
        </div>

        {/* Reusable Search & Clean Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search incidents, sectors..."
            className="w-56"
          />

          <div className="flex items-center gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
            >
              <option value="ALL">Severity: ALL</option>
              <option value="CRITICAL">SEV: CRITICAL</option>
              <option value="HIGH">SEV: HIGH</option>
              <option value="MEDIUM">SEV: MEDIUM</option>
              <option value="LOW">SEV: LOW</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
            >
              <option value="ALL">Status: ALL</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="UNRESOLVED">UNRESOLVED</option>
              <option value="MONITORING">MONITORING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Scrollable Master List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest">
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredIncidents.length} Registered Incidents
            </span>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Authority View
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id
              const totalSources =
                (incident.sourceCounts?.citizenReports || 0) +
                (incident.sourceCounts?.newsReports || 0) +
                (incident.sourceCounts?.governmentReports || 0) +
                (incident.sourceCounts?.weatherReports || 0) +
                (incident.sourceCounts?.fieldAssessments || 0)

              return (
                <div
                  key={incident.id}
                  onClick={() => onSelectIncident(incident.id)}
                  className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    isSelected
                      ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                      incident.severity === 'CRITICAL'
                        ? 'bg-error'
                        : incident.severity === 'HIGH'
                        ? 'bg-tertiary'
                        : 'bg-yellow-400'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2 pl-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-label text-[10px] text-primary font-bold">
                          {incident.id.toUpperCase()}
                        </span>
                        <span className="text-outline-variant text-[10px]">•</span>
                        <span
                          className={`font-status-badge text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                            incident.severity === 'CRITICAL'
                              ? 'bg-error/15 text-error border-error/30'
                              : incident.severity === 'HIGH'
                              ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                              : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          {incident.severity}
                        </span>
                        {incident.isFieldVerified ? (
                          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-mono-label text-[9px] px-1 py-0.2 rounded font-bold">
                            FIELD VERIFIED
                          </span>
                        ) : (
                          <span className="bg-surface text-on-surface-variant border border-outline-variant font-mono-label text-[9px] px-1 py-0.2 rounded">
                            UNASSESSED
                          </span>
                        )}
                      </div>
                      <h4 className="font-body-sm font-semibold text-[13px] text-on-surface mt-0.5 leading-snug">
                        {incident.title}
                      </h4>
                    </div>

                    <span className="font-mono-label text-[9px] text-on-surface-variant shrink-0">
                      {incident.timeReported}
                    </span>
                  </div>

                  <div className="pl-1 text-on-surface-variant font-body-sm text-[12px] leading-tight">
                    <div className="flex items-center gap-1 text-[11px] font-mono-label text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                      <span className="truncate">{incident.location}</span>
                    </div>
                    <p className="line-clamp-2 mt-1 text-[11px] text-outline">
                      {incident.impact}
                    </p>
                  </div>

                  <div className="pl-1 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono-label text-on-surface-variant">
                    <div className="flex items-center gap-1 text-primary">
                      <span className="material-symbols-outlined text-[14px]">hub</span>
                      <span>{totalSources} Sources Corroborating</span>
                    </div>

                    <span className="uppercase text-[9px] bg-surface px-1.5 py-0.5 rounded border border-outline-variant">
                      {incident.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANE: Selected Incident Master Dossier & Source Stream */}
        <div className="flex-1 flex flex-col h-full bg-surface overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {selectedIncident ? (
            <>
              {/* 1. Compact Consistent Details Header */}
              <DetailsHeader
                badgeId={`INCIDENT DOSSIER: ${selectedIncident.id.toUpperCase()}`}
                title={selectedIncident.title}
                severityBadge={selectedIncident.severity}
                statusText={`STATUS: ${selectedIncident.status}`}
                statusColor={selectedIncident.status === 'ACTIVE' ? 'error' : 'outline'}
                accentColor={selectedIncident.severity === 'CRITICAL' ? 'error' : 'tertiary'}
                subItems={[
                  { label: 'Location', value: `${selectedIncident.location} (${selectedIncident.sector})`, icon: 'location_on' },
                  { label: 'Reported', value: selectedIncident.timeReported },
                  { label: 'Sync', value: selectedIncident.lastUpdated },
                  {
                    label: 'Recon',
                    value: selectedIncident.isFieldVerified ? 'Verified' : 'Not yet assessed',
                    highlight: selectedIncident.isFieldVerified,
                  },
                ]}
                extraAction={
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface px-3 py-2 rounded border border-outline-variant">
                    <div className="flex flex-col text-center sm:text-left">
                      <span className="text-[8px] font-mono-label text-on-surface-variant uppercase">Pop.</span>
                      <span className="font-headline-sm text-[13px] text-error font-bold leading-tight">
                        {selectedIncident.affectedPopulationEst}
                      </span>
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <span className="text-[8px] font-mono-label text-on-surface-variant uppercase">Area</span>
                      <span className="font-headline-sm text-[13px] text-on-surface font-bold leading-tight">
                        {selectedIncident.affectedAreaSqKm}k㎡
                      </span>
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <span className="text-[8px] font-mono-label text-on-surface-variant uppercase">Priority</span>
                      <span className="font-headline-sm text-[13px] text-error font-bold leading-tight">
                        {selectedIncident.priorityLevel}
                      </span>
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <span className="text-[8px] font-mono-label text-on-surface-variant uppercase">Coverage</span>
                      <span className="font-headline-sm text-[13px] text-emerald-400 font-bold leading-tight">
                        {selectedIncident.resourceCoverage}
                      </span>
                    </div>
                  </div>
                }
              />

              {/* 2. Source Correlation Summary Box */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
                    <h4 className="font-headline-sm text-[13px] font-bold text-on-surface">
                      Source Correlation Engine (Corroborating Feeds for {selectedIncident.id.toUpperCase()})
                    </h4>
                  </div>
                  <div className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {totalReportsCount} Inputs Corroborated to 1 Unified Incident
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-2 bg-surface-container-low border border-outline-variant rounded flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-tertiary text-[16px] mb-0.5">forum</span>
                    <span className="font-headline-sm text-[15px] font-bold text-on-surface">
                      {selectedIncident.sourceCounts?.citizenReports || 0}
                    </span>
                    <span className="font-mono-label text-[9px] text-on-surface-variant uppercase">Citizen Reports</span>
                  </div>

                  <div className="p-2 bg-surface-container-low border border-outline-variant rounded flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary text-[16px] mb-0.5">newspaper</span>
                    <span className="font-headline-sm text-[15px] font-bold text-on-surface">
                      {selectedIncident.sourceCounts?.newsReports || 0}
                    </span>
                    <span className="font-mono-label text-[9px] text-on-surface-variant uppercase">News &amp; Media</span>
                  </div>

                  <div className="p-2 bg-surface-container-low border border-outline-variant rounded flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-purple-400 text-[16px] mb-0.5">account_balance</span>
                    <span className="font-headline-sm text-[15px] font-bold text-on-surface">
                      {selectedIncident.sourceCounts?.governmentReports || 0}
                    </span>
                    <span className="font-mono-label text-[9px] text-on-surface-variant uppercase">Gov Alerts</span>
                  </div>

                  <div className="p-2 bg-surface-container-low border border-outline-variant rounded flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-cyan-400 text-[16px] mb-0.5">thunderstorm</span>
                    <span className="font-headline-sm text-[15px] font-bold text-on-surface">
                      {selectedIncident.sourceCounts?.weatherReports || 0}
                    </span>
                    <span className="font-mono-label text-[9px] text-on-surface-variant uppercase">IMD / Radar</span>
                  </div>

                  <div className="p-2 bg-surface-container-low border border-outline-variant rounded flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px] mb-0.5">satellite_alt</span>
                    <span className="font-headline-sm text-[15px] font-bold text-emerald-400">
                      {selectedIncident.sourceCounts?.fieldAssessments || 0}
                    </span>
                    <span className="font-mono-label text-[9px] text-on-surface-variant uppercase">Field Recon</span>
                  </div>
                </div>
              </section>

              {/* 3. Multi-Channel Ingestion Feed */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">feed</span>
                    <h4 className="font-headline-sm text-[13px] font-bold text-on-surface">
                      Corroborating Intelligence Ingestion Stream ({filteredReports.length})
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-container p-1 rounded border border-outline-variant text-[11px] font-mono-label">
                    <button
                      type="button"
                      onClick={() => setActiveReportTab('all')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        activeReportTab === 'all' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                      }`}
                    >
                      All ({incidentReports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReportTab('citizen')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        activeReportTab === 'citizen' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                      }`}
                    >
                      Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReportTab('news')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        activeReportTab === 'news' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                      }`}
                    >
                      News
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReportTab('gov')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        activeReportTab === 'gov' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                      }`}
                    >
                      Gov/IMD
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReportTab('field')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        activeReportTab === 'field' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                      }`}
                    >
                      Field Recon
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono-label text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                              report.sourceType === 'CITIZEN' || report.sourceType === 'SMS' || report.sourceType === 'IVR'
                                ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
                                : report.sourceType === 'GOVERNMENT' || report.sourceType === 'WEATHER'
                                ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/30'
                                : report.sourceType === 'FIELD_ASSESSMENT'
                                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-primary/10 text-primary border-primary/30'
                            }`}
                          >
                            {report.channelBadge || report.sourceType}
                          </span>
                          <span className="font-body-sm font-semibold text-[12px] text-on-surface">
                            {report.sourceLabel}
                          </span>
                          {report.confidence && (
                            <span className="font-mono-label text-[9px] text-emerald-400 bg-surface px-1 py-0.2 rounded border border-outline-variant">
                              Confidence: {report.confidence}%
                            </span>
                          )}
                        </div>

                        <span className="font-mono-label text-[10px] text-on-surface-variant">
                          {report.timestamp}
                        </span>
                      </div>

                      <p className="font-body-sm text-[12px] text-on-surface leading-snug">
                        {report.summary}
                      </p>

                      {report.rawContent && (
                        <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant/60 font-mono-label text-[10px] text-on-surface-variant">
                          <span className="text-outline block mb-0.5 uppercase text-[8px]">Raw Telemetry:</span>
                          {report.rawContent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. Bottom Split: Type-Aware Resource Advisories vs Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                    <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
                      Incident Capability Requirements &amp; Advisories
                    </h4>
                    <span className="font-mono-label text-[10px] text-primary">
                      {relevantAdvisories.length} Active Advisories
                    </span>
                  </div>

                  {relevantAdvisories.length > 0 ? (
                    <div className="space-y-2">
                      {relevantAdvisories.map((adv) => (
                        <div
                          key={adv.id}
                          className="p-2.5 bg-surface-container-low border border-outline-variant rounded flex items-center justify-between"
                        >
                          <div>
                            <div className="font-body-sm font-semibold text-on-surface text-[12px]">
                              {adv.resourceName}
                            </div>
                            <div className="font-mono-label text-[10px] text-primary">{adv.details}</div>
                            <div className="font-body-sm text-[10px] text-outline mt-0.5">{adv.reason}</div>
                          </div>
                          <span
                            className={`font-mono-label text-[9px] px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                              adv.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                            }`}
                          >
                            {adv.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-surface-container-low rounded border border-outline-variant text-[11px] text-on-surface-variant font-mono-label">
                      No automated resource recommendation required at this stage. Operational needs satisfied by active ground teams.
                    </div>
                  )}

                  <div className="pt-2 border-t border-outline-variant">
                    <span className="font-mono-label text-[10px] text-outline uppercase block mb-1.5">
                      Active Operational Tracks:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedIncident.associatedOperations || []).map((op, idx) => (
                        <span
                          key={idx}
                          className="bg-surface-container px-2 py-1 rounded text-[10px] font-mono-label text-on-surface border border-outline-variant"
                        >
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={onOpenAssessment}
                      className="w-full py-2 bg-surface-container-high hover:bg-surface-bright border border-outline-variant text-primary font-mono-label text-[11px] font-semibold rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
                      Initiate Field Reconnaissance Assessment
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                    <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                      Incident Progression Timeline
                    </h4>
                    <span className="font-mono-label text-[10px] text-on-surface-variant">Audit Trail</span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
                    {(selectedIncident.timeline || []).map((event) => (
                      <div key={event.id} className="flex items-start gap-2.5 text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-body-sm font-semibold text-on-surface text-[11px]">
                              {event.title}
                            </span>
                            <span className="font-mono-label text-[9px] text-on-surface-variant">
                              {event.timestamp}
                            </span>
                          </div>
                          <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an incident from the registry to view master dossier and multi-channel telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
