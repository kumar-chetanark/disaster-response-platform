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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class PlatformDataService {
  private inMemoryIncidents: Incident[] = [...FALLBACK_INCIDENTS]
  private inMemoryAlerts: ActiveAlert[] = [...FALLBACK_ALERTS]
  private inMemoryOperations: OperationRecord[] = [...FALLBACK_OPERATIONS]
  private inMemoryResources: ResourceUnit[] = [...FALLBACK_RESOURCES]
  private inMemoryAdvisories: AllocationAdvisory[] = [...FALLBACK_ADVISORIES]
  private inMemoryAerialAssets: AerialAsset[] = [...FALLBACK_AERIAL_ASSETS]
  private inMemoryReports: PlatformReport[] = [...FALLBACK_REPORTS]

  // Incidents — Live REST API with deterministic fallback
  async getIncidents(search?: string, severity?: string, status?: string): Promise<Incident[]> {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (severity && severity !== 'ALL') params.append('severity', severity)
      if (status && status !== 'ALL') params.append('status', status)

      const url = `${API_BASE_URL}/api/incidents${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          return data.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            type: item.type,
            location: item.location,
            sector: item.sector,
            impact: item.impact,
            severity: item.severity,
            status: item.status,
            timeReported: item.time_reported,
            lastUpdated: item.last_updated,
            affectedPopulationEst: item.affected_population_est,
            affectedAreaSqKm: item.affected_area_sq_km,
            priorityLevel: item.priority_level,
            resourceCoverage: item.resource_coverage,
            isFieldVerified: item.is_field_verified,
            sourceCounts: item.source_counts || {
              citizenReports: 1,
              newsReports: 0,
              governmentReports: 0,
              weatherReports: 0,
              fieldAssessments: 0,
            },
            associatedOperations: [],
            reports: [],
            timeline: [],
          }))
        }
      }
    } catch (err) {
      console.warn('Live API unreachable for /api/incidents, using synchronized local store.')
    }
    return this.inMemoryIncidents
  }

  // Incident Detail — Live REST API with fallback
  async getIncidentById(id: string): Promise<Incident | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents/${id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        return {
          id: data.id,
          title: data.title,
          category: data.category,
          type: data.type,
          location: data.location,
          sector: data.sector,
          impact: data.impact,
          severity: data.severity,
          status: data.status,
          timeReported: data.time_reported,
          lastUpdated: data.last_updated,
          affectedPopulationEst: data.affected_population_est,
          affectedAreaSqKm: data.affected_area_sq_km,
          priorityLevel: data.priority_level,
          resourceCoverage: data.resource_coverage,
          isFieldVerified: data.is_field_verified,
          sourceCounts: data.source_counts,
          associatedOperations: data.associated_operations || [],
          reports: (data.sources || []).map((s: any) => ({
            id: s.id,
            sourceType: s.source_type,
            sourceLabel: s.source_label,
            timestamp: s.created_at,
            channelBadge: s.channel_badge,
            confidence: s.confidence_score,
            summary: s.summary,
            rawContent: s.raw_content,
          })),
          timeline: (data.timeline || []).map((t: any) => ({
            id: t.id,
            timestamp: t.timestamp,
            title: t.title,
            description: t.description,
            type: t.event_type,
          })),
        }
      }
    } catch (err) {
      console.warn(`Live API unreachable for /api/incidents/${id}, using local fallback.`)
    }
    return this.inMemoryIncidents.find((inc) => inc.id === id)
  }

  // Resources — Live Location-First Discovery with fallback
  async getResources(category?: string, location?: string): Promise<ResourceUnit[]> {
    try {
      let url = `${API_BASE_URL}/api/resources`
      if (location && location.trim()) {
        url = `${API_BASE_URL}/api/resources/nearby?location=${encodeURIComponent(location)}`
      } else if (category && category !== 'ALL') {
        url = `${API_BASE_URL}/api/resources?category=${category.toLowerCase()}`
      }

      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : data.items
        if (items && items.length > 0) {
          return items.map((r: any) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            status: r.status,
            location: r.base_location,
            personnelCount: r.personnel_count,
            equipmentDetails: r.equipment_details || 'Response ready equipment',
            distanceKm: r.distance_km,
            shelterCapacity: r.shelter_capacity,
            shelterOccupied: r.shelter_occupied,
            suppliesFoodDays: r.supplies_food_days,
            suppliesFoodPeople: r.supplies_food_people,
            suppliesMedicineCount: r.supplies_medicine_count,
            suppliesClothingCount: r.supplies_clothing_count,
          }))
        }
      }
    } catch (err) {
      console.warn('Live API unreachable for /api/resources, using synchronized local store.')
    }
    return this.inMemoryResources
  }

  // Alerts — Live REST API with clean empty array fallback
  async getAlerts(severity?: string, category?: string, incidentId?: string, isReviewed?: boolean): Promise<ActiveAlert[]> {
    try {
      const params = new URLSearchParams()
      if (severity && severity !== 'ALL') params.append('severity', severity)
      if (category && category !== 'ALL') params.append('category', category)
      if (incidentId) params.append('incident_id', incidentId)
      if (isReviewed !== undefined) params.append('is_reviewed', String(isReviewed))

      const url = `${API_BASE_URL}/api/alerts${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.items)) {
          return data.items.map((a: any) => ({
            id: a.id,
            category: a.category,
            source: a.source,
            location: a.location,
            message: a.message,
            severity: a.severity.toLowerCase(),
            alertTime: a.alert_time,
            timestamp: a.alert_time,
            isReviewed: a.is_reviewed,
            incidentId: a.incident_id,
            incidentTitle: a.incident_title,
          }))
        }
      }
    } catch (err) {
      console.warn('Live API unreachable for /api/alerts, providing synchronized fallback.')
    }
    return this.inMemoryAlerts
  }

  async reviewAlert(alertId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/alerts/${alertId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_reviewed: true }),
      })
    } catch (err) {
      console.warn(`Live API unreachable for /api/alerts/${alertId}/review.`)
    }
    this.inMemoryAlerts = this.inMemoryAlerts.map((a) =>
      a.id === alertId ? { ...a, isReviewed: true } : a
    )
  }

  // Operations — Live REST API
  async getOperations(incidentId?: string, status?: string): Promise<OperationRecord[]> {
    try {
      const params = new URLSearchParams()
      if (incidentId) params.append('incident_id', incidentId)
      if (status && status !== 'ALL') params.append('status', status)

      const url = `${API_BASE_URL}/api/operations${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          return data.items.map((op: any) => ({
            id: op.id,
            incidentId: op.incident_id,
            incidentTitle: op.incident_title || 'Incident #1',
            resourceId: op.resource_id,
            resourceName: op.resource_name,
            resourceCategory: op.resource_category,
            operationType: op.operation_type as any,
            location: op.destination_location,
            state: op.status as any,
            destinationLocation: op.destination_location,
            authorizedBy: op.authorized_by,
            missionObjective: op.mission_objective,
            dispatchedTime: op.dispatched_time,
            estimatedCompletion: op.estimated_completion || '45 min',
            fieldUpdates: op.field_updates_log ? [op.field_updates_log] : [],
          }))
        }
      }
    } catch (err) {
      console.warn('Live API unreachable for /api/operations, using local store.')
    }
    return this.inMemoryOperations
  }

  // Dispatch Operation
  async dispatchOperation(payload: {
    incidentId: string
    resourceId: string
    operationType: string
    destinationLocation: string
    missionObjective: string
    authorizedBy?: string
    notes?: string
  }): Promise<OperationRecord> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: payload.incidentId,
          resource_id: payload.resourceId,
          operation_type: payload.operationType,
          destination_location: payload.destinationLocation,
          mission_objective: payload.missionObjective,
          authorized_by: payload.authorizedBy || 'Authority Command (Level 5)',
          notes: payload.notes,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const newOp: OperationRecord = {
          id: data.id,
          incidentId: data.incident_id,
          incidentTitle: data.incident_title,
          resourceId: data.resource_id,
          resourceName: data.resource_name,
          resourceCategory: data.resource_category,
          operationType: data.operation_type as any,
          location: data.destination_location,
          state: data.status as any,
          destinationLocation: data.destination_location,
          authorizedBy: data.authorized_by,
          missionObjective: data.mission_objective,
          dispatchedTime: data.dispatched_time,
          estimatedCompletion: data.estimated_completion || '45 min',
          fieldUpdates: data.field_updates_log ? [data.field_updates_log] : [],
        }
        this.inMemoryOperations = [newOp, ...this.inMemoryOperations]
        return newOp
      }
    } catch (err) {
      console.warn('Live API unreachable for POST /api/operations, saving locally.')
    }

    const fallbackOp: OperationRecord = {
      id: `op-${Date.now().toString().slice(-4)}`,
      incidentId: payload.incidentId,
      incidentTitle: 'Incident #1',
      resourceId: payload.resourceId,
      resourceName: 'Dispatched Response Squad',
      resourceCategory: 'rescue',
      operationType: payload.operationType as any,
      location: payload.destinationLocation,
      state: 'DISPATCHED',
      destinationLocation: payload.destinationLocation,
      authorizedBy: payload.authorizedBy || 'Authority Command',
      missionObjective: payload.missionObjective,
      dispatchedTime: 'Just now',
      estimatedCompletion: '45 min',
      fieldUpdates: [],
    }
    this.inMemoryOperations = [fallbackOp, ...this.inMemoryOperations]
    return fallbackOp
  }

  // Update Operation Status
  async updateOperationStatus(operationId: string, status: string, notes?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/operations/${operationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, field_updates_log: notes }),
      })
    } catch (err) {
      console.warn(`Live API unreachable for PATCH /api/operations/${operationId}.`)
    }
    this.inMemoryOperations = this.inMemoryOperations.map((op) =>
      op.id === operationId ? { ...op, state: status as any } : op
    )
  }

  // Resource Create
  async createResource(resData: ResourceUnit): Promise<ResourceUnit> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resData.name,
          category: resData.category,
          status: resData.status,
          base_location: resData.location,
          personnel_count: resData.personnelCount,
          equipment_details: resData.equipmentDetails,
          shelter_capacity: resData.shelterCapacity,
          shelter_occupied: resData.shelterOccupied,
          supplies_food_days: resData.suppliesFoodDays,
          supplies_food_people: resData.suppliesFoodPeople,
          supplies_medicine_count: resData.suppliesMedicineCount,
          supplies_clothing_count: resData.suppliesClothingCount,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          status: data.status,
          location: data.base_location,
          personnelCount: data.personnel_count,
          equipmentDetails: data.equipment_details,
        }
      }
    } catch (err) {
      console.warn('Live API unreachable for POST /api/resources, saving locally.')
    }
    this.inMemoryResources = [resData, ...this.inMemoryResources]
    return resData
  }

  // Resource Update
  async updateResourceStatus(resourceId: string, status: ResourceStatus): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch (err) {
      console.warn(`Live API unreachable for PATCH /api/resources/${resourceId}.`)
    }
    this.inMemoryResources = this.inMemoryResources.map((r) =>
      r.id === resourceId ? { ...r, status } : r
    )
  }

  // Advisories
  async getAdvisories(incidentId?: string): Promise<AllocationAdvisory[]> {
    try {
      const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : ''
      const res = await fetch(`${API_BASE_URL}/api/allocations/recommendations${q}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => {
            const cat = d.resource_category === 'rescue' ? 'rescue' : d.resource_category === 'medical' ? 'medical' : d.resource_category === 'aerial' ? 'aviation' : d.resource_category === 'water' ? 'boat' : 'engineering'
            return {
              id: d.id,
              resourceId: d.resource_id || undefined,
              resourceName: d.resource_name,
              resourceCategory: cat as any,
              targetIncidentId: d.incident_id,
              targetIncident: d.incident_title,
              details: `${d.personnel_count || 0} active personnel · ${d.travel_time_est} travel`,
              reason: d.reason,
              status: d.unmet_demand ? 'REJECTED' : 'RECOMMENDED',
              metrics: {
                capabilityMatch: d.match_score || 90,
                proximity: 92,
                travelTime: d.travel_time_est || '10 mins',
                scarcity: d.scarcity_warning ? 'HIGH' : 'LOW',
                competingIncidents: d.scarcity_warning ? 2 : 1,
              },
            }
          })
        }
      }
    } catch (err) {
      console.warn('[DataService] /api/allocations/recommendations offline, falling back:', err)
    }
    return this.inMemoryAdvisories
  }

  async getShelters(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shelters`, { cache: 'no-store' })
      if (res.ok) {
        return await res.json()
      }
    } catch (err) {
      console.warn('[DataService] /api/shelters offline:', err)
    }
    return [
      {
        id: 'shl-101',
        name: 'Sector 7 Community Center & Relief Camp',
        location: 'Sector 7G Basin North',
        total_capacity: 850,
        current_occupancy: 320,
        available_capacity: 530,
        occupancy_pct: 37.6,
        status: 'AVAILABLE',
      },
      {
        id: 'shl-102',
        name: 'State Model High School Disaster Shelter',
        location: 'Coastal Causeway Km 14',
        total_capacity: 600,
        current_occupancy: 540,
        available_capacity: 60,
        occupancy_pct: 90.0,
        status: 'NEAR_CAPACITY',
      }
    ]
  }

  async sendDegradedSMS(senderPhone: string, messageText: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sms/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_phone: senderPhone, message_text: messageText }),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch (err) {
      console.error('[DataService] /api/sms/inbound error:', err)
    }
    return null
  }

  // Assets
  async getAerialAssets(): Promise<AerialAsset[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/resources?category=aerial`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        if (items.length > 0) {
          return items.map((r: any) => ({
            id: r.id,
            name: r.name,
            type: 'VTOL_DRONE',
            status: r.status === 'AVAILABLE' ? 'STANDBY' : 'AIRBORNE',
            batteryPct: 85,
            currentLocation: r.base_location || 'Regional Airfield',
            coverageRadiusKm: 25,
            sensorSuite: ['4K Optical', 'Thermal Infrared', 'LiDAR Terrain'],
            payloadCapacityKg: 5.0,
            streamingUrl: 'rtsp://uav.local/stream',
          }))
        }
      }
    } catch (err) {
      console.warn('[DataService] /api/resources?category=aerial offline, falling back:', err)
    }
    return this.inMemoryAerialAssets
  }

  // Reports -> GET /api/reports, POST /api/reports, GET /api/reports/{id}/pdf
  async getReports(incidentId?: string, reportType?: string): Promise<PlatformReport[]> {
    const params = new URLSearchParams()
    if (incidentId && incidentId.trim() !== '') params.append('incident_id', incidentId.trim())
    if (reportType && reportType !== 'ALL' && reportType.trim() !== '') {
      params.append('report_type', reportType.trim())
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const url = `${API_BASE_URL}/api/reports${query}`

    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        console.error(`[DataService] HTTP error fetching /api/reports: status ${res.status} ${res.statusText}`)
        return []
      }

      const data = await res.json()
      if (!data || !Array.isArray(data.items)) {
        console.error('[DataService] Malformed JSON response from /api/reports. Expected data.items array:', data)
        return []
      }

      return data.items.map((r: any) => {
        let parsedTags: string[] = []
        if (Array.isArray(r.tags)) {
          parsedTags = r.tags.map(String)
        } else if (typeof r.tags === 'string' && r.tags.trim() !== '') {
          parsedTags = r.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        }

        return {
          id: String(r.id || ''),
          title: String(r.title || 'Untitled Report'),
          reportType: r.report_type || 'SITREP',
          type: r.report_type || 'SITREP',
          date: r.created_at || 'Just now',
          timestamp: r.created_at || 'Just now',
          author: String(r.author || 'Command Desk'),
          incidentId: r.incident_id || undefined,
          incidentTitle: r.incident_title || (r.incident_id ? `Incident #${r.incident_id}` : 'Central Command Network'),
          summary: String(r.summary || ''),
          metricsSummary: r.metrics_summary || '',
          tags: parsedTags,
          format: 'PDF',
          downloadUrl: `${API_BASE_URL}/api/reports/${r.id}/pdf`,
        }
      })
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        console.error(`[DataService] Network connection failure to backend at ${url}. Verify backend server is running on ${API_BASE_URL}.`, err)
      } else {
        console.error(`[DataService] Unexpected error processing /api/reports:`, err)
      }
      return []
    }
  }

  async createReport(report: {
    incident_id?: string
    report_type: string
    title: string
    author: string
    summary: string
    metrics_summary?: string
    tags?: string
  }): Promise<PlatformReport | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })
      if (res.ok) {
        const r = await res.json()
        return {
          id: r.id,
          title: r.title,
          type: r.report_type,
          date: r.created_at,
          author: r.author,
          incidentId: r.incident_id,
          incidentTitle: r.incident_title,
          summary: r.summary,
          tags: r.tags ? r.tags.split(',') : [],
          format: 'PDF',
          downloadUrl: `${API_BASE_URL}/api/reports/${r.id}/pdf`,
        }
      }
    } catch (err) {
      console.error('Failed to create report on backend:', err)
    }
    return null
  }

  // Citizen Report Submission -> POST /api/citizen-reports
  async submitCitizenReport(sub: CitizenReportSubmission): Promise<{ incidentId: string; reportId: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/citizen-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disaster_type: sub.whatHappened || sub.category,
          location: sub.location,
          description: sub.description,
          reported_time: sub.submittedAt,
          is_people_trapped: sub.isPeopleTrapped,
          is_immediate_danger: sub.isImmediateDanger,
          affected_people_estimate: sub.affectedPeople,
          contact_info: sub.citizenContact,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return { incidentId: data.incident_id, reportId: data.report_id }
      }
    } catch (err) {
      console.warn('Live API unreachable for POST /api/citizen-reports.')
    }
    return { incidentId: 'inc-a', reportId: sub.id }
  }

  // Field Assessment Submission
  async submitAssessment(sub: AssessmentSubmission): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: 'inc-a',
          assessment_mode: sub.assessmentMode,
          mission_type: sub.missionType,
          asset_id: sub.id,
          asset_name: sub.assetName,
          assessment_time: sub.submittedAt,
          weather_conditions: sub.weatherCondition || 'Clear',
          area_surveyed: sub.areaSurveyed,
          hazards_detected: sub.hazardsDetected.join(', '),
          structures_damaged_count: sub.structuresAffected,
          road_accessibility_status: sub.roadAccessibility,
          people_observed: sub.peopleObserved,
          recommended_resources: Array.isArray(sub.recommendedResources) ? sub.recommendedResources.join(', ') : String(sub.recommendedResources),
          evacuation_route_status: sub.evacuationStatus,
          operator_observations: sub.hazardsDetected ? sub.hazardsDetected.join(', ') : 'Field observations recorded.',
          confidence_score: sub.confidenceScore,
        }),
      })

      if (res.ok) {
        const created = await res.json()
        await fetch(`${API_BASE_URL}/api/assessments/${created.id}/submit`, {
          method: 'POST',
        })
      }
    } catch (err) {
      console.warn('Live API unreachable for POST /api/assessments.')
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

    this.inMemoryIncidents = this.inMemoryIncidents.map((inc) =>
      inc.id === 'inc-a'
        ? {
            ...inc,
            title: 'Incident #1 — Sector 7G Coastal Basin (Field Verified)',
            impact: `Verified: ${sub.structuresAffected} structures damaged • ${sub.peopleObserved} • ${sub.roadAccessibility}`,
            isFieldVerified: true,
            lastUpdated: 'Just now',
            resourceCoverage: '92%',
            sourceCounts: {
              ...inc.sourceCounts,
              fieldAssessments: (inc.sourceCounts?.fieldAssessments || 0) + 1,
            },
            reports: [assessmentReport, ...(inc.reports || [])],
          }
        : inc
    )
  }
}

export const platformDataService = new PlatformDataService()
