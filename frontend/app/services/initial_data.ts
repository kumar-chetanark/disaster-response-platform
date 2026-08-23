import {
  Incident,
  ActiveAlert,
  OperationRecord,
  ResourceUnit,
  AllocationAdvisory,
  AerialAsset,
  PlatformReport,
} from '../types'

// PURE REAL-DATA ARCHITECTURE: No fictional preset incidents
export const FALLBACK_INCIDENTS: Incident[] = []

export const FALLBACK_ALERTS: ActiveAlert[] = []

export const FALLBACK_OPERATIONS: OperationRecord[] = []

export const FALLBACK_RESOURCES: ResourceUnit[] = [
  {
    id: 'res-ndrf-04',
    name: 'NDRF Swift-Water Rescue Squad 4',
    category: 'rescue',
    status: 'AVAILABLE',
    location: 'Sector 7G Basin Substation',
    personnelCount: 14,
    equipmentDetails: '4x Inflatable Gemini boats, life-vests, thermal night-vision',
  },
  {
    id: 'res-med-12',
    name: 'Rapid Mobile Trauma Unit & Ambulance 12',
    category: 'medical',
    status: 'AVAILABLE',
    location: 'Sector 4 Main Depot',
    personnelCount: 8,
    equipmentDetails: 'Mobile ICU, triage trauma beds, oxygen generators',
  },
  {
    id: 'res-uav-09',
    name: 'SkyWatch Heavy UAV Recon Drone 9',
    category: 'drone',
    status: 'AVAILABLE',
    location: 'Central Regional Airfield',
    personnelCount: 3,
    equipmentDetails: 'LIDAR mapping sensor, high-zoom 4K infrared gimbal',
  },
  {
    id: 'res-land-01',
    name: 'Heavy Debris Road Clearance Excavator',
    category: 'land',
    status: 'AVAILABLE',
    location: 'Sector 9 Logistics Bay',
    personnelCount: 4,
    equipmentDetails: 'Hydraulic breaker, claw bucket, chain saws',
  },
]

export const FALLBACK_ADVISORIES: AllocationAdvisory[] = []

export const FALLBACK_AERIAL_ASSETS: AerialAsset[] = [
  {
    id: 'asset-uav-9',
    name: 'SkyWatch Heavy UAV Recon Drone 9',
    type: 'drone',
    status: 'AVAILABLE',
    batteryOrFuel: '94%',
    operatorTeam: 'Central UAV Recon Squadron',
  },
]

export const FALLBACK_REPORTS: PlatformReport[] = [
  {
    id: 'rep-audit-303',
    title: 'Central Regional Disaster Depot — Fleet Readiness & Stockpile Audit',
    reportType: 'Resource Utilization',
    author: 'Maj. S. Ramanujan (Inspector General)',
    summary: 'Comprehensive audit of logistics substations, fuel reserves, inflatable raft fleets, and critical medical stores.',
    metricsSummary: 'Readiness: 94% | Stockpiles: Optimal | Fleets: 100% Operational',
    date: 'Today',
  },
]
