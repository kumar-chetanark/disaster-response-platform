// ==========================================
// UNIFIED DOMAIN TYPES (Shared Application State)
// ==========================================

export type UserRole = 'CITIZEN' | 'AUTHORITY'

export interface UserSession {
  role: UserRole
  userName?: string
  badgeId?: string
  authorityLevel?: number
}

// 1. INCIDENTS & CORRELATION
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type IncidentStatus = 'PENDING' | 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'UNRESOLVED'
export type IncidentCategory =
  | 'Flood'
  | 'Cyclone'
  | 'Fire'
  | 'Landslide'
  | 'Building damage'
  | 'Road blockage'
  | 'Medical emergency'
  | 'Other'

export type ReportSourceType = 'CITIZEN' | 'NEWS' | 'GOVERNMENT' | 'WEATHER' | 'FIELD_ASSESSMENT' | 'SMS' | 'IVR'

export interface CorroboratingReport {
  id: string
  sourceType: ReportSourceType
  sourceLabel: string
  timestamp: string
  summary: string
  rawContent?: string
  confidence?: number
  channelBadge?: string
  citizenContact?: string
}

export interface IncidentTimelineEvent {
  id: string
  timestamp: string
  title: string
  description: string
  type: 'INGESTION' | 'SEVERITY_UPDATE' | 'AERIAL_ASSESSMENT' | 'RESOURCE_ALLOCATION' | 'AUTHORITY_ACTION' | 'OPERATION_DISPATCH'
  badgeColor?: 'error' | 'primary' | 'tertiary' | 'emerald'
}

export interface Incident {
  id: string
  title: string
  category: IncidentCategory
  type: 'flood' | 'cyclone' | 'earthquake' | 'wildfire' | 'infrastructure'
  location: string
  latitude?: number
  longitude?: number
  disasterType?: string
  sector: string
  impact: string
  severity: IncidentSeverity
  status: IncidentStatus
  timeReported: string
  lastUpdated: string
  affectedPopulationEst: string
  affectedPopulation?: string
  affectedAreaSqKm: number
  resourceCoverage: string
  resourceCoveragePct?: number
  priorityLevel: string
  isFieldVerified?: boolean
  structuresAffectedCount?: number
  peopleTrappedCount?: number
  roadsAccessibility?: string
  sourceCounts: {
    citizenReports: number
    newsReports: number
    governmentReports: number
    weatherReports: number
    fieldAssessments: number
  }
  reports: CorroboratingReport[]
  timeline: IncidentTimelineEvent[]
  associatedOperations: string[]
  recommendedResourceIds?: string[]
  allocatedResourceIds?: string[]
}

export type PriorityIncident = Incident

// 2. CITIZEN SUBMISSION
export interface CitizenReportSubmission {
  citizenName?: string
  id: string
  whatHappened: string
  category: IncidentCategory
  location: string
  affectedPeople?: string
  isImmediateDanger: boolean
  isPeopleTrapped: boolean
  description: string
  citizenContact?: string
  submittedAt: string
}

// 3. ALERTS
export type AlertCategory = 'METEO' | 'CIVIL' | 'INFRASTRUCTURE' | 'MEDICAL' | 'GOVERNMENT' | 'SATELLITE'
export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface ActiveAlert {
  timestamp?: string
  alertTime?: string
  incidentId?: string
  isReviewed?: boolean
  incidentTitle?: string
  id: string
  time: string
  category: AlertCategory
  source: string
  location: string
  message: string
  severity: AlertSeverity
  relatedIncidentId?: string
  relatedIncidentTitle?: string
  isReviewedByAuthority: boolean
}

// 4. OPERATIONS
export type OperationType =
  | 'Rescue Team Mission'
  | 'Medical Emergency Response'
  | 'Police / Security Perimeter'
  | 'Drone Reconnaissance'
  | 'Helicopter Air Evacuation'
  | 'Boat Swift-Water Rescue'
  | 'Heavy Route Clearance'
  | 'Supply Logistics Drop'

export type OperationState =
  | 'PLANNED'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'IN TRANSIT'
  | 'EN_ROUTE'
  | 'IN OPERATION'
  | 'ON_SCENE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RECALLED'

export interface OperationRecord {
  destinationLocation?: string
  resourceCategory?: string
  id: string
  operationType: OperationType
  incidentId: string
  incidentTitle: string
  resourceId: string
  resourceName: string
  location: string
  state: OperationState
  dispatchedTime: string
  estimatedCompletion: string
  authorizedBy: string
  missionObjective: string
  fieldUpdates: string[]
}

// 5. RESOURCES & INVENTORY
export type ResourceCategory =
  | 'medical'
  | 'police_army'
  | 'police'
  | 'army'
  | 'rescue'
  | 'aerial'
  | 'helicopter'
  | 'drone'
  | 'water'
  | 'boat'
  | 'land'
  | 'shelter'
  | 'supplies'

