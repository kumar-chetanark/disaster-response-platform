'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ResourceUnit, ResourceStatus, Incident } from '../../types'
import ResourceMap from './ResourceMap'
import { platformDataService } from '../../services/dataService'

interface ResourcesConsoleProps {
  resources?: ResourceUnit[]
  advisories?: any[]
  onApproveAdvisory?: (id: string) => void
  onRejectAdvisory?: (id: string) => void
  onModifyAdvisory?: (id: string) => void
  onUpdateStatus?: (resourceId: string, status: ResourceStatus) => void
  onUpdateResourceStatus?: (id: string, newStatus: ResourceStatus) => void
  onAddResource?: (resource: ResourceUnit) => void
  onOpenOperations?: () => void
  onNavigateToIncident?: (incidentId: string) => void
}

export default function ResourcesConsole({
  resources: initialResources = [],
  onUpdateStatus,
  onUpdateResourceStatus,
  onAddResource,
  onOpenOperations,
  onNavigateToIncident,
}: ResourcesConsoleProps) {
  // Location & Proximity State
  const [activeLocation, setActiveLocation] = useState<string>('')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [radiusKm, setRadiusKm] = useState<number>(25)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [mapCenterCoord, setMapCenterCoord] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('')

  // Live Database States
  const [resourcesList, setResourcesList] = useState<ResourceUnit[]>([])
  const [incidentsList, setIncidentsList] = useState<Incident[]>([])
  const [sheltersList, setSheltersList] = useState<any[]>([])
  const [advisoriesList, setAdvisoriesList] = useState<any[]>([])
  const [incidentRequirements, setIncidentRequirements] = useState<Record<string, number>>({})

  // Search query & Autocomplete
  const [locationSearch, setLocationSearch] = useState<string>('')
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [globalSuggestions, setGlobalSuggestions] = useState<any[]>([])
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
  const searchTimeoutRef = React.useRef<any>(null)

  // Response Team Formation State
  const [teamSelection, setTeamSelection] = useState<Record<string, number>>({
    rescue: 0,
    police: 0,
    medical: 0,
    fire: 0,
    fireTruck: 0,
    ambulance: 0,
    boat: 0,
    bus: 0,
    logistics: 0,
  })

  // Action status message
  const [actionStatusMsg, setActionStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isAutoSuggesting, setIsAutoSuggesting] = useState(false)

  // Comprehensive "Add / Update Local Resource Picture" Modal State
  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false)
    // Modal Autocomplete Search States
  const [modalLocationSearch, setModalLocationSearch] = useState<string>('')
  const [isModalSuggestionsOpen, setIsModalSuggestionsOpen] = useState(false)
  const [modalSuggestions, setModalSuggestions] = useState<any[]>([])
  const [isSearchingModal, setIsSearchingModal] = useState(false)
  const modalSearchTimeoutRef = React.useRef<any>(null)
  const [modalSelectedCoords, setModalSelectedCoords] = useState<{ lat: number; lon: number } | null>(null)
