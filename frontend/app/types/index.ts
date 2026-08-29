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
  latitude?: number
  longitude?: number
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
  resourceCenterId?: string
  distanceKm?: number
  shelterCapacity?: number
  shelterOccupied?: number
  suppliesFoodDays?: number
  suppliesFoodPeople?: number
  suppliesMedicineCount?: number
  suppliesClothingCount?: number
  id: string
  name: string
  type?: string
  category: ResourceCategory
  status: ResourceStatus
  location: string
  latitude?: number | null
  longitude?: number | null
  capabilities?: string
  capacity?: number
  operatingRange?: string
  vehicleRegistration?: string
  personnelCount: number
  equipmentDetails: string
  assignedIncidentId?: string
  assignedOperationId?: string
  etaMinutes?: number
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

export interface ResourceTelemetryState {
  resource_id: string
  name: string
  category: string
  status: string
  latitude?: number | null
  longitude?: number | null
  current_operation_id?: string | null
  last_updated: string
}

export interface OperationTelemetryItem {
  operation_id: string
  resource_id: string
  resource_name: string
  resource_category: string
  status: string
  destination_location: string
  authorized_by: string
  mission_objective: string
  dispatched_time: string
  estimated_completion?: string | null
  field_updates: string[]
  created_at?: string | null
  updated_at?: string | null
}

export interface LiveOperationalTelemetry {
  incident_id: string
  incident_title: string
  incident_status: string
  generated_at: string
  active_operation_count: number
  completed_operation_count: number
  resource_count: number
  resources_available: number
  resources_assigned: number
  resources_en_route: number
  resources_on_scene: number
  operation_state_breakdown: Record<string, number>
  latest_operations: OperationTelemetryItem[]
  latest_resource_states: ResourceTelemetryState[]
}

export interface DecisionActionItem {
  action: string
  priority: string
  reason: string
  capability?: string | null
  resource_id?: string | null
  resource_name?: string | null
}

export interface DecisionSupportSummary {
  recommended_actions: DecisionActionItem[]
  blocking_factors: string[]
  warnings: string[]
}

export interface IncidentIntelligenceConfidence {
  score: number
  level: string
  independent_sources: number
}

export interface IncidentIntelligencePriority {
  score: number
  level: string
  reasons: string[]
}

export interface OperationalStateMetrics {
  active_missions: number
  assigned: number
  en_route: number
  on_scene: number
  completed: number
  available_resources: number
}

export interface IncidentIntelligenceTelemetry {
  incident_id: string
  incident_title: string
  incident_status: string
  situation_summary: string
  confidence: IncidentIntelligenceConfidence
  priority: IncidentIntelligencePriority
  key_risks: any[]
  required_capabilities: any[]
  resource_recommendations: any[]
  latest_assessment?: {
    id: string
    mode: string
    mission_type: string
    asset_name: string
    weather: string
    area_surveyed: string
    hazards_detected: string
    structures_damaged: number
    road_accessibility: string
    people_observed: string
    recommended_resources: string
    evacuation_status: string
    operator_notes: string
    confidence: number
    timestamp: string
  } | null
  operational_state: OperationalStateMetrics
  decision_support: DecisionSupportSummary
  evidence: any[]
}

export interface GeospatialIncident {
  incident_id: string
  title: string
  status: string
  severity: string
  priority_level: string
  priority_score: number
  confidence_score: number
  confidence_level: string
  location_name: string
  latitude?: number | null
  longitude?: number | null
  coordinates_available: boolean
}

export interface GeospatialResource {
  resource_id: string
  name: string
  category: string
  status: string
  operational_state: string
  base_location: string
  latitude?: number | null
  longitude?: number | null
  coordinates_available: boolean
  distance_to_incident_km?: number | null
  assigned_incident_id?: string | null
  assigned_operation_id?: string | null
  personnel_count: number
  last_updated: string
}

export interface GeospatialOperation {
  operation_id: string
  resource_id: string
  resource_name: string
  resource_category: string
  status: string
  destination_location: string
  destination_latitude?: number | null
  destination_longitude?: number | null
  mission_objective: string
  authorized_by: string
  dispatched_time: string
  resource_latitude?: number | null
  resource_longitude?: number | null
  distance_to_incident_km?: number | null
}

export interface GeospatialMapSummary {
  incident_coordinates_available: boolean
  mapped_resources_count: number
  total_resources_count: number
  active_operations_count: number
  available_resources_count: number
}

export interface IncidentGeospatialContext {
  incident: GeospatialIncident
  resources: GeospatialResource[]
  operations: GeospatialOperation[]
  map_summary: GeospatialMapSummary
}


// RESOURCE CENTER DOMAIN TYPE
export interface ResourceCenter {
  id: string
  name: string
  locationName: string
  latitude: number
  longitude: number
  coverageRadiusKm: number
  status: 'ACTIVE' | 'STANDBY' | 'INACTIVE'
  district?: string
  state?: string
  totalResources?: number
  totalPersonnel?: number
  totalVehicles?: number
}
