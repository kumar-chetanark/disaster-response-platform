'use client'

import React, { useState, useEffect } from 'react'
import { OperationRecord } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'
import { platformDataService } from '../../services/dataService'

interface OperationsConsoleProps {
  operations: OperationRecord[]
  selectedOperationId?: string | null
  onSelectOperation?: (id: string) => void
  onOpenAssessment: () => void
}

export default function OperationsConsole({
  operations: initialOperations,
  selectedOperationId,
  onSelectOperation,
  onOpenAssessment,
}: OperationsConsoleProps) {
  const [operationsList, setOperationsList] = useState<OperationRecord[]>(initialOperations)
  const [activeOpId, setActiveOpId] = useState<string>(selectedOperationId || initialOperations[0]?.id || 'op-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterState, setFilterState] = useState<string>('ALL')
  const [isMobileDetailView, setIsMobileDetailView] = useState(false)

  // Fetch live operations from REST backend
  useEffect(() => {
    async function fetchLiveOps() {
      const data = await platformDataService.getOperations(undefined, filterState)
      if (data && data.length > 0) {
        setOperationsList(data)
      }
    }
    fetchLiveOps()
  }, [filterState])

  const filteredOps = operationsList.filter((op) => {
    const matchesFilter =
      filterState === 'ALL' || String(op.state).toUpperCase() === filterState.toUpperCase()
    const matchesSearch =
      op.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.operationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (op.destinationLocation && op.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const selectedOp =
    operationsList.find((op) => op.id === activeOpId) || operationsList[0]

  const handleSelectOp = (id: string) => {
    setActiveOpId(id)
    if (onSelectOperation) {
      onSelectOperation(id)
    }
    setIsMobileDetailView(true)
  }

  const handleBackToList = () => {
    setIsMobileDetailView(false)
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOp) return
    await platformDataService.updateOperationStatus(selectedOp.id, newStatus)
    setOperationsList((prev) =>
      prev.map((op) => (op.id === selectedOp.id ? { ...op, state: newStatus as any } : op))
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden w-full">
      {/* Header Toolbar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">near_me</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Dispatched Operations &amp; Mission Tracking
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
              Live operational telemetry linking dispatched units, authority authorization, and field status
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Operation ID, squad..."
            className="flex-1 sm:w-56"
          />

          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">Status: ALL</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Desktop 2-column | Mobile conditional 1-column */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* LEFT PANE: Operations List */}
        <div
          className={`w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest transition-all ${
            isMobileDetailView ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredOps.length} Dispatched Tracks
            </span>
            <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
              Live Telemetry
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredOps.map((op) => {
              const isSelected = selectedOp?.id === op.id
              const stateStr = String(op.state)
              const isInProgress = stateStr.includes('PROGRESS') || stateStr.includes('OPERATION')

              return (
                <div
                  key={op.id}
                  onClick={() => handleSelectOp(op.id)}
                  className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    isSelected
                      ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                      isInProgress
                        ? 'bg-emerald-400'
                        : stateStr === 'DISPATCHED'
                        ? 'bg-primary'
                        : 'bg-outline'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2 pl-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-label text-[11px] text-primary font-bold">
                        {op.id.toUpperCase()}
                      </span>
                      <span
                        className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded uppercase font-bold border ${
                          isInProgress
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                            : stateStr === 'DISPATCHED'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-surface text-outline border-outline-variant'
                        }`}
                      >
                        {op.state}
                      </span>
                    </div>

                    <span className="font-mono-label text-[10px] text-on-surface-variant">
                      {op.dispatchedTime}
                    </span>
                  </div>

                  <h3 className="pl-1 font-body-sm font-semibold text-[13px] text-on-surface leading-snug">
                    {op.operationType}
                  </h3>

                  <div className="pl-1 flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="text-primary font-mono-label text-[11px] truncate">
                      {op.resourceName}
                    </span>
                    <span className="text-[10px] text-outline font-mono-label">
                      {op.destinationLocation || 'Incident Location'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANE: Selected Operation Detail Panel (In-place Command Dossier) */}
        <div
          className={`flex-1 flex flex-col h-full bg-surface overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin transition-all min-w-0 ${
            isMobileDetailView ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {selectedOp ? (
            <>
              {/* Mobile Back Button */}
              <div className="md:hidden pb-1">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-primary hover:text-on-surface font-mono-label text-[12px] font-bold py-1.5 px-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  ← Back to Operations List
                </button>
              </div>

              {/* 1. Header with Operational Status */}
              <DetailsHeader
                badgeId={`OPERATION: ${selectedOp.id.toUpperCase()}`}
                title={selectedOp.operationType}
                severityBadge={selectedOp.resourceCategory || 'Rescue'}
                statusText={`STATE: ${selectedOp.state}`}
                statusColor={
                  String(selectedOp.state).includes('PROGRESS') || String(selectedOp.state).includes('OPERATION')
                    ? 'primary'
                    : 'error'
                }
                accentColor="primary"
                subItems={[
                  { label: 'Resource Assigned', value: selectedOp.resourceName, icon: 'shield' },
                  { label: 'Target Destination', value: selectedOp.destinationLocation || 'Incident Location', icon: 'location_on' },
                  { label: 'Authorized By', value: selectedOp.authorizedBy || 'Authority Command (Level 5)', highlight: true },
                  { label: 'Dispatched At', value: selectedOp.dispatchedTime },
                ]}
              />

              {/* 2. Operational Mission Objective */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
                    Mission Directive &amp; Operational Objective
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-label text-[10px] text-outline">
                      Target: {selectedOp.incidentTitle || selectedOp.incidentId.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3 rounded border border-outline-variant leading-relaxed">
                  {selectedOp.missionObjective}
                </p>
              </section>

              {/* 3. Field Telemetry & Status Progression */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">podcasts</span>
                    Field Telemetry &amp; Live Progression Logs
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-label text-[10px] text-on-surface-variant">
                      Update State:
                    </span>
                    <select
                      value={selectedOp.state}
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      className="bg-background border border-primary/40 text-on-surface font-mono-label text-[10px] font-bold rounded px-2 py-0.5 cursor-pointer focus:ring-1 focus:ring-primary"
                    >
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {(selectedOp.fieldUpdates && selectedOp.fieldUpdates.length > 0) ? (
                    selectedOp.fieldUpdates.map((update, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-container border border-outline-variant rounded flex items-start gap-2.5 font-mono-label text-[11px]"
                      >
                        <span className="text-primary font-bold mt-0.5">▶</span>
                        <span className="text-on-surface leading-relaxed">{update}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-surface-container border border-outline-variant rounded font-mono-label text-[11px] text-on-surface-variant">
                      Unit dispatched and actively transmitting beacon signals to central command.
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Connected Field Recon / Assessment Action */}
              <section className="bg-surface-container-low border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-headline-sm text-[13px] font-bold text-on-surface">
                    Field Reconnaissance Telemetry
                  </h5>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Ingest multi-mode field observations or live drone telemetry for this operational track.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAssessment}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors shrink-0"
                >
                  Ingest Field Recon →
                </button>
              </section>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an operational track from the list to inspect deployment status.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
