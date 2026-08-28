'use client'

import ConfirmDialogProvider, { showConfirmDialog } from './components/common/ConfirmDialog'
import { ToastContainer, toast } from 'react-toastify'

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


  // Session: Default CITIZEN experience (Hydration safe)
  const [session, setSession] = useState<UserSession>({ role: 'CITIZEN' })
  const [isClientReady, setIsClientReady] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Auto-verify and restore authority session from localStorage on startup
  useEffect(() => {
    setIsClientReady(true)
    async function restoreSession() {
      try {
        const storedUser = localStorage.getItem('authority_session_user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          setSession(parsed)
        }
        const token = localStorage.getItem('authority_session_token')
        if (token) {
          try {
            const res = await platformDataService.authVerify(token)
            if (res && res.authenticated && res.user) {
              const updatedSession = {
                role: 'AUTHORITY' as const,
                userName: res.user.name,
                badgeId: res.user.badge_id,
                authorityLevel: res.user.authority_level,
              }
              setSession(updatedSession)
              localStorage.setItem('authority_session_user', JSON.stringify(updatedSession))
            }
          } catch {
            // Retain local authority session even if network re-auth is pending
          }
        }
      } catch (err) {
        console.warn('Could not restore previous authority session:', err)
      }
    }
    restoreSession()
  }, [])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Current Active View inside Authority Platform
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null)
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

  // Unseen tracking sets for dynamic badge reduction
  const [seenAlertIds, setSeenAlertIds] = useState<Set<string>>(new Set())
  const [seenIncidentIds, setSeenIncidentIds] = useState<Set<string>>(new Set())
  const [seenReportIds, setSeenReportIds] = useState<Set<string>>(new Set())
  const [seenOperationIds, setSeenOperationIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSeenAlertIds(platformDataService.getSeenIds('alert'))
    setSeenIncidentIds(platformDataService.getSeenIds('incident'))
    setSeenReportIds(platformDataService.getSeenIds('report'))
    setSeenOperationIds(platformDataService.getSeenIds('operation'))
  }, [])

  const markAlertSeen = (altId: string) => {
    platformDataService.markAsSeen('alert', altId)
    setSeenAlertIds(new Set(platformDataService.getSeenIds('alert')))
  }

  const markAllAlertsSeen = () => {
    const allIds = (alerts || []).map((a) => a.id)
    platformDataService.markAllAsSeen('alert', allIds)
    setSeenAlertIds(new Set(platformDataService.getSeenIds('alert')))
  }

  const markIncidentSeen = (incId: string) => {
    platformDataService.markAsSeen('incident', incId)
    setSeenIncidentIds(new Set(platformDataService.getSeenIds('incident')))
  }

  const markAllIncidentsSeen = () => {
    const allIds = (incidents || []).map((i) => i.id)
    platformDataService.markAllAsSeen('incident', allIds)
    setSeenIncidentIds(new Set(platformDataService.getSeenIds('incident')))
  }

  const markReportSeen = (repId: string) => {
    platformDataService.markAsSeen('report', repId)
    setSeenReportIds(new Set(platformDataService.getSeenIds('report')))
  }

  const markAllReportsSeen = () => {
    const allIds = (reports || []).map((r) => r.id)
    platformDataService.markAllAsSeen('report', allIds)
    setSeenReportIds(new Set(platformDataService.getSeenIds('report')))
  }

  const markOperationSeen = (opId: string) => {
    platformDataService.markAsSeen('operation', opId)
    setSeenOperationIds(new Set(platformDataService.getSeenIds('operation')))
  }

  const markAllOperationsSeen = () => {
    const allIds = (operations || []).map((o) => o.id)
    platformDataService.markAllAsSeen('operation', allIds)
    setSeenOperationIds(new Set(platformDataService.getSeenIds('operation')))
  }

  const unreadAlertCount = (alerts || []).filter((a) => !seenAlertIds.has(a.id)).length
  const unreadIncidentCount = (incidents || []).filter((i) => !seenIncidentIds.has(i.id)).length
  const unreadReportCount = (reports || []).filter((r) => !seenReportIds.has(r.id)).length
  const unreadOperationCount = (operations || []).filter((o) => !seenOperationIds.has(o.id)).length


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
      const validIncidentIds = new Set(inc.map(i => i.id))
      const validIncidentTitles = new Set(inc.map(i => i.title.toLowerCase()))
      
      const filteredAdv = adv.filter(a => {
        const advIncId = (a as any).incident_id || (a as any).incidentId || (a as any).targetIncidentId
        if (advIncId && validIncidentIds.has(advIncId)) return true
        if (a.targetIncident && validIncidentTitles.has(a.targetIncident.toLowerCase())) return true
        return false
      })
      setAdvisories(filteredAdv)
      setAlerts(alt)
      setOperations(ops)
      setResources(res)
      setAdvisories(adv)
      setAerialAssets(ast)
      setReports(rep)
    }
    loadData()
  }, [])


  // Global Real-Time Deletion Handlers with synchronised app state updates
  const handleDeleteIncidentGlobal = async (incId: string) => {
    const confirmed = await showConfirmDialog({
      title: `DELETE INCIDENT ${incId.toUpperCase()}`,
      message: `Are you sure you want to permanently delete Incident ${incId}? This action cannot be undone and will clean up all associated alerts, operations, and advisories across the platform.`,
      confirmLabel: 'PERMANENTLY DELETE',
      type: 'danger',
    })
    if (!confirmed) return

    // Instant optimistic UI cleanup across all entities
    const remainingIncidents = incidents.filter((i) => i.id !== incId)
    const validRemainingIds = new Set(remainingIncidents.map(i => i.id))
    const validRemainingTitles = new Set(remainingIncidents.map(i => i.title.toLowerCase()))

    setIncidents(remainingIncidents)
    setAlerts((prev) => prev.filter((a: any) => a.incident_id !== incId && a.incidentId !== incId))
    setAdvisories((prev) => prev.filter((a: any) => {
      const targetId = a.incident_id || a.incidentId || a.targetIncidentId
      if (targetId && (targetId === incId || !validRemainingIds.has(targetId))) return false
      if (a.targetIncident && !validRemainingTitles.has(a.targetIncident.toLowerCase())) return false
      return true
    }))
    if (selectedIncidentId === incId) setSelectedIncidentId(null)

    try {
      const ok = await platformDataService.deleteIncident(incId)
      if (ok) {
        showNotification(`Incident ${incId} permanently deleted.`, 'success')
      }
      // Re-fetch clean backend state
      const [updatedInc, updatedAlt, updatedOps, updatedAdv] = await Promise.all([
        platformDataService.getIncidents(),
        platformDataService.getAlerts(),
        platformDataService.getOperations(),
        platformDataService.getAdvisories(),
      ])
      setIncidents(updatedInc)
      setAlerts(updatedAlt)
      setOperations(updatedOps)
      
      const cleanIds = new Set(updatedInc.map(i => i.id))
      const cleanTitles = new Set(updatedInc.map(i => i.title.toLowerCase()))
      setAdvisories(updatedAdv.filter(a => {
        const targetId = (a as any).incident_id || (a as any).incidentId || (a as any).targetIncidentId
        if (targetId && cleanIds.has(targetId)) return true
        if (a.targetIncident && cleanTitles.has(a.targetIncident.toLowerCase())) return true
        return false
      }))
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete incident.', 'warning')
    }
  }

  const handleDeleteAlertGlobal = async (altId: string) => {
    const confirmed = await showConfirmDialog({
      title: `DELETE ALERT ${altId.toUpperCase()}`,
      message: `Permanently delete Alert ${altId}? It will be removed from the broadcast registry and dashboard ticker.`,
      confirmLabel: 'DELETE ALERT',
      type: 'danger',
    })
    if (!confirmed) return
    try {
      const ok = await platformDataService.deleteAlert(altId)
      if (ok) {
        showNotification(`Alert ${altId} permanently deleted.`, 'info')
        const updatedAlerts = await platformDataService.getAlerts()
        setAlerts(updatedAlerts)
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete alert.', 'warning')
    }
  }

  const handleDeleteReportGlobal = async (repId: string) => {
    const confirmed = await showConfirmDialog({
      title: `DELETE REPORT ${repId.toUpperCase()}`,
      message: `Permanently delete Report ${repId}? This cannot be undone.`,
      confirmLabel: 'DELETE REPORT',
      type: 'danger',
    })
    if (!confirmed) return
    try {
      const ok = await platformDataService.deleteReport(repId)
      if (ok) {
        showNotification(`Report ${repId} permanently deleted.`, 'info')
        const updatedReports = await platformDataService.getReports()
        setReports(updatedReports)
        if (selectedReportId === repId) setSelectedReportId(null)
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete report.', 'warning')
    }
  }

  // 1. Citizen Report Ingestion
  const handleCitizenReport = async (sub: CitizenReportSubmission) => {
    const result = await platformDataService.submitCitizenReport(sub)
    const [updatedIncidents, updatedAlerts, updatedAdvisories] = await Promise.all([
      platformDataService.getIncidents(),
      platformDataService.getAlerts(),
      platformDataService.getAdvisories(),
    ])
    setIncidents(updatedIncidents)
    setAlerts(updatedAlerts)
    setAdvisories(updatedAdvisories)
    return result
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
      incidentId: adv.targetIncidentId || (incidents[0]?.id || ''),
      incidentTitle: adv.targetIncident,
      resourceId: adv.resourceId || 'res-alloc',
      resourceName: adv.resourceName,
      location: incidents[0]?.location || 'Operational Area',
      state: 'DISPATCHED',
      dispatchedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedCompletion: '~20 min',
      authorizedBy: session.userName || 'Chetan Kumar',
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
      incidentId: incidents[0]?.id || '',
      incidentTitle: incidents[0]?.title || 'Active Incident',
      resourceId: asset.id,
      resourceName: asset.name,
      location: incidents[0]?.location || 'Operational Area',
      state: 'DISPATCHED',
      dispatchedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedCompletion: '~30 min',
      authorizedBy: session.userName || 'Chetan Kumar',
      missionObjective: 'Perform comprehensive multi-hazard reconnaissance and verify road accessibility.',
      fieldUpdates: [
        `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: Field assessment team dispatched. Telemetry live.`,
      ],
    }
    setOperations((prev) => [newOp, ...prev])

    showNotification(
      `Authority Action: ${asset.name} authorized & dispatched to active sector. Assessment console ready.`,
      'success'
    )
  }

  // 5. SUBMIT TO COMMAND (Field Operator Submits Structured Assessment)
  const handleAssessmentSubmit = async (submission: AssessmentSubmission) => {
    await platformDataService.submitAssessment(submission)
    const updatedIncidents = await platformDataService.getIncidents()
    setIncidents(updatedIncidents)
    setLatestAssessment(submission)

    const targetIncident = updatedIncidents.find((i) => i.id === submission.relatedIncidentId) || updatedIncidents[0]

    const newAlert: ActiveAlert = {
      id: `alt-${Date.now()}`,
      time: submission.submittedAt,
      category: 'CIVIL',
      source: `Field Assessment Mission ${submission.id}`,
      location: submission.areaSurveyed,
      message: `[FIELD REPORT] Recon confirms ${submission.roadAccessibility} in ${submission.areaSurveyed}. Assessment verified.`,
      severity: 'critical',
      relatedIncidentId: targetIncident?.id || '',
      relatedIncidentTitle: targetIncident?.title || 'Active Incident',
      isReviewedByAuthority: false,
    }
    setAlerts((prev) => [newAlert, ...prev])

    const updatedAdvisories: AllocationAdvisory[] = [
      {
        id: 'adv-new-1',
        targetIncidentId: incidents[0]?.id || '',
        resourceName: 'Air Evacuation Chopper 1',
        resourceCategory: 'aviation',
        targetIncident: incidents[0]?.title || 'Active Incident',
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
        targetIncidentId: incidents[0]?.id || '',
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
      relatedIncidentId: incidents[0]?.id || '',
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
        <ConfirmDialogProvider />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
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
            onSelectIncident={(id) => {
              setSelectedIncidentId(id)
              markIncidentSeen(id)
            }}
            onDeleteIncident={handleDeleteIncidentGlobal}
            onOpenAssessment={() => setCurrentTab('assessment')}
            onOpenReportPreview={async (incId) => {
              try {
                const targetInc = incidents.find((i) => i.id === incId)
                const newReport = await platformDataService.createReport({
                  title: `SITREP — ${targetInc?.title || 'Incident Dossier'} (${targetInc?.location || 'Operational Area'})`,
                  report_type: 'Situation Report',
                  incident_id: incId,
                  author: session.userName || 'Chetan Kumar',
                  status: 'OFFICIAL',
                  summary: `Comprehensive operational situation dossier for ${targetInc?.title || incId}. Priority: ${targetInc?.priorityLevel || targetInc?.severity || 'HIGH'}. Status: ${targetInc?.status || 'PENDING'}.`,
                })
                if (newReport) {
                  showNotification(`Official SITREP ${newReport.id} generated successfully! Opening Reports Console...`, 'success')
                  const updatedReports = await platformDataService.getReports()
                  setReports(updatedReports)
                  setSelectedReportId(newReport.id)
                  setCurrentTab('reports')
                }
              } catch (err: any) {
                console.error('Failed to generate SITREP from Incident Console:', err)
                showNotification(err.message || 'Report generation failed.', 'warning')
              }
            }}
          />
        )

      case 'operations':
        return (
          <OperationsConsole
            operations={operations}
            selectedOperationId={selectedOperationId}
            onSelectOperation={(id) => {
              setSelectedOperationId(id)
              markOperationSeen(id)
            }}
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
            onOpenOperations={() => setCurrentTab('operations')}
            onNavigateToIncident={(id) => {
              setSelectedIncidentId(id)
              setCurrentTab('incidents')
            }}
            onDispatchSuccess={async () => {
              try {
                const [updatedOps, updatedRes] = await Promise.all([
                  platformDataService.getOperations(),
                  platformDataService.getResources(),
                ])
                setOperations(updatedOps)
                setResources(updatedRes)
              } catch (e) {
                console.error(e)
              }
            }}
          />
        )

      case 'assessment':
      case 'assessments':
      case 'aerial': {
        const dispatchedAsset = aerialAssets.find((a) => a.status === 'DISPATCHED') || aerialAssets[0]
        return (
          <AssessmentForm
            incidents={incidents}
            initialIncidentId={selectedIncidentId || incidents[0]?.id}
            initialIncidentTitle={incidents.find((i) => i.id === selectedIncidentId)?.title || incidents[0]?.title || ''}
            initialAsset={dispatchedAsset}
            onSubmit={handleAssessmentSubmit}
            onBackToDashboard={() => {
              if (selectedIncidentId) {
                setCurrentTab('incidents')
              } else {
                setCurrentTab('dashboard')
              }
            }}
          />
        )
      }

      case 'alerts':
        return (
          <AlertsConsole
            alerts={alerts}
            selectedAlertId={selectedAlertId}
            onSelectAlert={(val: any) => {
              const altId = typeof val === 'string' ? val : val?.id || null
              if (altId) {
                setSelectedAlertId(altId)
                markAlertSeen(altId)
              }
            }}
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
            onSelectReport={(id) => {
              setSelectedReportId(id)
              markReportSeen(id)
            }}
            onDownloadPDF={async (reportId: string) => {
              const rep = reports.find((r) => r.id === reportId)
              const fname = rep ? `report_${rep.id}_${(rep.type || rep.reportType || 'sitrep').toLowerCase()}.pdf` : undefined
              showNotification('Generating and downloading official PDF briefing...', 'info')
              await platformDataService.downloadReportPDF(reportId, fname)
            }}
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
              incident={incidents.length > 0 ? incidents[0] : null}
              onViewIncident={() => {
                if (incidents.length > 0) {
                  setSelectedIncidentId(incidents[0].id)
                }
                setCurrentTab('incidents')
              }}
              onViewRecommendations={() => {
                setCurrentTab('resources')
              }}
            />

            {/* 2. Priority Incidents & Active Alerts Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <PriorityIncidentsList
                incidents={incidents}
                onSelectIncident={(id) => {
                  setSelectedIncidentId(id)
                  setCurrentTab('incidents')
                }}
                onDeleteIncident={handleDeleteIncidentGlobal}
              />

              <ActiveAlertsTicker
                alerts={alerts}
                onSelectAlert={(id) => {
                  setSelectedAlertId(id)
                  markAlertSeen(id)
                  setCurrentTab('alerts')
                }}
                onDeleteAlert={handleDeleteAlertGlobal}
                onNavigateToAlerts={() => setCurrentTab('alerts')}
              />
            </section>

            {/* 3. Resource Allocation Advisory Card */}
            <ResourceAllocationCard
              advisories={advisories}
              onApprove={handleApproveAdvisory}
              onReject={handleRejectAdvisory}
              onModify={handleModifyAdvisory}
            />

            {/* 4. Full-Width Expanded Tactical GIS Map */}
            <section className="w-full min-w-0">
              <ContextualMapPreview incidents={incidents} resources={resources} selectedIncidentId={selectedIncidentId} onSelectIncident={(id) => setSelectedIncidentId(id)} />
            </section>

            <div className="h-6 shrink-0" aria-hidden="true" />
          </main>
        )
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authority_session_token')
    localStorage.removeItem('authority_session_user')
    setSession({ role: 'CITIZEN' })
    setCurrentTab('dashboard')
    showNotification('Logged out successfully. Returned to Citizen Portal view.', 'info')
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
      {/* 1. Top Header with Hamburger Control & Logout */}
      <TopHeader
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onLogout={session.role === 'AUTHORITY' ? handleLogout : undefined}
        userRole={session.role}
      />

      {/* 2. Responsive Persistent Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        alertCount={unreadAlertCount}
        incidentCount={unreadIncidentCount}
        operationCount={unreadOperationCount}
        reportCount={unreadReportCount}
        onSelectTab={(tabId) => {
          setCurrentTab(tabId)
          if (tabId === 'alerts') {
            markAllAlertsSeen()
          } else if (tabId === 'incidents') {
            markAllIncidentsSeen()
          } else if (tabId === 'reports') {
            markAllReportsSeen()
          } else if (tabId === 'operations') {
            markAllOperationsSeen()
          }
        }}
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

      {/* Global Modals & Toast Container */}
      <ConfirmDialogProvider />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}