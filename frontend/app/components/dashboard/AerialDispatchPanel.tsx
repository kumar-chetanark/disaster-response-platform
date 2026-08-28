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
              <div className="border-l-2 border-primary pl-3 mb-1 flex justify-between items-start">
                <div>
                  <div className="font-mono-label text-[10px] text-sky-400 uppercase tracking-wider mb-0.5 font-bold">
                    LIVE FIELD INTELLIGENCE & TELEMETRY
                  </div>
                  <div className="font-body-sm text-on-surface font-bold text-[13px]">
                    Sector Scan • Noida, Uttar Pradesh (Incident #1)
                  </div>
                </div>
                <span className="text-[10px] font-mono-label bg-sky-950/60 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded font-bold">
                  ACTIVE SECTOR
                </span>
              </div>

              <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-red-400">crisis_alert</span>
                  <span>Impact: <b className="text-red-300">Tremors & structural damage reported</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">group</span>
                  <span>Population at Risk: <b className="text-white">~45 civilians</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-sky-400">verified_user</span>
                  <span>Recon Readiness: <b className="text-emerald-400">10 Drones & Helos Available</b></span>
                </li>
              </ul>

              <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#1e293b]">
                <div className="text-[11px] font-mono text-slate-400">
                  Sector Confidence: <span className="text-emerald-400 font-bold">95%</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAssessmentForm}
                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-mono text-[10px] rounded uppercase font-bold transition-all shadow"
                >
                  CONDUCT FIELD ASSESSMENT
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
