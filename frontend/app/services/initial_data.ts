import {
  Incident,
  ActiveAlert,
  OperationRecord,
  ResourceUnit,
  AllocationAdvisory,
  AerialAsset,
  PlatformReport,
} from '../types'

// PURE REAL-DATA ARCHITECTURE: All operational and infrastructure lists start completely empty.
// Single source of truth is the authoritative SQLite backend via FastAPI endpoints.
export const FALLBACK_INCIDENTS: Incident[] = []
export const FALLBACK_ALERTS: ActiveAlert[] = []
export const FALLBACK_OPERATIONS: OperationRecord[] = []
export const FALLBACK_RESOURCES: ResourceUnit[] = []
export const FALLBACK_ADVISORIES: AllocationAdvisory[] = []
export const FALLBACK_AERIAL_ASSETS: AerialAsset[] = []
export const FALLBACK_REPORTS: PlatformReport[] = []
