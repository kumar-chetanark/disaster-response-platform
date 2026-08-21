'use client'

import React, { useState } from 'react'
import Sidebar from './components/dashboard/Sidebar'
import TopHeader from './components/dashboard/TopHeader'
import ActiveIncidentBanner from './components/dashboard/ActiveIncidentBanner'
import PriorityIncidentsList from './components/dashboard/PriorityIncidentsList'
import ActiveAlertsTicker from './components/dashboard/ActiveAlertsTicker'
import ResourceAllocationCard from './components/dashboard/ResourceAllocationCard'
import ContextualMapPreview from './components/dashboard/ContextualMapPreview'
import AerialDispatchPanel from './components/dashboard/AerialDispatchPanel'
import AerialAssessmentForm from './components/aerial/AerialAssessmentForm'
import {
  PriorityIncident,
  ActiveAlert,
  AllocationAdvisory,
  AerialAsset,
  AerialAssessmentSubmission,
} from './types'

const initialIncidents: PriorityIncident[] = [
  {
    id: 'inc-a',
    title: 'Incident A - Central Grid Failure',
    location: 'Metro District 4',
    impact: 'Severe power loss • Hospital C on backup',
    severity: 'CRITICAL',
    timeReported: '10:42 AM',
  },
  {
    id: 'inc-b',
    title: 'Incident B - Highway 4 Flooding',
    location: 'Coastal Causeway Km 18',
    impact: 'Submerged underpass • 3 vehicles stranded',
    severity: 'HIGH',
    timeReported: '10:35 AM',
  },
  {
    id: 'inc-c',
    title: 'Incident C - Comms Tower Delta Offline',
    location: 'Highland Ridge',
    impact: 'Cell coverage degraded 30% • Radio fallback',
    severity: 'MEDIUM',
    timeReported: '10:15 AM',
  },
  {
    id: 'inc-d',
    title: 'Incident D - East Levee Seepage',
    location: 'Riverfront Sector 2',
    impact: 'Pre-breach warning • 400 households alerted',
    severity: 'HIGH',
    timeReported: '09:58 AM',
  },
  {
    id: 'inc-e',
    title: 'Incident E - Route 9 Bridge Structural Crack',
    location: 'Harbor Crossing',
    impact: 'Heavy transit restricted • Inspection required',
    severity: 'MEDIUM',
    timeReported: '09:40 AM',
  },
  {
    id: 'inc-f',
    title: 'Incident F - Shelter Bay Power Generator Fault',
    location: 'Civic Arena Shelter',
    impact: 'Backup generator intermittent • 1,200 evacuees',
    severity: 'CRITICAL',
    timeReported: '09:22 AM',
  },
]

const initialAlerts: ActiveAlert[] = [
  {
    id: 'alt-1',
    time: '10:42 AM',
    category: 'INFRASTRUCTURE',
    message: 'Hospital C power issue detected. Backup generators engaged but showing low fuel reserves (4h remaining).',
  },
  {
    id: 'alt-2',
    time: '10:28 AM',
    category: 'CIVIL',
    message: 'Evacuation warning issued for Lowland Sector 4. Traffic congestion reported on exit routes.',
  },
  {
    id: 'alt-3',
    time: '10:15 AM',
    category: 'METEO',
    message: 'Weather update: Sustained winds decreasing, but precipitation expected to increase by 20mm/hr over coastal basin.',
  },
  {
    id: 'alt-4',
    time: '09:55 AM',
    category: 'MEDICAL',
    message: 'Urgent medical supplies requested at Station 7: 50x trauma kits, insulin refrigeration units.',
  },
  {
    id: 'alt-5',
    time: '09:30 AM',
    category: 'INFRASTRUCTURE',
    message: 'Water pumping station #3 tripped offline due to sediment surge. Engineers en route.',
  },
  {
    id: 'alt-6',
    time: '09:10 AM',
    category: 'CIVIL',
    message: 'Shelter capacity in Sector 7 reached 92%. Rerouting incoming buses to West Arena.',
  },
]

const initialAdvisories: AllocationAdvisory[] = [
  {
    id: 'adv-1',
    resourceName: 'Medical Team Alpha',
    resourceCategory: 'medical',
    targetIncident: 'Incident A',
    details: '12 personnel • 3 vehicles • ~18 km',
    reason: 'Medical capability + proximity + incident severity',
    status: 'RECOMMENDED',
    metrics: {
      capabilityMatch: 100,
      proximity: 92,
      travelTime: '18 min',
      scarcity: 'HIGH',
      competingIncidents: 2,
    },
  },
  {
    id: 'adv-2',
    resourceName: 'Swift Water Boat Unit 3',
    resourceCategory: 'boat',
    targetIncident: 'Incident B',
    details: '2 boats • 8 personnel • ~24 km',
    reason: 'Flood rescue capability + proximity + resource availability',
    status: 'RECOMMENDED',
    metrics: {
      capabilityMatch: 95,
      proximity: 88,
      travelTime: '24 min',
      scarcity: 'MEDIUM',
      competingIncidents: 1,
    },
  },
]

