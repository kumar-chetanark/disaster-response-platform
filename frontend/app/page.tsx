'use client'

import React, { useState, useEffect } from 'react'
import TopHeader from './components/dashboard/TopHeader'
import Sidebar from './components/dashboard/Sidebar'
import ActiveIncidentBanner from './components/dashboard/ActiveIncidentBanner'
import PriorityIncidentsList from './components/dashboard/PriorityIncidentsList'
import ActiveAlertsTicker from './components/dashboard/ActiveAlertsTicker'
import ResourceAllocationCard from './components/dashboard/ResourceAllocationCard'
import ContextualMapPreview from './components/dashboard/ContextualMapPreview'
import AerialDispatchPanel from './components/dashboard/AerialDispatchPanel'

import CitizenLandingPage from './components/citizen/CitizenLandingPage'
import AuthorityLoginModal from './components/auth/AuthorityLoginModal'
import IncidentsConsole from './components/incidents/IncidentsConsole'
import OperationsConsole from './components/operations/OperationsConsole'
import ResourcesConsole from './components/resources/ResourcesConsole'
import AssessmentForm from './components/aerial/AerialAssessmentForm'
import AlertsConsole from './components/alerts/AlertsConsole'
import ReportsConsole from './components/reports/ReportsConsole'

import {
  UserSession,
  Incident,
  ActiveAlert,
  OperationRecord,
  ResourceUnit,
  ResourceStatus,
  AllocationAdvisory,
  AerialAsset,
  AssessmentSubmission,
  CitizenReportSubmission,
  PlatformReport,
} from './types'
import { platformDataService } from './services/dataService'