export type ResourceStatus =
  | 'AVAILABLE'
  | 'RECOMMENDED'
  | 'AUTHORITY APPROVED'
  | 'ALLOCATED'
  | 'IN OPERATION'
  | 'IN USE'
  | 'COMPLETED'
  | 'MAINTENANCE'
  | 'STANDBY'
  | 'DEPLOYED'

export interface ResourceUnit {
  distanceKm?: number
  shelterCapacity?: number
  shelterOccupied?: number
  suppliesFoodDays?: number
  suppliesFoodPeople?: number
  suppliesMedicineCount?: number
  suppliesClothingCount?: number
  id: string
  name: string
  category: ResourceCategory
  status: ResourceStatus
  location: string
  personnelCount: number
  equipmentDetails: string
  assignedIncidentId?: string
  assignedOperationId?: string
  etaMinutes?: number
  // For Shelters
  // For Supplies
}

// 6. ADVISORY ALLOCATION (9-Step Process)
export interface AllocationAdvisory {
  id: string
  resourceId?: string
  resourceName: string
  resourceCategory: 'medical' | 'boat' | 'aviation' | 'engineering' | 'rescue'
  targetIncidentId?: string
  targetIncident: string
  details: string
  reason: string
  status: 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'MODIFIED'
  metrics: {
    capabilityMatch: number
    proximity: number
    travelTime: string
    scarcity: 'HIGH' | 'MEDIUM' | 'LOW'
    competingIncidents: number
  }
}

// 7. ASSESSMENTS (Generalized Mode: Drone, Helicopter, Land, Water)
export type AssessmentMode =
  | 'Aerial — Drone'
  | 'Aerial — Helicopter'
  | 'Land Team / Vehicle'
  | 'Water / Boat Team'

export type MissionType =
  | 'Area Scan / Survey'
  | 'Damage Assessment'
  | 'Search & Rescue Support'
  | 'Resource Delivery'
  | 'Evacuation / Route Assessment'
  | 'Communication / Observation'

export interface AerialAsset {
  id: string
  name: string
  type: 'drone' | 'helicopter' | 'land_unit' | 'boat'
  status: 'AVAILABLE' | 'IN USE' | 'DISPATCHED'
  batteryOrFuel?: string
  operatorTeam?: string
}

export interface AssessmentSubmission {
  id: string
  relatedIncidentId: string
  relatedIncidentTitle: string
  assessmentMode: AssessmentMode
  assetId: string
  assetName: string
  missionType: MissionType
  assessmentTime: string
  weatherCondition: string
  areaSurveyed: string
  hazardsDetected: string[]
  structuresAffected: number
  roadAccessibility: string
  peopleObserved: string
  recommendedResources: string
  evacuationStatus: 'Routes Clear' | 'Compromised'
  mediaFiles: string[]
  operatorObservations: string
  confidenceScore: number
  submittedAt: string
}

export type AerialAssessmentSubmission = AssessmentSubmission

// 8. REPORTS (Historical records absorbing audit functionality)
export type ReportType =
  | 'Incident Debrief'
  | 'Assessment Mission Report'
  | 'Operation After-Action'
  | 'Resource Utilization'
  | 'Authority Decision Log'

export interface PlatformReport {
  id: string
  title: string
  reportType?: ReportType | string
  type?: string
  timestamp?: string
  date?: string
  generatedAt?: string
  incidentId?: string
  incidentTitle?: string
  relatedIncidentId?: string
  author: string
  summary: string
  metricsSummary?: string
  metrics?: Record<string, any>
  tags?: string[]
  format?: string
  downloadUrl?: string
}


export interface EmergencyShelter {
  id: string
  name: string
  location: string
  total_capacity: number
  current_occupancy: number
  available_capacity: number
  occupancy_pct: number
  status: 'AVAILABLE' | 'NEAR_CAPACITY' | 'FULL'
  contact_phone?: string
  created_at?: string
}

export interface BackendAllocationAdvisory {
  id: string
  incident_id: string
  incident_title: string
  incident_priority: number
  required_capability: string
  resource_id?: string | null
  resource_name: string
  resource_category: string
  personnel_count: number
  match_score: number
  travel_time_est: string
  reason: string
  explanation_breakdown: Record<string, number>
  alternatives: string[]
  scarcity_warning: boolean
  unmet_demand: boolean
}

export interface EvidenceBreakdownItem {
  source_type: string
  count: number
  contribution: number
  reason: string
}

export interface ContradictionItem {
  id: string
  source_label: string
  reason: string
  timestamp: string
  penalty: number
}

export interface IncidentConfidenceTelemetry {
  incident_id: string
  incident_title: string
  status: string
  confidence_score: number
  confidence_level: 'HIGH' | 'MODERATE' | 'LOW'
  evidence_count: number
  independent_source_count: number
  duplicate_submissions_filtered: number
  breakdown: EvidenceBreakdownItem[]
  contradictions: ContradictionItem[]
  recommendation: string
  last_evidence_time: string
}

export interface IncidentCapabilityRequirement {
  capability: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
  minimum_units: number
}

export interface IncidentRequirementsResponse {
  incident_id: string
  incident_title: string
  severity: string
  status: string
  requirements: IncidentCapabilityRequirement[]
}
