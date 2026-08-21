export interface PriorityIncident {
  id: string
  title: string
  location: string
  impact: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  timeReported: string
}

export interface ActiveAlert {
  id: string
  time: string
  category: 'INFRASTRUCTURE' | 'CIVIL' | 'METEO' | 'MEDICAL'
  message: string
  severity?: 'critical' | 'warning' | 'info'
}

export interface AllocationAdvisory {
  id: string
  resourceName: string
  resourceCategory: 'medical' | 'boat' | 'aviation' | 'engineering'
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

export interface AerialAsset {
  id: string
  name: string
  type: 'drone' | 'helicopter'
  status: 'AVAILABLE' | 'IN USE' | 'DISPATCHED'
}

export type MissionType =
  | 'Area Scan / Survey'
  | 'Damage Assessment'
  | 'Search & Rescue Support'
  | 'Resource Delivery'
  | 'Evacuation / Route Assessment'
  | 'Communication / Observation'

export interface AerialAssessmentSubmission {
  id: string
  relatedIncidentId: string
  relatedIncidentTitle: string
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