const [modalAreaName, setModalAreaName] = useState('')
  const [modalCoverageRadius, setModalCoverageRadius] = useState<number>(25)
  const [modalApplyArea, setModalApplyArea] = useState('CURRENT_LOCATION')
  const [modalNotes, setModalNotes] = useState('')

  // Modal Counter Form States
  const [formPersonnel, setFormPersonnel] = useState({
    rescue: 0,
    police: 0,
    doctors: 0,
    firefighters: 0,
    nurses: 0,
    engineers: 0,
    otherStaff: 0,
  })

  const [formVehicles, setFormVehicles] = useState({
    fireTrucks: 0,
    ambulances: 0,
    rescueBoats: 0,
    helicopters: 0,
    drones: 0,
    buses: 0,
    logistics: 0,
    otherVehicles: 0,
  })

  const [formFacilities, setFormFacilities] = useState({
    shelters: 0,
    shelterCapacity: 0,
    shelterAvailable: 0,
    hospitals: 0,
    hospitalBeds: 0,
    emergencyBeds: 0,
    icuBeds: 0,
    waterLitres: 0,
    foodPersonDays: 0,
    medicineDays: 0,
  })

  // Haversine distance calculator
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Fetch all core operational data directly from live backend
  const loadAllData = async () => {
    try {
      const [resData, incData, shlData, advData] = await Promise.all([
        platformDataService.getResources(),
        platformDataService.getIncidents(),
        platformDataService.getShelters(),
        platformDataService.getAdvisories(),
      ])

      const validInc = incData || []
      const validRes = resData || []
      const validShl = shlData || []

      setResourcesList(validRes)
      setIncidentsList(validInc)
      setSheltersList(validShl)
      setAdvisoriesList(advData || [])

      const now = new Date()
      const zuluTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} ZULU`
      setLastUpdatedTime(zuluTime)

      if (validInc.length > 0) {
        const active = validInc.find(i => i.id === selectedIncidentId) || validInc[0]
        setSelectedIncidentId(active.id)
        const loc = (active as any).location_name || active.location || 'Operational Area'
        setActiveLocation(loc)
        if (typeof active.latitude === 'number' && typeof active.longitude === 'number') {
          setMapCenterCoord({ lat: active.latitude, lon: active.longitude })
        }
      } else if (validRes.length > 0) {
        const firstRes = validRes[0]
        setActiveLocation(firstRes.location || 'Operational Area')
        if (typeof firstRes.latitude === 'number' && typeof firstRes.longitude === 'number') {
          setMapCenterCoord({ lat: firstRes.latitude, lon: firstRes.longitude })
        }
      } else {
        setActiveLocation('New Delhi, Delhi, India')
        setSelectedIncidentId(null)
        setMapCenterCoord({ lat: 28.6139, lon: 77.2090 }) // Default coordinates
      }
    } catch (err) {
      console.error('[ResourcesConsole] Failed to load data:', err)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Currently selected incident object from live incidentsList (null if empty)
  const activeIncident = useMemo(() => {
    if (!selectedIncidentId || incidentsList.length === 0) return null
    return incidentsList.find(i => i.id === selectedIncidentId) || null
  }, [incidentsList, selectedIncidentId])

  // Filter items strictly within live coverage radius
  const nearbyResources = useMemo(() => {
    if (!mapCenterCoord || typeof mapCenterCoord.lat !== 'number' || typeof mapCenterCoord.lon !== 'number') {
      return resourcesList
    }
    const cLat = mapCenterCoord.lat
    const cLon = mapCenterCoord.lon
    return resourcesList.filter(r => {
      if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number') return true
      const dist = calculateDistanceKm(cLat, cLon, r.latitude, r.longitude)
      return dist <= radiusKm
    })
  }, [resourcesList, mapCenterCoord, radiusKm])

  const nearbyShelters = useMemo(() => {
    if (!mapCenterCoord || typeof mapCenterCoord.lat !== 'number' || typeof mapCenterCoord.lon !== 'number') {
      return sheltersList
    }
    const cLat = mapCenterCoord.lat
    const cLon = mapCenterCoord.lon
    return sheltersList.filter(s => {
      if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return true
      const dist = calculateDistanceKm(cLat, cLon, s.latitude, s.longitude)
      return dist <= radiusKm
    })
  }, [sheltersList, mapCenterCoord, radiusKm])

  const nearbyIncidentsCount = useMemo(() => {
    if (incidentsList.length === 0) return 0
    if (!mapCenterCoord || typeof mapCenterCoord.lat !== 'number' || typeof mapCenterCoord.lon !== 'number') {
      return incidentsList.length
    }
    const cLat = mapCenterCoord.lat
    const cLon = mapCenterCoord.lon
    return incidentsList.filter(i => {
      if (typeof i.latitude !== 'number' || typeof i.longitude !== 'number') return true
      return calculateDistanceKm(cLat, cLon, i.latitude, i.longitude) <= radiusKm
    }).length
  }, [incidentsList, mapCenterCoord, radiusKm])

  // Population in coverage (0 when empty)
  const totalPopulationInCoverage = useMemo(() => {
    if (incidentsList.length === 0 && sheltersList.length === 0) return 0
    let pop = 0
    incidentsList.forEach(inc => {
      if (typeof inc.latitude === 'number' && typeof inc.longitude === 'number' && mapCenterCoord) {
        const dist = calculateDistanceKm(mapCenterCoord.lat, mapCenterCoord.lon, inc.latitude, inc.longitude)
        if (dist <= radiusKm) {
          pop += Number((inc as any).affected_population || inc.affectedPopulation || 0)
        }
      } else {
        pop += Number((inc as any).affected_population || inc.affectedPopulation || 0)
      }
    })
    nearbyShelters.forEach(shl => {
      pop += Number(shl.total_capacity || 0)
    })
    return pop
  }, [incidentsList, nearbyShelters, mapCenterCoord, radiusKm])

  // Human Resource Inventory - Calculated purely from active database records
  const availablePersonnel = useMemo(() => {
    const getCount = (filterFn: (r: ResourceUnit) => boolean) => {
      return nearbyResources
        .filter(r => (r.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' && filterFn(r))
        .reduce((sum, r) => sum + (r.personnelCount || 1), 0)
    }

    return {
      rescue: getCount(r => (r.category as string) === 'rescue' || r.name.toLowerCase().includes('rescue') || r.name.toLowerCase().includes('ndrf')),
      police: getCount(r => (r.category as string) === 'police' || (r.category as string) === 'police_army' || r.name.toLowerCase().includes('police')),
      doctors: getCount(r => (r.category as string) === 'medical' || r.name.toLowerCase().includes('medical') || r.name.toLowerCase().includes('trauma') || r.name.toLowerCase().includes('doctor')),
      firefighters: getCount(r => (r.category as string) === 'fire' || r.name.toLowerCase().includes('fire') || r.name.toLowerCase().includes('brigade')),
    }
  }, [nearbyResources])

  const totalPersonnelAvailable = Object.values(availablePersonnel).reduce((a, b) => a + b, 0)

  // Vehicles & Response Assets Inventory
  const availableVehicles = useMemo(() => {
    const getUnitCount = (filterFn: (r: ResourceUnit) => boolean) => {
      return nearbyResources.filter(r => (r.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' && filterFn(r)).length
    }

    return {
      fireTrucks: getUnitCount(r => (r.category as string) === 'fire' || r.name.toLowerCase().includes('tender') || r.name.toLowerCase().includes('engine') || r.name.toLowerCase().includes('fire')),
      ambulances: getUnitCount(r => (r.category as string) === 'medical' || r.type === 'Ambulance' || r.name.toLowerCase().includes('paramedic') || r.name.toLowerCase().includes('ambulance')),
      rescueBoats: getUnitCount(r => (r.category as string) === 'boat' || (r.category as string) === 'water' || r.name.toLowerCase().includes('boat') || r.name.toLowerCase().includes('raft')),
      helicopters: getUnitCount(r => (r.category as string) === 'helicopter' || (r.category as string) === 'aerial' || r.name.toLowerCase().includes('helo')),
      drones: getUnitCount(r => (r.category as string) === 'drone' || r.name.toLowerCase().includes('drone') || r.name.toLowerCase().includes('uav')),
      buses: getUnitCount(r => r.name.toLowerCase().includes('bus') || r.type === 'Evacuation Bus'),
      logistics: getUnitCount(r => r.name.toLowerCase().includes('logistics') || r.name.toLowerCase().includes('flatbed')),
    }
  }, [nearbyResources])

  const totalVehiclesAvailable = Object.values(availableVehicles).reduce((a, b) => a + b, 0)

  // Facilities & Relief Capacity from database
  const reliefMetrics = useMemo(() => {
    const shelterUnits = nearbyShelters.filter(s => s.facility_type !== 'Hospital' && !s.name?.toLowerCase().includes('hospital'))
    const hospitalUnits = nearbyShelters.filter(s => s.facility_type === 'Hospital' || (s.name && s.name.toLowerCase().includes('hospital')))

    const shelterCap = shelterUnits.reduce((acc, s) => acc + (s.total_capacity || 0), 0)
    const shelterOcc = shelterUnits.reduce((acc, s) => acc + (s.current_occupancy || 0), 0)
    const shelterAvail = Math.max(0, shelterCap - shelterOcc)

    const hospBeds = hospitalUnits.reduce((acc, h) => acc + (h.available_beds || 0), 0)
    const emergBeds = hospitalUnits.reduce((acc, h) => acc + (h.emergency_beds || 0), 0)
    const icuBeds = hospitalUnits.reduce((acc, h) => acc + (h.icu_beds || 0), 0)

    const waterLitres = nearbyShelters.reduce((acc, s) => acc + (s.water_litres || 0), 0)
    const foodDays = nearbyShelters.reduce((acc, s) => acc + (s.food_person_days || 0), 0)
    const medicineDays = nearbyShelters.length > 0 ? Math.max(...nearbyShelters.map(s => s.medicine_days_stock || 0)) : 0

    return {
      shelterCount: shelterUnits.length,
      shelterCapacity: shelterCap,
      shelterAvailable: shelterAvail,
      hospitalCount: hospitalUnits.length,
      hospitalBeds: hospBeds,
      emergencyBeds: emergBeds,
      icuBeds: icuBeds,
      waterLitres: waterLitres,
      foodPersonDays: foodDays,
      medicineDays: medicineDays,
    }
  }, [nearbyShelters])

  // Incident Requirements (0 if no incident)
  useEffect(() => {
    if (!activeIncident) {
      setIncidentRequirements({
        rescue: 0,
        police: 0,
        medical: 0,
        fire: 0,
        ambulance: 0,
        boat: 0,
        drone: 0,
        bus: 0,
      })
      return
    }

    const sev = (activeIncident.severity || 'HIGH').toUpperCase()
    const dtype = (activeIncident.disasterType || '').toLowerCase()
    const pop = Number((activeIncident as any).affected_population || activeIncident.affectedPopulation || 0)

    const reqs: Record<string, number> = {
      rescue: sev === 'CRITICAL' ? Math.max(4, Math.ceil(pop / 5)) : 2,
      police: sev === 'CRITICAL' ? Math.max(3, Math.ceil(pop / 8)) : 2,
      medical: sev === 'CRITICAL' ? 2 : 1,
      fire: dtype.includes('collapse') || dtype.includes('fire') ? 2 : 0,
      fireTruck: dtype.includes('collapse') || dtype.includes('fire') ? 1 : 0,
      ambulance: 1,
      boat: dtype.includes('flood') ? 1 : 0,
      bus: Math.max(1, Math.ceil(pop / 15)),
      logistics: sev === 'CRITICAL' ? 1 : 0,
    }

    setIncidentRequirements(reqs)
  }, [activeIncident])

  const totalSelectedPersonnel =
    (teamSelection.rescue || 0) +
    (teamSelection.police || 0) +
    (teamSelection.medical || 0) +
    (teamSelection.fire || 0)

  const totalSelectedVehicles =
    (teamSelection.fireTruck || 0) +
    (teamSelection.ambulance || 0) +
    (teamSelection.boat || 0) +
    (teamSelection.bus || 0) +
    (teamSelection.logistics || 0)

  // Incident Selection Handler
  const handleSelectIncident = (incId: string) => {
    setSelectedIncidentId(incId)
    const inc = incidentsList.find(i => i.id === incId)
    if (inc) {
      const loc = (inc as any).location_name || inc.location || 'Operational Area'
      setActiveLocation(loc)
      if (typeof inc.latitude === 'number' && typeof inc.longitude === 'number') {
        setMapCenterCoord({ lat: inc.latitude, lon: inc.longitude })
      }
    }
  }

  // Open "Add / Update Local Resource Picture" Modal
  const handleOpenAddModal = () => {
    setModalCoverageRadius(radiusKm)
    setModalAreaName(activeLocation || '')
    setModalLocationSearch(activeLocation || '')
    setModalSelectedCoords(mapCenterCoord)
    setIsPictureModalOpen(true)
  }

  // Save full Resource Picture
  const handleSaveResourcePicture = async () => {
    try {
      const baseLat = modalSelectedCoords?.lat ?? mapCenterCoord?.lat ?? 28.6139
      const baseLon = modalSelectedCoords?.lon ?? mapCenterCoord?.lon ?? 77.2090
      const locName = modalAreaName.trim() || activeLocation || 'Operational Area'

      // Update activeLocation and mapCenterCoord to match newly assigned picture location
      setActiveLocation(locName)
      if (modalSelectedCoords) {
        setMapCenterCoord(modalSelectedCoords)
      }

      const unitsToCreate: Partial<ResourceUnit>[] = []

      if (formPersonnel.rescue > 0) {
        unitsToCreate.push({
          name: `${locName} Urban Rescue Team`,
          type: 'Squad',
          category: 'rescue' as any,
          status: 'AVAILABLE',
          location: locName,
          latitude: baseLat + 0.002,
          longitude: baseLon + 0.002,
          personnelCount: formPersonnel.rescue,
        })
      }
      if (formPersonnel.police > 0) {
        unitsToCreate.push({
          name: `${locName} Police Security Force`,
          type: 'Squad',
          category: 'police' as any,
          status: 'AVAILABLE',
          location: locName,
          latitude: baseLat - 0.002,
          longitude: baseLon + 0.003,
          personnelCount: formPersonnel.police,
        })
      }
      if (formPersonnel.doctors > 0) {
        unitsToCreate.push({
          name: `${locName} Emergency Medical Staff`,
          type: 'Squad',
          category: 'medical' as any,
          status: 'AVAILABLE',
          location: locName,
          latitude: baseLat + 0.004,
          longitude: baseLon - 0.002,
          personnelCount: formPersonnel.doctors,
        })
      }
      if (formPersonnel.firefighters > 0) {
        unitsToCreate.push({
          name: `${locName} Fire & Hazard Contingent`,
          type: 'Squad',
          category: 'fire' as any,
          status: 'AVAILABLE',
          location: locName,
          latitude: baseLat - 0.003,
          longitude: baseLon - 0.004,
          personnelCount: formPersonnel.firefighters,
        })
      }

      // Vehicles
      if (formVehicles.fireTrucks > 0) {
        for (let i = 0; i < formVehicles.fireTrucks; i++) {
          unitsToCreate.push({
            name: `${locName} Fire Tender ${i + 1}`,
            type: 'Fire Truck',
            category: 'fire' as any,
            status: 'AVAILABLE',
            location: locName,
            latitude: baseLat + (i * 0.001),
            longitude: baseLon + (i * 0.001),
            personnelCount: 4,
          })
        }
      }
      if (formVehicles.ambulances > 0) {
        for (let i = 0; i < formVehicles.ambulances; i++) {
          unitsToCreate.push({
            name: `${locName} Ambulance Unit ${i + 1}`,
            type: 'Ambulance',
            category: 'medical' as any,
            status: 'AVAILABLE',
            location: locName,
            latitude: baseLat - (i * 0.001),
            longitude: baseLon + (i * 0.002),
            personnelCount: 2,
          })
        }
      }
      if (formVehicles.rescueBoats > 0) {
        for (let i = 0; i < formVehicles.rescueBoats; i++) {
          unitsToCreate.push({
            name: `${locName} Swift Water Boat ${i + 1}`,
            type: 'Boat',
            category: 'boat' as any,
            status: 'AVAILABLE',
            location: locName,
            latitude: baseLat + 0.005,
            longitude: baseLon + 0.005,
            personnelCount: 3,
          })
        }
      }
      if (formVehicles.drones > 0) {
        for (let i = 0; i < formVehicles.drones; i++) {
          unitsToCreate.push({
            name: `${locName} Recon UAV Drone ${i + 1}`,
            type: 'Drone',
            category: 'drone' as any,
            status: 'AVAILABLE',
            location: locName,
            latitude: baseLat,
            longitude: baseLon,
            personnelCount: 1,
          })
        }
      }

      for (const u of unitsToCreate) {
        await platformDataService.createResource({
          id: `RES-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
          name: u.name || 'Resource Unit',
          type: u.type || 'Squad',
          category: u.category || 'rescue',
          status: 'AVAILABLE',
          location: u.location || locName,
          latitude: u.latitude,
          longitude: u.longitude,
          personnelCount: u.personnelCount || 1,
          equipmentDetails: 'Standard operational loadout',
        })
      }

      if (formFacilities.shelters > 0) {
        await platformDataService.createShelter({
          id: `SHL-${Date.now().toString().slice(-4)}`,
          name: `${locName} Community Relief Center`,
          location: locName,
          latitude: baseLat + 0.003,
          longitude: baseLon - 0.003,
          total_capacity: formFacilities.shelterCapacity || 1000,
          current_occupancy: Math.max(0, (formFacilities.shelterCapacity || 1000) - (formFacilities.shelterAvailable || 500)),
          water_litres: formFacilities.waterLitres || 5000,
          food_person_days: formFacilities.foodPersonDays || 3000,
          medicine_days_stock: formFacilities.medicineDays || 7,
          facility_type: 'Shelter',
        })
      }

      if (formFacilities.hospitals > 0) {
        await platformDataService.createShelter({
          id: `HSP-${Date.now().toString().slice(-4)}`,
          name: `${locName} District Hospital`,
          location: locName,
          latitude: baseLat - 0.004,
          longitude: baseLon + 0.004,
          total_capacity: formFacilities.hospitalBeds || 200,
          current_occupancy: 50,
          available_beds: formFacilities.hospitalBeds || 150,
          emergency_beds: formFacilities.emergencyBeds || 30,
          icu_beds: formFacilities.icuBeds || 10,
          facility_type: 'Hospital',
        })
      }

      setActionStatusMsg({
        type: 'success',
        text: `LOCAL RESOURCE PICTURE SAVED: Added resources & relief facilities to ${locName}.`,
      })

      setIsPictureModalOpen(false)
      loadAllData()
    } catch (err: any) {
      console.error('Save resource picture error:', err)
      setActionStatusMsg({
        type: 'error',
        text: 'Failed to save local resource picture.',
      })
    }
  }

  // Auto-Suggest Team
  const handleAutoSuggestTeam = () => {
    if (!activeIncident) {
      setActionStatusMsg({ type: 'info', text: 'No active incident selected to auto-suggest team.' })
      return
    }
    setIsAutoSuggesting(true)
    setTimeout(() => {
      setTeamSelection({
        rescue: incidentRequirements.rescue || 0,
        police: incidentRequirements.police || 0,
        medical: incidentRequirements.medical || 0,
        fire: incidentRequirements.fire || 0,
        fireTruck: incidentRequirements.fireTruck || 0,
        ambulance: incidentRequirements.ambulance || 0,
        boat: incidentRequirements.boat || 0,
        bus: incidentRequirements.bus || 0,
        logistics: incidentRequirements.logistics || 0,
      })
      setActionStatusMsg({
        type: 'success',
        text: `AI Resource Engine: Optimal balanced team suggested for ${activeIncident.id}.`,
      })
      setIsAutoSuggesting(false)
    }, 300)
  }

  // Adjust selection count
  const handleAdjustCount = (key: string, delta: number) => {
    setTeamSelection(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + delta),
    }))
  }

  // Deploy Action
  const handleDeployResponseTeam = async () => {
    if (!activeIncident) {
      setActionStatusMsg({ type: 'error', text: 'No active incident selected for deployment.' })
      return
    }

    if (totalSelectedPersonnel === 0 && totalSelectedVehicles === 0) {
      setActionStatusMsg({ type: 'error', text: 'Select at least 1 unit to deploy.' })
      return
    }

    setIsDeploying(true)
    setActionStatusMsg(null)

    try {
      const candidateSquads = resourcesList.filter(
        r => (r.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE'
      )

      if (candidateSquads.length === 0) {
        setActionStatusMsg({ type: 'error', text: 'No available units in inventory.' })
        setIsDeploying(false)
        return
      }

      const deployedRes = candidateSquads[0]
      const targetLoc = (activeIncident as any).location_name || activeIncident.location || 'Operational Sector'

      const result = await platformDataService.dispatchOperation({
        incidentId: activeIncident.id,
        resourceId: deployedRes.id,
        operationType: `Multi-Agency Response Force (${activeIncident.disasterType || 'Disaster'})`,
        destinationLocation: targetLoc,
        objectives: `Deploy response team to ${activeIncident.title || activeIncident.id}. Personnel: ${totalSelectedPersonnel}, Vehicles: ${totalSelectedVehicles}.`,
        authorizedBy: 'Cmdr. Operational Authority (Level 5)',
      })

      if (result) {
        setResourcesList(prev =>
          prev.map(r => (r.id === deployedRes.id ? { ...r, status: 'IN OPERATION' as ResourceStatus, assignedIncidentId: activeIncident.id } : r))
        )

        setActionStatusMsg({
          type: 'success',
          text: `DEPLOYMENT AUTHORIZED: Operation ${result.id} dispatched!`,
        })

        loadAllData()
      }
    } catch (err: any) {
      console.error('Deployment error:', err)
      setActionStatusMsg({
        type: 'error',
        text: err?.message || 'Deployment conflict occurred.',
      })
    } finally {
      setIsDeploying(false)
    }
  }

  // Search Autocomplete Handler
    // Modal Area Search Autocomplete Handler
  const handleModalLocationInput = (val: string) => {
    setModalAreaName(val)
    setModalLocationSearch(val)
    if (!val || val.trim().length < 2) {
      setModalSuggestions([])
      setIsModalSuggestionsOpen(false)
      if (modalSearchTimeoutRef.current) clearTimeout(modalSearchTimeoutRef.current)
      return
    }

    setIsModalSuggestionsOpen(true)
    setIsSearchingModal(true)

    if (modalSearchTimeoutRef.current) clearTimeout(modalSearchTimeoutRef.current)

    modalSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const trimmed = val.trim()
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`)
        if (res.ok) {
          const d = await res.json()
          const list = (d.features || []).map((feat: any) => {
            const p = feat.properties || {}
            const coords = feat.geometry?.coordinates || [0, 0]
            const name = p.name || p.city || p.country || 'Location'
            const sub = [p.city, p.state, p.country].filter(Boolean).join(', ')
            return {
              name,
              displayName: sub ? `${name}, ${sub}` : name,
              lat: coords[1],
              lon: coords[0],
              type: (p.osm_value || 'place').toUpperCase(),
            }
          })
          setModalSuggestions(list)
        }
      } catch {
        setModalSuggestions([])
      } finally {
        setIsSearchingModal(false)
      }
    }, 180)
  }

  const handleSelectModalLocation = (item: any) => {
    setModalAreaName(item.name)
    setModalLocationSearch(item.displayName)
    setIsModalSuggestionsOpen(false)
    setModalSuggestions([])
    if (typeof item.lat === 'number' && typeof item.lon === 'number') {
      setModalSelectedCoords({ lat: item.lat, lon: item.lon })
    }
  }

  const handleGlobalLocationInput = (val: string) => {
    setLocationSearch(val)
    if (!val || val.trim().length < 2) {
      setGlobalSuggestions([])
      setIsSuggestionsOpen(false)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      return
    }

    setIsSuggestionsOpen(true)
    setIsSearchingGlobal(true)

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const trimmed = val.trim()
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`)
        if (res.ok) {
          const d = await res.json()
          const list = (d.features || []).map((feat: any) => {
            const p = feat.properties || {}
            const coords = feat.geometry?.coordinates || [0, 0]
            const name = p.name || p.city || p.country || 'Location'
            const sub = [p.city, p.state, p.country].filter(Boolean).join(', ')
            return {
              name,
              displayName: sub ? `${name}, ${sub}` : name,
              lat: coords[1],
              lon: coords[0],
              type: (p.osm_value || 'place').toUpperCase(),
            }
          })
          setGlobalSuggestions(list)
        }
      } catch {
        setGlobalSuggestions([])
      } finally {
        setIsSearchingGlobal(false)
      }
    }, 180)
  }

  const handleSelectGlobalLocation = (item: any) => {
    setLocationSearch(item.name)
    setActiveLocation(item.displayName)
    setIsSuggestionsOpen(false)
    setGlobalSuggestions([])
    if (typeof item.lat === 'number' && typeof item.lon === 'number') {
      setMapCenterCoord({ lat: item.lat, lon: item.lon })
    }
  }

  // Computed totals for modal
  const modalTotalPersonnel = Object.values(formPersonnel).reduce((a, b) => a + b, 0)
  const modalTotalVehicles = Object.values(formVehicles).reduce((a, b) => a + b, 0)

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050b18] text-slate-200 overflow-y-auto overflow-x-hidden w-full font-sans">
      {/* Internal Scrollable Content Container */}
      <div className="p-4 sm:p-5 space-y-3 pb-16 max-w-[1720px] mx-auto w-full">
        {/* 1. TOP HEADER & CONTROLS */}
        <div className="relative z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0b1329] border border-[#1e293b] rounded-xl p-3 shadow-md">
          {/* Active Reference Point Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold tracking-wider text-[#38bdf8] uppercase bg-[#0284c7]/20 px-1.5 py-0.5 rounded">
                  RESOURCE AVAILABILITY &bull; LOCATION
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  PROXIMITY SOLVER ACTIVE
                </span>
              </div>
              <h2 className="text-[13px] font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
                {activeLocation || 'No Location Active'}
                <span className="text-[11px] font-mono text-emerald-400 font-medium">
                  Coverage Radius: {radiusKm} km
                </span>
              </h2>
            </div>
          </div>

          {/* Search Bar, Radius Dropdown & Add Resource Button */}
          <div className="flex items-center gap-2.5 relative flex-wrap sm:flex-nowrap">
            {/* Search Input Box */}
            <div className="relative w-64 sm:w-80">
              <div className="flex items-center gap-2 bg-[#060c1d] border border-[#1e293b] px-3 py-1.5 rounded-lg focus-within:border-sky-500 transition-all">
                <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => handleGlobalLocationInput(e.target.value)}
                  placeholder="Search location, incident, resource..."
                  className="bg-transparent text-[12px] text-white placeholder-slate-500 outline-none w-full font-sans"
                />
                {locationSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationSearch('')
                      setGlobalSuggestions([])
                    }}
                    className="text-slate-500 hover:text-slate-300 text-[12px]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isSuggestionsOpen && globalSuggestions.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-1.5 bg-[#0b1329] border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden z-30 text-[12px] divide-y divide-[#1e293b]/60">
                  {globalSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectGlobalLocation(item)}
                      className="p-2.5 hover:bg-[#1e293b]/60 cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="font-bold text-white text-[12px]">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.displayName}</div>
                      </div>
                      <span className="text-[9px] font-mono bg-[#060c1d] px-1.5 py-0.5 rounded text-sky-400 border border-[#1e293b] shrink-0">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Radius Select Dropdown */}
            <div className="relative">
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-[#060c1d] border border-[#1e293b] text-sky-400 text-[11px] font-mono font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-sky-500/60 transition-colors appearance-none pr-7"
              >
                <option value={5} className="bg-[#0b1329] text-white">Radius: 5 km</option>
                <option value={10} className="bg-[#0b1329] text-white">Radius: 10 km</option>
                <option value={25} className="bg-[#0b1329] text-white">Radius: 25 km (Default)</option>
                <option value={50} className="bg-[#0b1329] text-white">Radius: 50 km</option>
                <option value={100} className="bg-[#0b1329] text-white">Radius: 100 km</option>
              </select>
              <span className="material-symbols-outlined text-[16px] text-sky-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                arrow_drop_down
              </span>
            </div>

            {/* ADD RESOURCE BUTTON (Triggers the new 3-panel Resource Picture Modal) */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-bold font-mono uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              ADD RESOURCE
            </button>
          </div>
        </div>

        {/* 2. OPERATIONAL MAP */}
        <ResourceMap
          resources={resourcesList}
          incidents={incidentsList}
          shelters={sheltersList}
          selectedResourceId={selectedResourceId}
          selectedIncidentId={selectedIncidentId}
          onSelectResource={(id) => setSelectedResourceId(id)}
          onSelectIncident={handleSelectIncident}
          activeLocation={activeLocation}
          mapCenterCoord={mapCenterCoord}
          radiusKm={radiusKm}
        />

        {/* Action Notification Message Bar */}
        {actionStatusMsg && (
          <div
            className={`p-2.5 rounded-lg border text-[12px] font-mono flex items-center justify-between ${
              actionStatusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : actionStatusMsg.type === 'error'
                ? 'bg-red-950/40 border-red-500/50 text-red-300'
                : 'bg-sky-950/40 border-sky-500/50 text-sky-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">
                {actionStatusMsg.type === 'success' ? 'check_circle' : actionStatusMsg.type === 'error' ? 'error' : 'info'}
              </span>
              <span>{actionStatusMsg.text}</span>
            </div>
            <button type="button" onClick={() => setActionStatusMsg(null)} className="text-slate-400 hover:text-white text-[13px] px-1">
              ✕
            </button>
          </div>
        )}

        {/* 3. ROW 1: AREA OVERVIEW KPI BAR */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3 shadow-md space-y-2">
          <div className="flex items-center justify-between border-b border-[#1e293b]/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#0284c7] text-white flex items-center justify-center text-[11px] font-mono font-bold">
                1
              </span>
              <h3 className="text-[12px] font-bold text-white uppercase tracking-wider font-mono">
                AREA OVERVIEW
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeLocation || 'Coverage Area'} &bull; <span className="text-sky-400 font-bold">{radiusKm} km Coverage</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Last Updated: <span className="text-emerald-400">{lastUpdatedTime || 'LIVE'}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono">
            {/* Active Incidents */}
            <div className="bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{nearbyIncidentsCount}</div>
                <div className="text-[9px] text-slate-400 uppercase">Active Incidents</div>
              </div>
            </div>

            {/* Resources Available */}
            <div className="bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{nearbyResources.length}</div>
                <div className="text-[9px] text-slate-400 uppercase">Resources Available</div>
              </div>
            </div>

            {/* Shelters */}
            <div className="bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">home_work</span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{reliefMetrics.shelterCount}</div>
                <div className="text-[9px] text-slate-400 uppercase">Shelters</div>
              </div>
            </div>

            {/* Hospitals */}
            <div className="bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">local_hospital</span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{reliefMetrics.hospitalCount}</div>
                <div className="text-[9px] text-slate-400 uppercase">Hospitals</div>
              </div>
            </div>

            {/* Population in Coverage */}
            <div className="bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">people</span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{totalPopulationInCoverage.toLocaleString()}</div>
                <div className="text-[9px] text-slate-400 uppercase">Population in Coverage</div>
              </div>
            </div>

            {/* Operational Radius */}
            <div className="bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">radar</span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-white leading-tight">{radiusKm} km</div>
                <div className="text-[9px] text-slate-400 uppercase">Operational Radius</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. ROW 2: SELECT INCIDENT | INCIDENT DETAILS | LOCAL RESOURCE PICTURE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Card 2: SELECT INCIDENT TO WORK ON (4 cols) */}
          <div className="lg:col-span-4 bg-[#0b1329] border border-[#1e293b] rounded-xl p-3 shadow-md flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-2 border-b border-[#1e293b]/80 pb-2">
                <span className="w-5 h-5 rounded bg-[#0284c7] text-white flex items-center justify-center text-[11px] font-mono font-bold">
                  2
                </span>
                <h3 className="text-[12px] font-bold text-white uppercase tracking-wider font-mono">
                  SELECT INCIDENT TO WORK ON
                </h3>
              </div>

              <div className="mt-2 overflow-x-auto min-h-[100px]">
                {incidentsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 text-slate-500 font-mono text-[11px]">
                    <span className="material-symbols-outlined text-[24px] mb-1">check_circle</span>
                    <span>No active incidents reported</span>
                  </div>
                ) : (
                  <table className="w-full text-[11px] font-mono text-left">
                    <thead>
                      <tr className="text-slate-400 border-b border-[#1e293b] text-[10px]">
                        <th className="pb-1.5 font-normal">Incident ID</th>
                        <th className="pb-1.5 font-normal">Type</th>
                        <th className="pb-1.5 font-normal">Severity</th>
                        <th className="pb-1.5 font-normal">Affected</th>
                        <th className="pb-1.5 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/50">
                      {incidentsList.map(inc => {
                        const isSel = inc.id === selectedIncidentId
                        const sev = (inc.severity || 'HIGH').toUpperCase()
                        const pop = (inc as any).affected_population || inc.affectedPopulation || 0
                        return (
                          <tr
                            key={inc.id}
                            onClick={() => handleSelectIncident(inc.id)}
                            className={`cursor-pointer transition-colors ${
                              isSel ? 'bg-[#0284c7]/20 text-white font-bold' : 'hover:bg-[#1e293b]/40 text-slate-300'
                            }`}
                          >
                            <td className="py-2 flex items-center gap-1.5">
                              <input
                                type="radio"
                                name="selectedIncident"
                                checked={isSel}
                                onChange={() => handleSelectIncident(inc.id)}
                                className="text-sky-500 focus:ring-0 cursor-pointer"
                              />
                              <span className="font-bold">{inc.id}</span>
                            </td>
                            <td className="py-2 text-slate-300">{inc.disasterType || 'Disaster'}</td>
                            <td className="py-2">
                              <span className={sev === 'CRITICAL' ? 'text-red-400 font-bold' : sev === 'HIGH' ? 'text-orange-400 font-bold' : 'text-amber-400'}>
                                {sev}
                              </span>
                            </td>
                            <td className="py-2 text-slate-300">{pop}</td>
                            <td className="py-2">
                              <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                {inc.status || 'ACTIVE'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!activeIncident}
              onClick={() => onNavigateToIncident && activeIncident && onNavigateToIncident(activeIncident.id)}
              className={`w-full py-1.5 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 uppercase transition-all ${
                activeIncident
                  ? 'bg-[#0284c7]/20 hover:bg-[#0284c7]/30 border border-[#0284c7]/40 text-sky-400 cursor-pointer'
                  : 'bg-slate-800/40 text-slate-600 border border-[#1e293b] cursor-not-allowed'
              }`}
            >
              WORK ON INCIDENT &rarr;
            </button>
          </div>

          {/* Card 3: INCIDENT & COVERAGE DETAILS (3 cols) */}
          <div className="lg:col-span-3 bg-[#0b1329] border border-[#1e293b] rounded-xl p-3 shadow-md space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-[#1e293b]/80 pb-2">
                <span className="w-5 h-5 rounded bg-[#0284c7] text-white flex items-center justify-center text-[11px] font-mono font-bold">
                  3
                </span>
                <h3 className="text-[12px] font-bold text-white uppercase tracking-wider font-mono">
                  INCIDENT &amp; COVERAGE DETAILS
                </h3>
              </div>

              <div className="mt-2 space-y-1.5 text-[11px] font-mono">
                <div className="text-slate-300">
                  Incident: <span className="text-red-400 font-bold">{activeIncident?.id || '—'}</span> &bull; {activeIncident?.disasterType || '—'}
                </div>
                <div className="text-slate-300">
                  Severity: <span className="text-red-400 font-bold">{activeIncident ? `${activeIncident.severity || 'HIGH'} PRIORITY` : '—'}</span>
                </div>
                <div className="text-slate-300">
                  Location: <span className="text-white">{activeIncident ? ((activeIncident as any)?.location_name || activeIncident?.location || 'Operational Area') : '—'}</span>
                </div>
                <div className="text-slate-300">
                  Incident Time: <span className="text-slate-400">{lastUpdatedTime || '—'}</span>
                </div>
                <div className="text-slate-300">
                  Operational Radius: <span className="text-sky-400 font-bold">{radiusKm} km</span>
                </div>
              </div>
            </div>

            {/* Tactical Radar Visualization */}
            <div className="w-full flex items-center justify-center py-2">
              <div className="relative w-28 h-28 rounded-full border border-sky-500/30 flex items-center justify-center bg-[#060c1d]/60">
                <div className="absolute inset-2 rounded-full border border-sky-500/20"></div>
                <div className="absolute inset-5 rounded-full border border-sky-500/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-sky-500/20"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-px bg-sky-500/20"></div>
                </div>

                {activeIncident ? (
                  <>
                    {/* Center Incident Blip */}
                    <div className="w-6 h-6 rounded-full bg-red-500/80 border border-white flex items-center justify-center text-white shadow-lg shadow-red-500/50 z-10">
                      <span className="material-symbols-outlined text-[13px]">warning</span>
                    </div>

                    {/* Orbiting Resource Blips */}
                    {nearbyResources.length > 0 && (
                      <div className="absolute top-3 right-5 w-4 h-4 rounded-full bg-sky-500 border border-white flex items-center justify-center text-white text-[8px]">
                        <span className="material-symbols-outlined text-[9px]">directions_car</span>
                      </div>
                    )}
                    {reliefMetrics.shelterCount > 0 && (
                      <div className="absolute bottom-2 left-6 w-4 h-4 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white text-[8px]">
                        <span className="material-symbols-outlined text-[9px]">home</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-600 font-mono text-[9px] text-center px-2">
                    RADAR STANDBY
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: LOCAL RESOURCE PICTURE (5 cols - Clean Original Layout) */}
          <div className="lg:col-span-5 bg-[#0b1329] border border-[#1e293b] rounded-xl p-3 shadow-md space-y-2">
            <div className="flex items-center justify-between border-b border-[#1e293b]/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#0284c7] text-white flex items-center justify-center text-[11px] font-mono font-bold">
                  4
                </span>
                <h3 className="text-[12px] font-bold text-white uppercase tracking-wider font-mono">
                  LOCAL RESOURCE PICTURE
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeIncident ? `${activeIncident.id} • ${activeIncident.disasterType || 'Disaster'}` : 'All Districts'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 font-bold">
                {radiusKm} km Operational Coverage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] font-mono pt-1">
              {/* Column A: Personnel */}
              <div className="space-y-1 bg-[#060c1d] p-2.5 rounded-lg border border-[#1e293b] flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-400 uppercase text-[9px] border-b border-[#1e293b] pb-1 mb-1">
                    PERSONNEL
                  </div>
                  <div className="flex justify-between"><span>Rescue Personnel</span> <span className="text-sky-400 font-bold">{availablePersonnel.rescue}</span></div>
                  <div className="flex justify-between"><span>Police / Security</span> <span className="text-sky-400 font-bold">{availablePersonnel.police}</span></div>
                  <div className="flex justify-between"><span>Doctors / Medics</span> <span className="text-sky-400 font-bold">{availablePersonnel.doctors}</span></div>
                  <div className="flex justify-between"><span>Firefighters</span> <span className="text-sky-400 font-bold">{availablePersonnel.firefighters}</span></div>
                </div>
                <div className="flex justify-between border-t border-[#1e293b] pt-1.5 font-bold text-white mt-2">
                  <span>Total Personnel</span> <span className="text-emerald-400">{totalPersonnelAvailable}</span>
                </div>
              </div>

              {/* Column B: Vehicles & Assets */}
              <div className="space-y-1 bg-[#060c1d] p-2.5 rounded-lg border border-[#1e293b] flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-400 uppercase text-[9px] border-b border-[#1e293b] pb-1 mb-1">
                    VEHICLES &amp; ASSETS
                  </div>
                  <div className="flex justify-between"><span>Fire Trucks</span> <span className="text-sky-400 font-bold">{availableVehicles.fireTrucks}</span></div>
                  <div className="flex justify-between"><span>Ambulances</span> <span className="text-sky-400 font-bold">{availableVehicles.ambulances}</span></div>
                  <div className="flex justify-between"><span>Rescue Boats</span> <span className="text-sky-400 font-bold">{availableVehicles.rescueBoats}</span></div>
                  <div className="flex justify-between"><span>Helicopters</span> <span className="text-sky-400 font-bold">{availableVehicles.helicopters}</span></div>
                  <div className="flex justify-between"><span>Drones / UAV</span> <span className="text-sky-400 font-bold">{availableVehicles.drones}</span></div>
                  <div className="flex justify-between"><span>Evacuation Buses</span> <span className="text-sky-400 font-bold">{availableVehicles.buses}</span></div>
                  <div className="flex justify-between"><span>Logistics Vehicles</span> <span className="text-sky-400 font-bold">{availableVehicles.logistics}</span></div>
                </div>
                <div className="flex justify-between border-t border-[#1e293b] pt-1.5 font-bold text-white mt-1">
                  <span>Total Vehicles / Assets</span> <span className="text-emerald-400">{totalVehiclesAvailable}</span>
                </div>
              </div>

              {/* Column C: Facilities & Relief Capacity */}
              <div className="space-y-1 bg-[#060c1d] p-2.5 rounded-lg border border-[#1e293b] flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-400 uppercase text-[9px] border-b border-[#1e293b] pb-1 mb-1">
                    FACILITIES &amp; RELIEF CAPACITY
                  </div>
                  <div className="flex justify-between"><span>Shelters</span> <span className="text-emerald-400 font-bold">{reliefMetrics.shelterCount}</span></div>
                  <div className="flex justify-between text-slate-400 pl-1.5"><span>Capacity</span> <span>{reliefMetrics.shelterCapacity.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-400 pl-1.5"><span>Available</span> <span className="text-emerald-400">{reliefMetrics.shelterAvailable.toLocaleString()}</span></div>

                  <div className="flex justify-between pt-0.5"><span>Hospitals</span> <span className="text-purple-400 font-bold">{reliefMetrics.hospitalCount}</span></div>
                  <div className="flex justify-between text-slate-400 pl-1.5"><span>Beds</span> <span>{reliefMetrics.hospitalBeds}</span></div>
                  <div className="flex justify-between text-slate-400 pl-1.5"><span>Emergency Beds</span> <span>{reliefMetrics.emergencyBeds}</span></div>
                  <div className="flex justify-between text-slate-400 pl-1.5"><span>ICU Beds</span> <span>{reliefMetrics.icuBeds}</span></div>
                </div>

                <div className="border-t border-[#1e293b] pt-1 space-y-0.5 mt-1">
                  <div className="flex justify-between"><span>Water</span> <span className="text-sky-300 font-bold">{reliefMetrics.waterLitres.toLocaleString()} Ltrs</span></div>
                  <div className="flex justify-between"><span>Food</span> <span className="text-amber-300 font-bold">{reliefMetrics.foodPersonDays.toLocaleString()} Person-Days</span></div>
                  <div className="flex justify-between"><span>Medicine</span> <span className="text-emerald-300 font-bold">{reliefMetrics.medicineDays} Days Stock</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ROW 3: BUILD RESPONSE TEAM */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e293b]/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#0284c7] text-white flex items-center justify-center text-[11px] font-mono font-bold">
                5
              </span>
              <h3 className="text-[12px] font-bold text-white uppercase tracking-wider font-mono">
                BUILD RESPONSE TEAM
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeIncident ? (
                  <>
                    <span className="text-red-400 font-bold">{activeIncident.id}</span> &bull; {activeIncident.disasterType || 'DISASTER'} &bull; <span className="text-orange-400 font-bold">{activeIncident.severity || 'HIGH'} PRIORITY</span> &bull; {(activeIncident as any)?.location_name || activeIncident?.location || 'Sector'}
                  </>
                ) : (
                  'NO INCIDENT SELECTED'
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left Table: Personnel Requirements (5 cols) */}
            <div className="lg:col-span-5 bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5">
              <table className="w-full text-[11px] font-mono text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-[#1e293b] text-[10px]">
                    <th className="pb-1.5 font-normal">Requirement</th>
                    <th className="pb-1.5 font-normal text-center">Required</th>
                    <th className="pb-1.5 font-normal text-center">Available ({radiusKm} km)</th>
                    <th className="pb-1.5 font-normal text-center">Selected</th>
                    <th className="pb-1.5 font-normal text-center">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {[
                    { key: 'rescue', label: 'Rescue Personnel', icon: 'groups', req: incidentRequirements.rescue || 0, avail: availablePersonnel.rescue },
                    { key: 'police', label: 'Police / Security', icon: 'local_police', req: incidentRequirements.police || 0, avail: availablePersonnel.police },
                    { key: 'medical', label: 'Doctors / Medics', icon: 'medical_services', req: incidentRequirements.medical || 0, avail: availablePersonnel.doctors },
                    { key: 'fire', label: 'Firefighters', icon: 'local_fire_department', req: incidentRequirements.fire || 0, avail: availablePersonnel.firefighters },
                  ].map(row => {
                    const sel = teamSelection[row.key] || 0
                    const gap = sel - row.req
                    return (
                      <tr key={row.key} className="py-2">
                        <td className="py-2 flex items-center gap-1.5 text-slate-200">
                          <span className="material-symbols-outlined text-[15px] text-sky-400">{row.icon}</span>
                          <span>{row.label}</span>
                        </td>
                        <td className="py-2 text-center text-slate-300 font-bold">{row.req}</td>
                        <td className="py-2 text-center text-emerald-400 font-bold">{row.avail}</td>
                        <td className="py-2 text-center">
                          <div className="inline-flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(row.key, -1)}
                              className="text-slate-400 hover:text-white px-1 text-[12px] font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold text-white min-w-[16px]">{sel}</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(row.key, 1)}
                              className="text-slate-400 hover:text-white px-1 text-[12px] font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            gap >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {gap === 0 ? '0' : gap > 0 ? `+${gap}` : gap} {gap >= 0 ? '✓' : '⚠️'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Middle Table: Vehicles & Assets Requirements (4 cols) */}
            <div className="lg:col-span-4 bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5">
              <table className="w-full text-[11px] font-mono text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-[#1e293b] text-[10px]">
                    <th className="pb-1.5 font-normal">Vehicle / Asset</th>
                    <th className="pb-1.5 font-normal text-center">Required</th>
                    <th className="pb-1.5 font-normal text-center">Available ({radiusKm} km)</th>
                    <th className="pb-1.5 font-normal text-center">Selected</th>
                    <th className="pb-1.5 font-normal text-center">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {[
                    { key: 'fireTruck', label: 'Fire Trucks', icon: 'local_fire_department', req: incidentRequirements.fireTruck || 0, avail: availableVehicles.fireTrucks },
                    { key: 'ambulance', label: 'Ambulances', icon: 'airport_shuttle', req: incidentRequirements.ambulance || 0, avail: availableVehicles.ambulances },
                    { key: 'boat', label: 'Rescue Boats', icon: 'sailing', req: incidentRequirements.boat || 0, avail: availableVehicles.rescueBoats },
                    { key: 'bus', label: 'Evacuation Buses', icon: 'directions_bus', req: incidentRequirements.bus || 0, avail: availableVehicles.buses },
                    { key: 'logistics', label: 'Logistics Vehicles', icon: 'local_shipping', req: incidentRequirements.logistics || 0, avail: availableVehicles.logistics },
                  ].map(row => {
                    const sel = teamSelection[row.key] || 0
                    const gap = sel - row.req
                    return (
                      <tr key={row.key} className="py-2">
                        <td className="py-2 flex items-center gap-1.5 text-slate-200">
                          <span className="material-symbols-outlined text-[15px] text-sky-400">{row.icon}</span>
                          <span>{row.label}</span>
                        </td>
                        <td className="py-2 text-center text-slate-300 font-bold">{row.req}</td>
                        <td className="py-2 text-center text-emerald-400 font-bold">{row.avail}</td>
                        <td className="py-2 text-center">
                          <div className="inline-flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(row.key, -1)}
                              className="text-slate-400 hover:text-white px-1 text-[12px] font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold text-white min-w-[16px]">{sel}</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(row.key, 1)}
                              className="text-slate-400 hover:text-white px-1 text-[12px] font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            gap >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {gap === 0 ? '0' : gap > 0 ? `+${gap}` : gap} {gap >= 0 ? '✓' : '⚠️'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Right Summary & Action Card (3 cols) */}
            <div className="lg:col-span-3 bg-[#060c1d] border border-[#1e293b] rounded-lg p-3 flex flex-col justify-between space-y-2.5 font-mono">
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase border-b border-[#1e293b] pb-1 mb-2">
                  TEAM SUMMARY
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Personnel</span>
                    <span className="text-white font-bold">{totalSelectedPersonnel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Vehicles / Assets</span>
                    <span className="text-white font-bold">{totalSelectedVehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Response Time</span>
                    <span className="text-emerald-400 font-bold">{totalSelectedPersonnel > 0 ? '15 - 20 min' : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resource Gap</span>
                    <span className={`font-bold uppercase ${
                      totalSelectedPersonnel === 0 ? 'text-slate-400' : 'text-emerald-400'
                    }`}>
                      {totalSelectedPersonnel === 0 ? 'NO SELECTION' : 'BALANCED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleAutoSuggestTeam}
                  disabled={isAutoSuggesting || !activeIncident}
                  className={`w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 uppercase transition-all ${
                    activeIncident
                      ? 'bg-[#0284c7]/20 hover:bg-[#0284c7]/30 border border-[#0284c7]/50 text-sky-400 cursor-pointer'
                      : 'bg-slate-800/40 text-slate-600 border border-[#1e293b] cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  {isAutoSuggesting ? 'Calculating...' : 'AUTO-SUGGEST TEAM'}
                </button>

                <button
                  type="button"
                  onClick={handleDeployResponseTeam}
                  disabled={isDeploying || totalSelectedPersonnel === 0 || !activeIncident}
                  className={`w-full py-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 uppercase transition-all shadow-lg ${
                    totalSelectedPersonnel > 0 && activeIncident
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-950/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-[#1e293b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  {isDeploying ? 'AUTHORIZING DISPATCH...' : 'DEPLOY RESPONSE TEAM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW COMPREHENSIVE MODAL: Add / Update Local Resource Picture (Area Coverage) */}
      {isPictureModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl font-sans text-[12px] overflow-hidden">
            {/* Modal Title & Close Button (Fixed Header) */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-[#1e293b] shrink-0 bg-[#0b1329]">
              <div>
                <h3 className="text-[15px] sm:text-[16px] font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-[20px] sm:text-[22px]">add_circle</span>
                  Add / Update Local Resource Picture (Area Coverage)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  Define the available resources, assets and facilities for the selected operational coverage area.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPictureModalOpen(false)}
                className="text-slate-400 hover:text-white text-[20px] cursor-pointer p-1 rounded-lg hover:bg-[#1e293b] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">

            {/* Top Auto-Fetched Location & Operational Coverage Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Location Badge */}
              <div className="bg-[#060c1d] border border-[#1e293b] rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">location_on</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">LOCATION (AUTO-FETCHED)</span>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      ✓ DETECTED FROM MAP
                    </span>
                  </div>
                  <div className="text-[13px] font-bold text-white mt-0.5 truncate">
                    {modalAreaName || activeLocation || 'New Delhi, Delhi, India'}
                  </div>
                </div>
              </div>

              {/* Operational Coverage Badge */}
              <div className="bg-[#060c1d] border border-[#1e293b] rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">radar</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">OPERATIONAL COVERAGE</span>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      ✓ ACTIVE
                    </span>
                  </div>
                  <div className="text-[13px] font-bold text-white mt-0.5">
                    {modalCoverageRadius} km Radius
                  </div>
                </div>
              </div>
            </div>

            {/* Area Details Inputs */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5">AREA DETAILS</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Area Name / Location Search Box (6 cols) - Same as top Search */}
                <div className="md:col-span-6 relative">
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Area Name / Location Search <span className="text-slate-500">(Search to Autocomplete)</span>
                  </label>
                  <div className="flex items-center gap-2 bg-[#060c1d] border border-[#1e293b] px-3 py-2 rounded-lg focus-within:border-sky-500 transition-all">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
                    <input
                      type="text"
                      value={modalAreaName}
                      onChange={(e) => handleModalLocationInput(e.target.value)}
                      placeholder="Search location (e.g. Connaught Place, New Delhi, Rohini...)"
                      className="bg-transparent text-[12px] text-white placeholder-slate-500 outline-none w-full font-sans"
                    />
                    {modalAreaName && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalAreaName('')
                          setModalLocationSearch('')
                          setModalSuggestions([])
                        }}
                        className="text-slate-500 hover:text-slate-300 text-[12px] cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Suggestions Popup */}
                  {isModalSuggestionsOpen && modalSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b1329] border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden z-50 text-[12px] divide-y divide-[#1e293b]/60">
                      {modalSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectModalLocation(item)}
                          className="p-2.5 hover:bg-[#1e293b]/80 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <div className="font-bold text-white text-[12px]">{item.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.displayName}</div>
                          </div>
                          <span className="text-[9px] font-mono bg-[#060c1d] px-1.5 py-0.5 rounded text-sky-400 border border-[#1e293b] shrink-0">
                            {item.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coverage Radius Stepper (3 cols) */}
                <div className="md:col-span-3">
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Coverage Radius (km) ℹ
                  </label>
                  <div className="flex items-center bg-[#060c1d] border border-[#1e293b] rounded-lg px-3 py-1.5 justify-between">
                    <span className="font-mono text-white font-bold">{modalCoverageRadius} <span className="text-slate-500 text-[10px]">km</span></span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModalCoverageRadius(prev => Math.max(5, prev - 5))}
                        className="text-slate-400 hover:text-white px-1.5 py-0.5 bg-[#0b1329] border border-[#1e293b] rounded text-[11px] font-bold"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalCoverageRadius(prev => Math.min(100, prev + 5))}
                        className="text-slate-400 hover:text-white px-1.5 py-0.5 bg-[#0b1329] border border-[#1e293b] rounded text-[11px] font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Apply To Area Dropdown (3 cols) */}
                <div className="md:col-span-3">
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Apply To Area
                  </label>
                  <select
                    value={modalApplyArea}
                    onChange={(e) => setModalApplyArea(e.target.value)}
                    className="w-full bg-[#060c1d] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:border-sky-500 outline-none text-[12px]"
                  >
                    <option value="CURRENT_LOCATION">These values will represent the resources available in this area.</option>
                    <option value="DISTRICT_WIDE">District Wide Operational Pool</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tri-Column Resource Form: Personnel | Vehicles & Assets | Facilities & Relief Capacity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
              {/* 1. PERSONNEL COLUMN */}
              <div className="bg-[#060c1d] border border-[#1e293b] rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 mb-2">
                    <span className="material-symbols-outlined text-[18px] text-sky-400">groups</span>
                    <span className="font-bold text-white text-[12px] uppercase font-mono">PERSONNEL</span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    {[
                      { key: 'rescue', label: 'Rescue Personnel' },
                      { key: 'police', label: 'Police / Security' },
                      { key: 'doctors', label: 'Doctors / Medics' },
                      { key: 'firefighters', label: 'Firefighters' },
                    ].map(row => (
                      <div key={row.key} className="flex items-center justify-between">
                        <span className="text-slate-300">{row.label}</span>
                        <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-1.5 py-0.5">
                          <input
                            type="number"
                            min="0"
                            value={(formPersonnel as any)[row.key]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0)
                              setFormPersonnel(prev => ({ ...prev, [row.key]: val }))
                            }}
                            className="w-12 bg-transparent text-center text-white font-bold outline-none text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => setFormPersonnel(prev => ({ ...prev, [row.key]: Math.max(0, (prev as any)[row.key] - 1) }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPersonnel(prev => ({ ...prev, [row.key]: (prev as any)[row.key] + 1 }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#1e293b] pt-2 flex justify-between items-center font-mono font-bold">
                  <span className="text-white text-[11px] uppercase">TOTAL PERSONNEL</span>
                  <span className="text-emerald-400 text-[13px]">{modalTotalPersonnel}</span>
                </div>
              </div>

              {/* 2. VEHICLES & ASSETS COLUMN */}
              <div className="bg-[#060c1d] border border-[#1e293b] rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 mb-2">
                    <span className="material-symbols-outlined text-[18px] text-sky-400">directions_car</span>
                    <span className="font-bold text-white text-[12px] uppercase font-mono">VEHICLES &amp; ASSETS</span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    {[
                      { key: 'fireTrucks', label: 'Fire Trucks' },
                      { key: 'ambulances', label: 'Ambulances' },
                      { key: 'rescueBoats', label: 'Rescue Boats' },
                      { key: 'helicopters', label: 'Helicopters' },
                      { key: 'drones', label: 'Drones / UAV' },
                      { key: 'buses', label: 'Evacuation Buses' },
                      { key: 'logistics', label: 'Logistics Vehicles' },
                    ].map(row => (
                      <div key={row.key} className="flex items-center justify-between">
                        <span className="text-slate-300">{row.label}</span>
                        <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-1.5 py-0.5">
                          <input
                            type="number"
                            min="0"
                            value={(formVehicles as any)[row.key]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0)
                              setFormVehicles(prev => ({ ...prev, [row.key]: val }))
                            }}
                            className="w-12 bg-transparent text-center text-white font-bold outline-none text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => setFormVehicles(prev => ({ ...prev, [row.key]: Math.max(0, (prev as any)[row.key] - 1) }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormVehicles(prev => ({ ...prev, [row.key]: (prev as any)[row.key] + 1 }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#1e293b] pt-2 flex justify-between items-center font-mono font-bold">
                  <span className="text-white text-[11px] uppercase">TOTAL VEHICLES / ASSETS</span>
                  <span className="text-emerald-400 text-[13px]">{modalTotalVehicles}</span>
                </div>
              </div>

              {/* 3. FACILITIES & RELIEF CAPACITY COLUMN */}
              <div className="bg-[#060c1d] border border-[#1e293b] rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                    <span className="material-symbols-outlined text-[18px] text-sky-400">home_work</span>
                    <span className="font-bold text-white text-[12px] uppercase font-mono">FACILITIES &amp; RELIEF CAPACITY</span>
                  </div>

                  {/* Shelters Subheading */}
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase">SHELTERS</div>
                    {[
                      { key: 'shelters', label: 'Shelters' },
                      { key: 'shelterCapacity', label: 'Capacity (Total)' },
                      { key: 'shelterAvailable', label: 'Available Capacity' },
                    ].map(row => (
                      <div key={row.key} className="flex items-center justify-between">
                        <span className="text-slate-300">{row.label}</span>
                        <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-1.5 py-0.5">
                          <input
                            type="number"
                            min="0"
                            value={(formFacilities as any)[row.key]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0)
                              setFormFacilities(prev => ({ ...prev, [row.key]: val }))
                            }}
                            className="w-14 bg-transparent text-center text-white font-bold outline-none text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => setFormFacilities(prev => ({ ...prev, [row.key]: Math.max(0, (prev as any)[row.key] - 10) }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormFacilities(prev => ({ ...prev, [row.key]: (prev as any)[row.key] + 10 }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hospitals Subheading */}
                  <div className="space-y-1.5 font-mono text-[11px] pt-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase">HOSPITALS</div>
                    {[
                      { key: 'hospitals', label: 'Hospitals' },
                      { key: 'hospitalBeds', label: 'Beds (Total)' },
                      { key: 'emergencyBeds', label: 'Emergency Beds' },
                      { key: 'icuBeds', label: 'ICU Beds' },
                    ].map(row => (
                      <div key={row.key} className="flex items-center justify-between">
                        <span className="text-slate-300">{row.label}</span>
                        <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-1.5 py-0.5">
                          <input
                            type="number"
                            min="0"
                            value={(formFacilities as any)[row.key]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0)
                              setFormFacilities(prev => ({ ...prev, [row.key]: val }))
                            }}
                            className="w-14 bg-transparent text-center text-white font-bold outline-none text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => setFormFacilities(prev => ({ ...prev, [row.key]: Math.max(0, (prev as any)[row.key] - 1) }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormFacilities(prev => ({ ...prev, [row.key]: (prev as any)[row.key] + 1 }))}
                            className="text-slate-400 hover:text-white px-1 text-[11px] font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Relief Inventory: Water, Food, Medicine */}
                  <div className="border-t border-[#1e293b] pt-2 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-sky-400 flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[14px]">water_drop</span> WATER
                      </span>
                      <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-2 py-0.5">
                        <input
                          type="number"
                          min="0"
                          value={formFacilities.waterLitres}
                          onChange={(e) => setFormFacilities(prev => ({ ...prev, waterLitres: parseInt(e.target.value) || 0 }))}
                          className="w-16 bg-transparent text-right text-white font-bold outline-none"
                        />
                        <span className="text-slate-500 text-[10px]">Ltrs</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[14px]">restaurant</span> FOOD
                      </span>
                      <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-2 py-0.5">
                        <input
                          type="number"
                          min="0"
                          value={formFacilities.foodPersonDays}
                          onChange={(e) => setFormFacilities(prev => ({ ...prev, foodPersonDays: parseInt(e.target.value) || 0 }))}
                          className="w-16 bg-transparent text-right text-white font-bold outline-none"
                        />
                        <span className="text-slate-500 text-[10px]">Person-Days</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-red-400 flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[14px]">medical_services</span> MEDICINE
                      </span>
                      <div className="flex items-center gap-1 bg-[#0b1329] border border-[#1e293b] rounded px-2 py-0.5">
                        <input
                          type="number"
                          min="0"
                          value={formFacilities.medicineDays}
                          onChange={(e) => setFormFacilities(prev => ({ ...prev, medicineDays: parseInt(e.target.value) || 0 }))}
                          className="w-16 bg-transparent text-right text-white font-bold outline-none"
                        />
                        <span className="text-slate-500 text-[10px]">Days Stock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes Textarea */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                ADDITIONAL NOTES <span className="text-slate-500 font-normal">(Optional)</span>
              </div>
              <textarea
                rows={2}
                maxLength={300}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Add any additional information about this area..."
                className="w-full bg-[#060c1d] border border-[#1e293b] rounded-lg p-2.5 text-white placeholder-slate-600 focus:border-sky-500 outline-none text-[11px] font-sans"
              />
              <div className="text-right text-[10px] text-slate-500 font-mono">
                {modalNotes.length} / 300
              </div>
            </div>

            </div>

            {/* Bottom Info Banner & Action Buttons (Fixed Footer) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 pt-3 border-t border-[#1e293b] shrink-0 bg-[#0b1329]">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] bg-[#060c1d] px-3 py-1.5 rounded-lg border border-[#1e293b]">
                <span className="material-symbols-outlined text-[16px] text-sky-400">info</span>
                <span>These values will be used for planning, resource allocation and response team building.</span>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPictureModalOpen(false)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-mono text-[11px] font-bold rounded-lg uppercase cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveResourcePicture}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold rounded-lg uppercase cursor-pointer flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  SAVE RESOURCE PICTURE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
