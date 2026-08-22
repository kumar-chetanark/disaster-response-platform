'use client'

import React, { useState } from 'react'
import { OperationRecord, OperationState } from '../../types'
import SearchInput from '../common/SearchInput'
import DetailsHeader from '../common/DetailsHeader'

interface OperationsConsoleProps {
  operations: OperationRecord[]
  selectedOperationId: string | null
  onSelectOperation: (id: string) => void
  onOpenAssessment: () => void
}

export default function OperationsConsole({
  operations,
  selectedOperationId,
  onSelectOperation,
  onOpenAssessment,
}: OperationsConsoleProps) {
  const [filterState, setFilterState] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedOp =
    operations.find((op) => op.id === selectedOperationId) || operations[0]

  const filteredOperations = operations.filter((op) => {
    const matchesState = filterState === 'ALL' || op.state === filterState
    const matchesSearch =
      op.operationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.incidentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesState && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Header / Filter Toolbar */}
      <div className="px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">map</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Active Operations Ledger
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Operational track records generated exclusively upon Authority resource dispatch
            </p>
          </div>
        </div>

        {/* Search & State Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search operations, assets..."
            className="w-56"
          />

          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-7 cursor-pointer"
          >
            <option value="ALL">State: ALL</option>
            <option value="PLANNED">PLANNED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="IN TRANSIT">IN TRANSIT</option>
            <option value="IN OPERATION">IN OPERATION</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Operations List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-outline-variant flex flex-col h-full bg-surface-container-lowest">
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {filteredOperations.length} Active Tracks
            </span>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Authority Dispatch Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredOperations.map((op) => {
              const isSelected = selectedOp?.id === op.id
              return (
                <div
                  key={op.id}
                  onClick={() => onSelectOperation(op.id)}
                  className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    isSelected
                      ? 'bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                      op.state === 'IN OPERATION'
                        ? 'bg-emerald-400'
                        : op.state === 'DISPATCHED' || op.state === 'IN TRANSIT'
                        ? 'bg-primary'
                        : 'bg-outline'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2 pl-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-label text-[10px] text-primary font-bold">
                          {op.id}
                        </span>
                        <span className="text-outline-variant text-[10px]">•</span>
                        <span
                          className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                            op.state === 'IN OPERATION'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : op.state === 'DISPATCHED' || op.state === 'IN TRANSIT'
                              ? 'bg-primary/15 text-primary border-primary/30'
                              : 'bg-surface text-on-surface-variant border-outline-variant'
                          }`}
                        >
                          {op.state}
                        </span>
                      </div>
                      <h4 className="font-body-sm font-semibold text-[13px] text-on-surface mt-0.5 leading-snug">
                        {op.operationType}
                      </h4>
                    </div>

                    <span className="font-mono-label text-[9px] text-on-surface-variant shrink-0">
                      {op.dispatchedTime}
                    </span>
                  </div>

                  <div className="pl-1 text-on-surface-variant font-body-sm text-[12px] leading-tight space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono-label text-primary font-medium">
                      <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                      <span>{op.resourceName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono-label text-outline">
                      <span className="material-symbols-outlined text-[13px]">emergency</span>
                      <span className="truncate">{op.incidentTitle}</span>
                    </div>
                  </div>

                  <div className="pl-1 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono-label text-on-surface-variant">
                    <span>{op.location}</span>
                    <span>ETA: {op.estimatedCompletion}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANE: Selected Operation Detail Dossier */}
        <div className="flex-1 flex flex-col h-full bg-surface overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {selectedOp ? (
            <>
              {/* 1. Compact Consistent Details Header */}
              <DetailsHeader
                badgeId={`OPERATION ID: ${selectedOp.id}`}
                title={selectedOp.operationType}
                statusText={`STATUS: ${selectedOp.state}`}
                statusColor={selectedOp.state === 'IN OPERATION' ? 'emerald' : 'primary'}
                accentColor="primary"
                subItems={[
                  { label: 'Resource', value: selectedOp.resourceName, icon: 'local_shipping', highlight: true },
                  { label: 'Incident', value: selectedOp.incidentTitle, icon: 'emergency' },
                  { label: 'Location', value: selectedOp.location },
                  { label: 'Authority', value: selectedOp.authorizedBy },
                ]}
                extraAction={
                  <div className="flex items-center gap-3 bg-surface px-3.5 py-2 rounded border border-outline-variant">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono-label text-on-surface-variant uppercase">Est. Completion</span>
                      <span className="font-headline-sm text-[13px] text-emerald-400 font-bold leading-tight">
                        {selectedOp.estimatedCompletion}
                      </span>
                    </div>
                  </div>
                }
              />

              {/* 2. Mission Objective & Authority Directive */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2.5">
                <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">target</span>
                  Mission Purpose &amp; Directive
                </h4>
                <p className="font-body-base text-[13px] text-on-surface bg-surface-container p-3 rounded border border-outline-variant leading-relaxed">
                  {selectedOp.missionObjective}
                </p>
              </section>

              {/* 3. Tactical Spatial Path */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">near_me</span>
                    Tactical Spatial Path • {selectedOp.location}
                  </h4>
                  <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Live Telemetry Sync Active
                  </span>
                </div>

                <div className="w-full h-40 bg-surface-container-low rounded border border-outline-variant relative map-grid flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 600 160" className="w-full h-full opacity-40 text-outline" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M 0,90 Q 150,60 300,100 T 600,80" stroke="#38bdf8" strokeDasharray="4 4" />
                  </svg>
                  <div className="absolute top-[45%] left-[40%] flex items-center gap-1.5 bg-primary/90 text-surface font-mono-label text-[11px] px-2.5 py-1 rounded font-bold shadow-lg animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">navigation</span>
                    {selectedOp.resourceName} ({selectedOp.state})
                  </div>
                </div>
              </section>

              {/* 4. Field Progress Updates */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
                <h4 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
                  Chronological Field Updates ({selectedOp.fieldUpdates.length})
                </h4>

                <div className="space-y-2">
                  {selectedOp.fieldUpdates.map((update, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-surface-container-low border border-outline-variant rounded flex items-start gap-2.5"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="text-[12px] font-body-sm text-on-surface leading-snug">
                        {update}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              Select an operation track to view details and live status.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
