'use client'

import React, { useState } from 'react'
import { AerialAsset, AerialAssessmentSubmission } from '../../types'

interface AerialDispatchPanelProps {
  assets: AerialAsset[]
  latestAssessment?: AerialAssessmentSubmission | null
  onDispatch: (id: string) => void
  onOpenAssessmentForm: () => void
}

export default function AerialDispatchPanel({
  assets,
  latestAssessment,
  onDispatch,
  onOpenAssessmentForm,
}: AerialDispatchPanelProps) {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'fieldUpdate'>('dispatch')

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col overflow-hidden h-64">
      {/* Tab Navigation */}
      <div className="flex border-b border-outline-variant bg-surface-container-low">
        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-3 font-headline-sm text-[13px] flex items-center gap-2 transition-colors ${
            activeTab === 'dispatch'
              ? 'text-primary border-b-2 border-primary bg-surface-container-lowest font-bold'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
          Aerial Dispatch
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fieldUpdate')}
          className={`px-4 py-3 font-headline-sm text-[13px] flex items-center gap-2 transition-colors ${
            activeTab === 'fieldUpdate'
              ? 'text-primary border-b-2 border-primary bg-surface-container-lowest font-bold'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">analytics</span>
          Field Update {latestAssessment && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
        </button>
      </div>

      {/* Tab 1: Dispatch */}
      {activeTab === 'dispatch' && (
        <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {assets.map((asset) => {
              const isAvailable = asset.status === 'AVAILABLE'
              const isDispatched = asset.status === 'DISPATCHED'

              return (
                <div
                  key={asset.id}
                  className="flex justify-between items-center p-2 bg-surface border border-outline-variant rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        isAvailable
                          ? 'text-emerald-500'
                          : isDispatched
                          ? 'text-primary'
                          : 'text-tertiary'
                      }`}
                    >
                      {asset.type === 'drone' ? 'precision_manufacturing' : 'helicopter'}
                    </span>
                    <span className="font-body-sm text-on-surface">{asset.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono-label uppercase ${
                        isAvailable
                          ? 'text-emerald-500'
                          : isDispatched
                          ? 'text-primary font-bold'
                          : 'text-tertiary'
                      }`}
                    >
                      {asset.status}
                    </span>

                    {isAvailable && (
                      <button
                        type="button"
                        onClick={() => onDispatch(asset.id)}
                        className="px-3 py-1 bg-primary text-on-primary font-mono-label text-[10px] font-bold rounded hover:bg-primary-fixed transition-colors uppercase tracking-wider"
                      >
                        Dispatch
                      </button>
                    )}

                    {isDispatched && (
                      <button
                        type="button"
                        onClick={onOpenAssessmentForm}
                        className="px-3 py-1 bg-surface-container-highest border border-primary/40 text-primary font-mono-label text-[10px] font-bold rounded hover:bg-surface-bright transition-colors uppercase tracking-wider"
                      >
                        Open Form
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Field Update */}
      {activeTab === 'fieldUpdate' && (
        <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
          {latestAssessment ? (
            <>
              <div className="border-l-2 border-primary pl-3 mb-1 flex justify-between items-start">
                <div>
                  <div className="font-mono-label text-[10px] text-outline-variant uppercase mb-0.5">
                    Verified Mission: {latestAssessment.id} ({latestAssessment.missionType})
                  </div>
                  <div className="font-body-sm text-on-surface font-medium">
                    {latestAssessment.areaSurveyed} • {latestAssessment.assetName}
                  </div>
                </div>
                <span className="text-[10px] font-mono-label bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>

              <ul className="space-y-1 font-body-sm text-[12px] text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-error">block</span>
                  Accessibility: <span className="text-on-surface font-medium">{latestAssessment.roadAccessibility}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-error">home_repair_service</span>
                  Damage: <span className="text-on-surface font-medium">{latestAssessment.structuresAffected} structures affected</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">warning</span>
                  Civilians: <span className="text-on-surface font-medium">{latestAssessment.peopleObserved}</span>
                </li>
              </ul>

              <div className="mt-auto flex items-center justify-between pt-2 border-t border-outline-variant">
                <div className="text-[11px] font-mono-label text-on-surface-variant">
                  Confidence: <span className="text-emerald-500 font-bold">{latestAssessment.confidenceScore}%</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAssessmentForm}
                  className="px-3 py-1.5 border border-primary/40 text-primary font-mono-label text-[10px] rounded hover:bg-surface-container transition-colors uppercase font-semibold"
                >
                  Review Assessment
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="border-l-2 border-outline-variant pl-3 mb-1">
                <div className="font-mono-label text-[10px] text-outline-variant uppercase mb-0.5">
                  Mission Summary
                </div>
                <div className="font-body-sm text-on-surface font-medium">
                  Pre-flight Area Scan • Sector 4 Coastal Basin
                </div>
              </div>

              <ul className="space-y-1 font-body-sm text-[12px] text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-error">block</span>
                  3 roads inaccessible
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-error">home_repair_service</span>
                  2 structures damaged
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">warning</span>
                  ~15 people isolated in pockets
                </li>
              </ul>

              <div className="mt-auto flex items-center justify-between pt-2 border-t border-outline-variant">
                <div className="text-[11px] font-mono-label text-on-surface-variant">
                  Confidence: <span className="text-emerald-500 font-bold">91%</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAssessmentForm}
                  className="px-3 py-1.5 border border-outline-variant text-on-surface font-mono-label text-[10px] rounded hover:bg-surface-container transition-colors uppercase"
                >
                  View Assessment Form
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
