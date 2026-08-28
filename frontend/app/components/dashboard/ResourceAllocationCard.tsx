'use client'

import React, { useState } from 'react'
import { AllocationAdvisory } from '../../types'

interface ResourceAllocationCardProps {
  advisories: AllocationAdvisory[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onModify: (id: string) => void
}

export default function ResourceAllocationCard({
  advisories,
  onApprove,
  onReject,
  onModify,
}: ResourceAllocationCardProps) {
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const activeReview = advisories.find((a) => a.id === reviewingId)

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-variant gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Resource Allocation Advisory
          </h3>
        </div>
        <div className="font-mono-label text-[10px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded font-bold tracking-wider uppercase flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          AI RECOMMENDS / AUTHORITY DECIDES
        </div>
      </div>

      {/* Advisories */}
      <div className="space-y-3">
        {advisories.length === 0 ? (
          <div className="p-4 bg-surface rounded-lg border border-outline-variant text-center font-mono text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>Zero pending resource deficits or unallocated requests. Fleet status optimal.</span>
          </div>
        ) : (
          advisories.map((advisory) => {
          const isApproved = advisory.status === 'APPROVED'
          const isRejected = advisory.status === 'REJECTED'

          return (
            <div
              key={advisory.id}
              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-surface border rounded transition-all ${
                isApproved
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : isRejected
                  ? 'border-error/40 bg-error/5'
                  : 'border-outline-variant'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-primary-container/10 flex items-center justify-center border border-primary-container/20 text-primary mt-1 md:mt-0 shrink-0">
                  <span className="material-symbols-outlined">
                    {advisory.resourceCategory === 'medical'
                      ? 'medical_services'
                      : advisory.resourceCategory === 'aviation'
                      ? 'helicopter'
                      : advisory.resourceCategory === 'engineering'
                      ? 'construction'
                      : 'directions_boat'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-body-sm font-semibold text-on-surface">
                      {advisory.resourceName}
                    </span>
                    <span className="material-symbols-outlined text-[14px] text-outline-variant">
                      arrow_forward
                    </span>
                    <span className="font-body-sm font-semibold text-on-surface">
                      {advisory.targetIncident}
                    </span>
                  </div>

                  <div className="font-mono-label text-[11px] text-primary mb-1">
                    {advisory.details}
                  </div>

                  <p className="font-body-sm text-on-surface-variant text-[12px]">
                    <span className="text-outline-variant font-medium">Reason:</span> {advisory.reason}
                  </p>

                  <span
                    className={`inline-block mt-2 font-mono-label text-[10px] px-1.5 py-0.5 rounded border uppercase ${
                      isApproved
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isRejected
                        ? 'bg-error/15 text-error border-error/30'
                        : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                    }`}
                  >
                    {advisory.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReviewingId(reviewingId === advisory.id ? null : advisory.id)}
                  className="px-3 py-1.5 font-mono-label text-[11px] border border-outline-variant text-on-surface hover:bg-surface-container transition-colors rounded"
                >
                  Review
                </button>

                {!isApproved && !isRejected && (
                  <>
                    <button
                      type="button"
                      onClick={() => onModify(advisory.id)}
                      className="px-3 py-1.5 font-mono-label text-[11px] border border-outline-variant text-on-surface hover:bg-surface-container transition-colors rounded"
                    >
                      Modify
                    </button>

                    <button
                      type="button"
                      onClick={() => onReject(advisory.id)}
                      className="px-3 py-1.5 font-mono-label text-[11px] border border-outline-variant text-error hover:bg-error/10 transition-colors rounded"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => onApprove(advisory.id)}
                      className="px-4 py-1.5 font-mono-label text-[11px] bg-primary text-on-primary hover:bg-primary-fixed transition-colors rounded font-bold"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        }))}
      </div>

      {/* Review Drawer */}
      {activeReview && (
        <div className="p-4 bg-surface-container-high border border-primary/50 rounded-lg">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-outline-variant">
            <div className="font-mono-label text-[12px] font-bold text-primary uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              Allocation Rationale &amp; Metrics • {activeReview.resourceName}
            </div>
            <button
              type="button"
              onClick={() => setReviewingId(null)}
              className="text-[11px] font-mono-label text-on-surface-variant hover:text-on-surface"
            >
              [Close]
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-label text-[11px]">
            <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
              <span className="text-on-surface-variant block text-[9px] uppercase">Capability Match</span>
              <span className="text-[14px] font-bold text-emerald-400">{activeReview.metrics.capabilityMatch}%</span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
              <span className="text-on-surface-variant block text-[9px] uppercase">Proximity</span>
              <span className="text-[14px] font-bold text-emerald-400">{activeReview.metrics.proximity}%</span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
              <span className="text-on-surface-variant block text-[9px] uppercase">Est. Travel</span>
              <span className="text-[14px] font-bold text-primary">{activeReview.metrics.travelTime}</span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
              <span className="text-on-surface-variant block text-[9px] uppercase">Scarcity</span>
              <span className="text-[14px] font-bold text-tertiary">{activeReview.metrics.scarcity}</span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
              <span className="text-on-surface-variant block text-[9px] uppercase">Competing Needs</span>
              <span className="text-[14px] font-bold text-on-surface">{activeReview.metrics.competingIncidents}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