const initialAerialAssets: AerialAsset[] = [
  { id: 'drone-1', name: 'Drone Alpha', type: 'drone', status: 'AVAILABLE' },
  { id: 'helo-2', name: 'Helicopter 02', type: 'helicopter', status: 'AVAILABLE' },
  { id: 'helo-3', name: 'Rescue Helicopter', type: 'helicopter', status: 'IN USE' },
]

export default function App() {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('inc-a')

  // Domain State
  const [incidents, setIncidents] = useState<PriorityIncident[]>(initialIncidents)
  const [alerts, setAlerts] = useState<ActiveAlert[]>(initialAlerts)
  const [advisories, setAdvisories] = useState<AllocationAdvisory[]>(initialAdvisories)
  const [aerialAssets, setAerialAssets] = useState<AerialAsset[]>(initialAerialAssets)
  const [latestAssessment, setLatestAssessment] = useState<AerialAssessmentSubmission | null>(null)
  
  // KPI / Reassessment banner state
  const [isReassessed, setIsReassessed] = useState(false)
  const [resourceCoverage, setResourceCoverage] = useState('84%')

  // Notification Toast State
  const [notification, setNotification] = useState<{
    msg: string
    type?: 'info' | 'success' | 'warning'
  } | null>(null)

  const showNotification = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // 1. Authority Actions on Advisory (Step H/I)
  const handleApproveAdvisory = (id: string) => {
    setAdvisories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a))
    )
    showNotification('Authority Decision Confirmed: Resource Approved and Dispatched to Field.', 'success')
  }

  const handleRejectAdvisory = (id: string) => {
    setAdvisories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' } : a))
    )
    showNotification('Authority Decision: Recommendation Rejected. Re-evaluating resource pool.', 'warning')
  }

  const handleModifyAdvisory = (id: string) => {
    setAdvisories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'MODIFIED' } : a))
    )
    showNotification('Authority Notice: Modification mode enabled for deployment parameters.')
  }

  // 2. Aerial Dispatch Action (Authority Dispatches Physical Asset)
  const handleDispatchAerial = (id: string) => {
    const asset = aerialAssets.find((a) => a.id === id)
    if (!asset || asset.status !== 'AVAILABLE') return

    setAerialAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'DISPATCHED' } : a))
    )
    showNotification(
      `Authority Action: ${asset.name} authorized & dispatched to Sector 4 Coastal Basin. Assessment console ready.`,
      'success'
    )
  }

  // 3. SUBMIT TO COMMAND (Field Operator Submits Structured Assessment)
  const handleAssessmentSubmit = (submission: AerialAssessmentSubmission) => {
    setLatestAssessment(submission)

    // A. Update Incident A with verified field findings
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === 'inc-a'
          ? {
              ...inc,
              title: 'Incident A - Sector 4 (Field Verified)',
              impact: `Verified: ${submission.structuresAffected} structures destroyed • ${submission.peopleObserved} • ${submission.roadAccessibility}`,
              severity: 'CRITICAL',
            }
          : inc
      )
    )

    // B. Inject high-priority real-time Alert from field telemetry
    const newAlert: ActiveAlert = {
      id: `alt-${Date.now()}`,
      time: submission.submittedAt,
      category: 'CIVIL',
      message: `[FIELD REPORT - ${submission.id}] Aerial recon confirms ${submission.roadAccessibility} in ${submission.areaSurveyed}. Specialized extraction required.`,
    }
    setAlerts((prev) => [newAlert, ...prev])

    // C. Recalculate Resource Allocation Advisories based on field findings
    const updatedAdvisories: AllocationAdvisory[] = [
      {
        id: 'adv-new-1',
        resourceName: 'Air Evacuation Chopper 1',
        resourceCategory: 'aviation',
        targetIncident: 'Incident A (Sector 4)',
        details: '1 helicopter • 4 crew • Specialized hoist • ~8 min',
        reason: `Recon verified Route 9 impassable + ~15 civilians isolated. Air extraction capability matched (Confidence ${submission.confidenceScore}%).`,
        status: 'RECOMMENDED',
        metrics: {
          capabilityMatch: 99,
          proximity: 96,
          travelTime: '8 min',
          scarcity: 'HIGH',
          competingIncidents: 1,
        },
      },
      {
        id: 'adv-new-2',
        resourceName: 'Heavy Engineering Unit B',
        resourceCategory: 'engineering',
        targetIncident: 'Incident A (Bridge)',
        details: '2 heavy dozers • Structural crew • ~25 min',
        reason: 'Bridge route clearance & structural support needed to establish ground evacuation corridor.',
        status: 'RECOMMENDED',
        metrics: {
          capabilityMatch: 92,
          proximity: 84,
          travelTime: '25 min',
          scarcity: 'MEDIUM',
          competingIncidents: 1,
        },
      },
      ...advisories.filter((a) => a.id !== 'adv-1'),
    ]
    setAdvisories(updatedAdvisories)

    // D. Mark asset as IN USE after mission submission
    setAerialAssets((prev) =>
      prev.map((a) => (a.id === submission.assetId ? { ...a, status: 'IN USE' } : a))
    )

    // E. Update KPI / Banner status
    setIsReassessed(true)
    setResourceCoverage('92%')

    // F. Return Authority to Command Dashboard & show confirm toast
    setCurrentTab('dashboard')
    showNotification(
      `Assessment ${submission.id} Integrated! Incident A updated. Priority & advisory recommendations recalculated.`,
      'success'
    )
  }

  // Render Aerial Assessment Form when tab is 'aerial'
  if (currentTab === 'aerial') {
    const dispatchedAsset = aerialAssets.find((a) => a.status === 'DISPATCHED') || aerialAssets[0]
    return (
      <div className="bg-background text-on-background font-body-base antialiased h-screen overflow-hidden flex w-full">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="ml-sidebar-width flex-1 h-screen overflow-y-auto pb-12">
          <AerialAssessmentForm
            initialIncidentTitle="Cyclone Alpha 4 — Sector 4"
            initialAsset={dispatchedAsset}
            onSubmit={handleAssessmentSubmit}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        </main>
      </div>
    )
  }

  // Default Operational Command Dashboard
  return (
    <div className="bg-background text-on-background font-body-base antialiased h-screen overflow-hidden flex w-full">
      {/* 1. Top Header */}
      <TopHeader />

      {/* 2. Persistent Navigation Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* 3. Main Content Wrapper with proper header offset and scrolling */}
      <div className="flex-1 ml-sidebar-width flex flex-col relative h-full pt-header-height bg-surface">
        <main className="flex-1 px-6 pt-6 pb-12 overflow-y-auto flex flex-col gap-6">
          {/* Toast Notification Banner */}
          {notification && (
            <div
              className={`p-3 rounded font-mono-label text-[11px] flex items-center justify-between animate-in fade-in transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                : notification.type === 'warning'
                  ? 'bg-amber-950/40 border border-amber-500/50 text-amber-300'
                  : 'bg-primary/10 border border-primary/30 text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  {notification.type === 'success' ? 'check_circle' : 'info'}
                </span>
                <span>{notification.msg}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-on-surface-variant hover:text-white cursor-pointer px-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dynamic Closed-Loop Reassessment Notice */}
          {isReassessed && (
            <div className="p-3.5 bg-surface-container-high border-l-4 border-emerald-500 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <div className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                    Aerial Recon Ingested: Priority Recalculated
                    <span className="font-mono-label text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded uppercase">
                      Live Updated
                    </span>
                  </div>
                  <div className="font-body-sm text-[12px] text-on-surface-variant">
                    Recon data from Mission {latestAssessment?.id} verified impassable roads. 2 new AI recommendations generated for Air Extraction.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('aerial')}
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container text-on-surface font-mono-label text-[11px] rounded transition-colors shrink-0 uppercase tracking-wider"
              >
                View Recon Dossier
              </button>
            </div>
          )}

          {/* 1. Active Incident Banner */}
          <ActiveIncidentBanner
            onViewIncident={() => showNotification('Viewing full incident dossier for Cyclone Alpha 4.')}
            onViewRecommendations={() => showNotification('Focusing on AI Resource Allocation Recommendations.')}
            resourceCoverage={resourceCoverage}
            isReassessed={isReassessed}
          />

          {/* 2. Priority Incidents & Active Alerts Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriorityIncidentsList
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={(id) => {
                setSelectedIncidentId(id)
                showNotification(`Selected: ${incidents.find((i) => i.id === id)?.title}`)
              }}
            />

            <ActiveAlertsTicker alerts={alerts} />
          </section>

          {/* 3. Resource Allocation Advisory Card */}
          <ResourceAllocationCard
            advisories={advisories}
            onApprove={handleApproveAdvisory}
            onReject={handleRejectAdvisory}
            onModify={handleModifyAdvisory}
          />

          {/* 4. Bottom Grid: Contextual Map & Aerial Dispatch Panel */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContextualMapPreview />

            <AerialDispatchPanel
              assets={aerialAssets}
              latestAssessment={latestAssessment}
              onDispatch={handleDispatchAerial}
              onOpenAssessmentForm={() => setCurrentTab('aerial')}
            />
          </section>

          {/* Bottom spacer for clean visual breathing room */}
          <div className="h-6 shrink-0" aria-hidden="true" />
        </main>
      </div>
    </div>
  )
}