export default function App() {
  // Session: Default CITIZEN experience
  const [session, setSession] = useState<UserSession>({ role: 'CITIZEN' })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Current Active View inside Authority Platform
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('inc-a')
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>('OP-8821')
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('alt-1')
  const [selectedReportId, setSelectedReportId] = useState<string | null>('REP-901')

  // Shared domain state managed through service layer
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [alerts, setAlerts] = useState<ActiveAlert[]>([])
  const [operations, setOperations] = useState<OperationRecord[]>([])
  const [resources, setResources] = useState<ResourceUnit[]>([])
  const [advisories, setAdvisories] = useState<AllocationAdvisory[]>([])
  const [aerialAssets, setAerialAssets] = useState<AerialAsset[]>([])
  const [reports, setReports] = useState<PlatformReport[]>([])
  const [latestAssessment, setLatestAssessment] = useState<AssessmentSubmission | null>(null)
  
  const [isReassessed, setIsReassessed] = useState(false)
  const [resourceCoverage, setResourceCoverage] = useState('84%')

  const [notification, setNotification] = useState<{
    msg: string
    type?: 'info' | 'success' | 'warning'
  } | null>(null)

  const showNotification = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Load initial data through service layer
  useEffect(() => {
    async function loadData() {
      const [inc, alt, ops, res, adv, ast, rep] = await Promise.all([
        platformDataService.getIncidents(),
        platformDataService.getAlerts(),
        platformDataService.getOperations(),
        platformDataService.getResources(),
        platformDataService.getAdvisories(),
        platformDataService.getAerialAssets(),
        platformDataService.getReports(),
      ])
      setIncidents(inc)
      setAlerts(alt)
      setOperations(ops)
      setResources(res)
      setAdvisories(adv)
      setAerialAssets(ast)
      setReports(rep)
    }
    loadData()
  }, [])

  // 1. Citizen Report Ingestion
  const handleCitizenReport = async (sub: CitizenReportSubmission) => {
    await platformDataService.submitCitizenReport(sub)
    const [updatedIncidents, updatedAlerts] = await Promise.all([
      platformDataService.getIncidents(),
      platformDataService.getAlerts(),
    ])
    setIncidents(updatedIncidents)
    setAlerts(updatedAlerts)
  }

  // 2. Authority Decision on Advisories -> Create Operation Record
  const handleApproveAdvisory = (id: string) => {
    const adv = advisories.find((a) => a.id === id)
    if (!adv) return

    setAdvisories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a))
    )

    const newOp: OperationRecord = {
      id: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      operationType: adv.resourceCategory === 'medical' ? 'Medical Emergency Response' : 'Rescue Team Mission',
      incidentId: adv.targetIncidentId || 'inc-a',
      incidentTitle: adv.targetIncident,
      resourceId: adv.resourceId || 'res-alloc',
      resourceName: adv.resourceName,
      location: 'Sector 7G Coastal Basin',
      state: 'DISPATCHED',
      dispatchedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedCompletion: '~20 min',
      authorizedBy: session.userName || 'Cmdr. J. Vance',
      missionObjective: adv.reason,
      fieldUpdates: [
        `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: Authority approval granted. Resource unit dispatched.`,
      ],
    }
    setOperations((prev) => [newOp, ...prev])

    showNotification('Authority Decision: Resource Allocation Approved & Operational Track Dispatched.', 'success')
  }

  const handleRejectAdvisory = (id: string) => {
    setAdvisories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' } : a))
    )
    showNotification('Authority Decision: Advisory Recommendation Rejected.', 'warning')
  }

  const handleModifyAdvisory = (id: string) => {
    setAdvisories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'MODIFIED' } : a))
    )
    showNotification('Authority Notice: Modify mode engaged for resource deployment.')
  }

  // 3. Resource Management Actions (Authority-Only)
  const handleUpdateResourceStatus = (id: string, newStatus: ResourceStatus) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    showNotification(`Resource ${id} status updated to ${newStatus}.`, 'info')
  }

  const handleAddResource = (newRes: ResourceUnit) => {
    setResources((prev) => [newRes, ...prev])
    showNotification(`Resource ${newRes.name} added to operational inventory.`, 'success')
  }

  // 4. Assessment Dispatch Action
  const handleDispatchAerial = (id: string) => {
    const asset = aerialAssets.find((a) => a.id === id)
    if (!asset || asset.status !== 'AVAILABLE') return

    setAerialAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'DISPATCHED' } : a))
    )

    const newOp: OperationRecord = {
      id: `OP-RECON-${Math.floor(1000 + Math.random() * 9000)}`,
      operationType: asset.type === 'drone' ? 'Drone Reconnaissance' : 'Helicopter Air Evacuation',
      incidentId: 'inc-a',
      incidentTitle: 'Cyclone Alpha 4 (Sector 7G)',
      resourceId: asset.id,
      resourceName: asset.name,
      location: 'Sector 7G Coastal Basin',
      state: 'DISPATCHED',
      dispatchedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedCompletion: '~30 min',
      authorizedBy: session.userName || 'Cmdr. J. Vance',
      missionObjective: 'Perform comprehensive multi-hazard reconnaissance and verify road accessibility.',
      fieldUpdates: [
        `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: Field assessment team dispatched. Telemetry live.`,
      ],
    }
    setOperations((prev) => [newOp, ...prev])

    showNotification(
      `Authority Action: ${asset.name} authorized & dispatched to Sector 7G. Assessment console ready.`,
      'success'
    )
  }

  // 5. SUBMIT TO COMMAND (Field Operator Submits Structured Assessment)
  const handleAssessmentSubmit = async (submission: AssessmentSubmission) => {
    await platformDataService.submitAssessment(submission)
    const updatedIncidents = await platformDataService.getIncidents()
    setIncidents(updatedIncidents)
    setLatestAssessment(submission)

    const newAlert: ActiveAlert = {
      id: `alt-${Date.now()}`,
      time: submission.submittedAt,
      category: 'CIVIL',
      source: `Field Assessment Mission ${submission.id}`,
      location: submission.areaSurveyed,
      message: `[FIELD REPORT] Recon confirms ${submission.roadAccessibility} in ${submission.areaSurveyed}. Specialized extraction required.`,
      severity: 'critical',
      relatedIncidentId: 'inc-a',
      relatedIncidentTitle: 'Cyclone Alpha 4 (Sector 7G)',
      isReviewedByAuthority: false,
    }
    setAlerts((prev) => [newAlert, ...prev])

    const updatedAdvisories: AllocationAdvisory[] = [
      {
        id: 'adv-new-1',
        targetIncidentId: 'inc-a',
        resourceName: 'Air Evacuation Chopper 1',
        resourceCategory: 'aviation',
        targetIncident: 'Incident A (Sector 7G)',
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
        targetIncidentId: 'inc-a',
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

    setAerialAssets((prev) =>
      prev.map((a) => (a.id === submission.assetId ? { ...a, status: 'IN USE' } : a))
    )

    const newPlatformReport: PlatformReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      reportType: 'Assessment Mission Report',
      title: `Field Recon Mission ${submission.id} Post-Action Telemetry`,
      timestamp: submission.submittedAt,
      relatedIncidentId: 'inc-a',
      author: `${submission.assetName} (${submission.assessmentMode})`,
      summary: `Verified ${submission.structuresAffected} damaged structures and ${submission.roadAccessibility}. Recommendations generated for air extraction.`,
      metricsSummary: `Confidence: ${submission.confidenceScore}% • ${submission.evacuationStatus}`,
      tags: ['field_recon', 'telemetry', 'sector7g'],
    }
    setReports((prev) => [newPlatformReport, ...prev])

    setIsReassessed(true)
    setResourceCoverage('92%')
    setCurrentTab('dashboard')
    showNotification(
      `Assessment ${submission.id} Integrated! Incident A updated. Priority & advisory recommendations recalculated.`,
      'success'
    )
  }

  // 6. Citizen Experience: Default View
  if (session.role === 'CITIZEN') {
    return (
      <>
        <CitizenLandingPage
          onReportSubmitted={handleCitizenReport}
          onNavigateToAuthorityLogin={() => setIsAuthModalOpen(true)}
        />
        <AuthorityLoginModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(s) => {
            setSession(s)
            setIsAuthModalOpen(false)
            showNotification(`Authenticated as ${s.userName} (Authority Level ${s.authorityLevel}). Welcome to Command Platform.`, 'success')
          }}
        />
      </>
    )
  }

  // 7. Authority Command Platform Views
  const renderAuthorityContent = () => {
    switch (currentTab) {
      case 'incidents':
        return (
          <IncidentsConsole
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            advisories={advisories}
            onSelectIncident={(id) => setSelectedIncidentId(id)}
            onOpenAssessment={() => setCurrentTab('assessment')}
          />
        )

      case 'operations':
        return (
          <OperationsConsole
            operations={operations}
            selectedOperationId={selectedOperationId}
            onSelectOperation={(id) => setSelectedOperationId(id)}
            onOpenAssessment={() => setCurrentTab('assessment')}
          />
        )

      case 'resources':
        return (
          <ResourcesConsole
            resources={resources}
            advisories={advisories}
            onApproveAdvisory={handleApproveAdvisory}
            onRejectAdvisory={handleRejectAdvisory}
            onModifyAdvisory={handleModifyAdvisory}
            onUpdateResourceStatus={handleUpdateResourceStatus}
            onAddResource={handleAddResource}
          />
        )

      case 'assessment':
      case 'assessments':
      case 'aerial': {
        const dispatchedAsset = aerialAssets.find((a) => a.status === 'DISPATCHED') || aerialAssets[0]
        return (
          <AssessmentForm
            initialIncidentTitle="Cyclone Alpha 4 — Sector 7G Coastal Basin"
            initialAsset={dispatchedAsset}
            onSubmit={handleAssessmentSubmit}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )
      }

      case 'alerts':
        return (
          <AlertsConsole
            alerts={alerts}
            selectedAlertId={selectedAlertId}
            onSelectAlert={(val: any) => setSelectedAlertId(typeof val === 'string' ? val : val?.id || null)}
            onNavigateToIncident={(incId: string) => {
              setSelectedIncidentId(incId)
              setCurrentTab('incidents')
            }}
            onMarkReviewed={(altId: string) => {
              setAlerts((prev) =>
                prev.map((a) => (a.id === altId ? { ...a, isReviewedByAuthority: true } : a))
              )
              showNotification('Alert marked as reviewed by Authority.', 'info')
            }}
          />
        )

      case 'reports':
        return (
          <ReportsConsole
            reports={reports}
            incidents={incidents}
            selectedReportId={selectedReportId}
            onSelectReport={(id) => setSelectedReportId(id)}
            onNavigateToIncident={(incId: string) => {
              setSelectedIncidentId(incId)
              setCurrentTab('incidents')
            }}
          />
        )

      case 'settings':
        return (
          <div className="p-6 md:p-8 space-y-4">
            <h2 className="font-headline-md text-[18px] font-bold text-on-surface">Platform Settings &amp; Node Telemetry</h2>
            <div className="p-4 bg-surface-container rounded border border-outline-variant text-[12px] font-mono-label space-y-2 max-w-xl">
              <div>Telemetry Mode: <span className="text-emerald-400">Mesh Sync Connected</span></div>
              <div>Authority Level: <span className="text-primary font-bold">Level 5 (Command Director)</span></div>
              <div>Node ID: <span className="text-outline">AGY-NODE-007G</span></div>
              <div>Deduplication Window: <span className="text-on-surface">300 seconds</span></div>
            </div>
          </div>
        )

      case 'support':
        return (
          <div className="p-6 md:p-8 space-y-4">
            <h2 className="font-headline-md text-[18px] font-bold text-on-surface">Operational Command Support</h2>
            <div className="p-4 bg-surface-container rounded border border-outline-variant text-[12px] font-mono-label space-y-2 max-w-xl">
              <div>Secure Radio Channel: <span className="text-primary font-bold">SEC-TAC-9</span></div>
              <div>Disaster Response Desk: <span className="text-on-surface">+91 11 2343 8000</span></div>
              <div>Satellite Comms Backup: <span className="text-emerald-400">ACTIVE</span></div>
            </div>
          </div>
        )

      case 'dashboard':
      default:
        return (
          <main className="flex-1 px-4 sm:px-6 pt-6 pb-12 overflow-y-auto flex flex-col gap-6 scrollbar-thin min-w-0">
            {/* Toast Notification */}
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

            {/* Dynamic Closed-Loop Reassessment Banner */}
            {isReassessed && (
              <div className="p-3.5 bg-surface-container-high border-l-4 border-emerald-500 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <div>
                    <div className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
                      Assessment Telemetry Ingested: Priority Recalculated
                      <span className="font-mono-label text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded uppercase">
                        Live Updated
                      </span>
                    </div>
                    <div className="font-body-sm text-[12px] text-on-surface-variant">
                      Recon data from Mission {latestAssessment?.id} verified impassable roads. 2 new AI recommendations generated for Air Extraction.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('incidents')}
                    className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container text-on-surface font-mono-label text-[11px] rounded transition-colors shrink-0 uppercase tracking-wider cursor-pointer"
                  >
                    View Incident Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('assessment')}
                    className="px-3 py-1.5 bg-primary/15 border border-primary/40 hover:bg-primary/25 text-primary font-mono-label text-[11px] rounded transition-colors shrink-0 uppercase tracking-wider font-bold cursor-pointer"
                  >
                    View Recon Form
                  </button>
                </div>
              </div>
            )}

            {/* 1. Active Incident Banner */}
            <ActiveIncidentBanner
              onViewIncident={() => {
                setSelectedIncidentId('inc-a')
                setCurrentTab('incidents')
              }}
              onViewRecommendations={() => {
                setCurrentTab('resources')
              }}
              resourceCoverage={resourceCoverage}
              isReassessed={isReassessed}
            />

            {/* 2. Priority Incidents & Active Alerts Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <PriorityIncidentsList
                incidents={incidents}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={(id) => {
                  setSelectedIncidentId(id)
                  setCurrentTab('incidents')
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
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ContextualMapPreview />

              <AerialDispatchPanel
                assets={aerialAssets}
                latestAssessment={latestAssessment}
                onDispatch={handleDispatchAerial}
                onOpenAssessmentForm={() => setCurrentTab('assessment')}
              />
            </section>

            <div className="h-6 shrink-0" aria-hidden="true" />
          </main>
        )
    }
  }

  const handleToggleSidebar = () => {
    // On small screens, toggle mobile drawer. On desktop, toggle collapse
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev)
    } else {
      setIsSidebarCollapsed((prev) => !prev)
    }
  }

  return (
    <div className="bg-background text-on-background font-body-base antialiased h-screen overflow-hidden flex w-full">
      {/* 1. Top Header with Hamburger Control */}
      <TopHeader
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* 2. Responsive Persistent Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onSelectTab={setCurrentTab}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={() => {
          setSession({ role: 'CITIZEN' })
          showNotification('Logged out of Authority Command Platform.', 'info')
        }}
      />

      {/* 3. Main Content Area with Responsive Desktop Offset */}
      <div
        className={`flex-1 flex flex-col relative h-full pt-header-height bg-surface overflow-hidden transition-all duration-200 ${
          /* Desktop layout offset */
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-sidebar-width'
        } ml-0`}
      >
        {renderAuthorityContent()}
      </div>
    </div>
  )
}
