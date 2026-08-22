import {
  Incident,
  ActiveAlert,
  OperationRecord,
  ResourceUnit,
  AllocationAdvisory,
  AerialAsset,
  PlatformReport,
  CitizenReportSubmission,
  AssessmentSubmission,
  ResourceStatus,
} from '../types'
import {
  FALLBACK_INCIDENTS,
  FALLBACK_ALERTS,
  FALLBACK_OPERATIONS,
  FALLBACK_RESOURCES,
  FALLBACK_ADVISORIES,
  FALLBACK_AERIAL_ASSETS,
  FALLBACK_REPORTS,
} from './initial_data'

// API Base URL config (ready for live backend)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

class PlatformDataService {
  private inMemoryIncidents: Incident[] = [...FALLBACK_INCIDENTS]
  private inMemoryAlerts: ActiveAlert[] = [...FALLBACK_ALERTS]
  private inMemoryOperations: OperationRecord[] = [...FALLBACK_OPERATIONS]
  private inMemoryResources: ResourceUnit[] = [...FALLBACK_RESOURCES]
  private inMemoryAdvisories: AllocationAdvisory[] = [...FALLBACK_ADVISORIES]
  private inMemoryAerialAssets: AerialAsset[] = [...FALLBACK_AERIAL_ASSETS]
  private inMemoryReports: PlatformReport[] = [...FALLBACK_REPORTS]

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/incidents`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using deterministic fallback store', err)
      }
    }
    return this.inMemoryIncidents
  }

  async getIncidentById(id: string): Promise<Incident | undefined> {
    const incidents = await this.getIncidents()
    return incidents.find((inc) => inc.id === id)
  }

  // Alerts
  async getAlerts(): Promise<ActiveAlert[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using fallback', err)
      }
    }
    return this.inMemoryAlerts
  }

  // Operations
  async getOperations(): Promise<OperationRecord[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/operations`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using fallback', err)
      }
    }
    return this.inMemoryOperations
  }

  // Resources
  async getResources(): Promise<ResourceUnit[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/resources`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using fallback', err)
      }
    }
    return this.inMemoryResources
  }

  // Advisories
  async getAdvisories(): Promise<AllocationAdvisory[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/advisories`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using fallback', err)
      }
    }
    return this.inMemoryAdvisories
  }

  // Assets
  async getAerialAssets(): Promise<AerialAsset[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/assets`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using fallback', err)
      }
    }
    return this.inMemoryAerialAssets
  }

  // Reports
  async getReports(): Promise<PlatformReport[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports`)
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, using fallback', err)
      }
    }
    return this.inMemoryReports
  }

  // Citizen Report Submission -> Ingestion & Correlation
  async submitCitizenReport(sub: CitizenReportSubmission): Promise<{ incidentId: string; reportId: string }> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/citizen-reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('API unavailable, updating local store', err)
      }
    }

    // In-memory fallback ingestion
    const newReport = {
      id: `rep-${sub.id}`,
      sourceType: 'CITIZEN' as const,
      sourceLabel: `Public Citizen Report (${sub.id})`,
      timestamp: sub.submittedAt,
      channelBadge: 'CITIZEN_WEB',
      confidence: 92,
      summary: `${sub.whatHappened} at ${sub.location}. ${sub.isPeopleTrapped ? 'PEOPLE TRAPPED.' : ''} ${sub.isImmediateDanger ? 'IMMEDIATE DANGER.' : ''} ${sub.description}`,
      rawContent: `AFFECTED: ${sub.affectedPeople || 'Unknown'} | CONTACT: ${sub.citizenContact || 'None'}`,
      citizenContact: sub.citizenContact,
    }

    const newTimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: sub.submittedAt,
      title: `Citizen Report Ingested: ${sub.id}`,
      description: `Public report received for ${sub.location}: "${sub.whatHappened}". Corroborated into active incident registry.`,
      type: 'INGESTION' as const,
    }

    this.inMemoryIncidents = this.inMemoryIncidents.map((inc) =>
      inc.id === 'inc-a'
        ? {
            ...inc,
            sourceCounts: {
              ...inc.sourceCounts,
              citizenReports: inc.sourceCounts.citizenReports + 1,
            },
            reports: [newReport, ...inc.reports],
            timeline: [newTimelineEvent, ...inc.timeline],
          }
        : inc
    )

    const newAlert: ActiveAlert = {
      id: `alt-${Date.now()}`,
      time: sub.submittedAt,
      category: 'CIVIL',
      source: 'Public Emergency Intake',
      location: sub.location,
      message: `[CITIZEN REPORT ${sub.id}] ${sub.whatHappened} — ${sub.description}`,
      severity: sub.isImmediateDanger ? 'critical' : 'warning',
      relatedIncidentId: 'inc-a',
      relatedIncidentTitle: 'Cyclone Alpha 4 (Sector 7G)',
      isReviewedByAuthority: false,
    }
    this.inMemoryAlerts = [newAlert, ...this.inMemoryAlerts]

    return { incidentId: 'inc-a', reportId: sub.id }
  }

  // Field Assessment Submission -> Closed-Loop Update
  async submitAssessment(sub: AssessmentSubmission): Promise<void> {
    if (API_BASE_URL) {
      try {
        await fetch(`${API_BASE_URL}/api/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        return
      } catch (err) {
        console.warn('API unavailable, updating local store', err)
      }
    }

    const assessmentReport = {
      id: `rep-field-${Date.now()}`,
      sourceType: 'FIELD_ASSESSMENT' as const,
      sourceLabel: `Assessment Mission ${sub.id} (${sub.assetName})`,
      timestamp: sub.submittedAt,
      channelBadge: 'FIELD_RECON',
      confidence: sub.confidenceScore,
      summary: `Field Recon Verified: ${sub.structuresAffected} structures damaged, ${sub.peopleObserved}, Road status: ${sub.roadAccessibility}. Mode: ${sub.assessmentMode}. Mission: ${sub.missionType}.`,
      rawContent: `MISSION_ID: ${sub.id} | HAZARDS: ${sub.hazardsDetected.join(', ')} | EVAC_ROUTE: ${sub.evacuationStatus}`,
    }

    const assessmentTimelineEvent = {
      id: `tl-recon-${Date.now()}`,
      timestamp: sub.submittedAt,
      title: `Field Assessment Ingested: Mission ${sub.id}`,
      description: `Recon verified impassable roads in ${sub.areaSurveyed}. Triggered AI advisory recalculation for specialized air extraction hoist.`,
      type: 'AERIAL_ASSESSMENT' as const,
    }

    this.inMemoryIncidents = this.inMemoryIncidents.map((inc) =>
      inc.id === 'inc-a'
        ? {
            ...inc,
            title: 'Cyclone Alpha 4 — Sector 7G Coastal Basin (Field Verified)',
            impact: `Verified: ${sub.structuresAffected} structures damaged • ${sub.peopleObserved} • ${sub.roadAccessibility}`,
            isFieldVerified: true,
            lastUpdated: 'Just now',
            resourceCoverage: '92%',
            sourceCounts: {
              ...inc.sourceCounts,
              fieldAssessments: (inc.sourceCounts?.fieldAssessments || 0) + 1,
            },
            reports: [assessmentReport, ...(inc.reports || [])],
            timeline: [assessmentTimelineEvent, ...(inc.timeline || [])],
          }
        : inc
    )
  }
}

export const platformDataService = new PlatformDataService()
