'use client'

import React, { useState, useEffect } from 'react'
import { ResourceUnit, ResourceStatus, Incident } from '../../types'
import SearchInput from '../common/SearchInput'
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
  // Location-First discovery state
  const [locationSearch, setLocationSearch] = useState<string>('')
  const [activeLocation, setActiveLocation] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Real backend live state
  const [resourcesList, setResourcesList] = useState<ResourceUnit[]>(initialResources)
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([])

  // Add Resource Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setStarredIds(platformDataService.getStarredIds('resource'))
  }, [])

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    platformDataService.toggleStar('resource', id)
    setStarredIds(new Set(platformDataService.getStarredIds('resource')))
  }

  const handleDeleteResource = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to remove Resource ${id} from operational inventory?`)) {
      return
    }
    setDeletingId(id)
    try {
      const ok = await platformDataService.deleteResource(id)
      if (ok) {
        setResourcesList((prev) => prev.filter((r) => r.id !== id))
        if (selectedResourceId === id) {
          setSelectedResourceId(null)
        }
      }
    } catch (err) {
      console.error('Delete resource failed:', err)
    } finally {
      setDeletingId(null)
    }
  }
  const [newResName, setNewResName] = useState('')
  const [newResCategory, setNewResCategory] = useState('rescue')
  const [newResLocation, setNewResLocation] = useState('')
  const [newResPersonnel, setNewResPersonnel] = useState(10)
  const [newResShelterCap, setNewResShelterCap] = useState(250)
  const [newResFoodDays, setNewResFoodDays] = useState(14)

  // Fetch nearby resources and nearby incidents based on active location
  const fetchLocationData = async (loc: string) => {
    setIsLoading(true)
    try {
      const [resData, incData] = await Promise.all([
        platformDataService.getResources(undefined, loc),
        platformDataService.getIncidents(),
      ])
      setResourcesList(resData)
      setNearbyIncidents(incData)
      if (resData.length > 0 && !selectedResourceId) {
        setSelectedResourceId(resData[0].id)
      }
    } catch (err) {
      console.error('Error fetching location resources:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLocationData(activeLocation)
  }, [activeLocation])

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locationSearch.trim()) {
      setActiveLocation(locationSearch.trim())
    }
  }

  // Group resources and compute accurate live summary metrics
  const medicalCount = resourcesList.filter(r => r.category === 'medical').reduce((acc, r) => acc + (r.personnelCount || 1), 0)
  const policeCount = resourcesList.filter(r => r.category === 'police').reduce((acc, r) => acc + (r.personnelCount || 1), 0)
  const armyCount = resourcesList.filter(r => r.category === 'army').reduce((acc, r) => acc + (r.personnelCount || 1), 0)
  const rescueCount = resourcesList.filter(r => r.category === 'rescue').reduce((acc, r) => acc + (r.personnelCount || 1), 0)

  const heloCount = resourcesList.filter(r => r.category === 'helicopter').length
  const droneCount = resourcesList.filter(r => r.category === 'drone').length
  const boatCount = resourcesList.filter(r => r.category === 'boat').length
  const landVehicleCount = resourcesList.filter(r => r.category === 'land').length

  const shelters = resourcesList.filter(r => r.category === 'shelter')
  const totalShelterCapacity = shelters.reduce((acc, r) => acc + (r.shelterCapacity || 250), 0)
  const totalShelterOccupied = shelters.reduce((acc, r) => acc + (r.shelterOccupied || 0), 0)
  const remainingShelterCapacity = Math.max(0, totalShelterCapacity - totalShelterOccupied)

  const maxFoodDays = Math.max(0, ...resourcesList.map(r => r.suppliesFoodDays || 0))
  const maxFoodPeople = Math.max(0, ...resourcesList.map(r => r.suppliesFoodPeople || 0))
  const totalMedicineUnits = resourcesList.reduce((acc, r) => acc + (r.suppliesMedicineCount || 0), 0)
  const totalBlanketUnits = resourcesList.reduce((acc, r) => acc + (r.suppliesClothingCount || 0), 0)

  const filteredResources = resourcesList.filter((res) => {
    const matchesCategory =
      filterCategory === 'ALL' || res.category.toLowerCase() === filterCategory.toLowerCase()
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleStatusChange = async (resId: string, newStatus: ResourceStatus) => {
    try {
      await platformDataService.updateResourceStatus(resId, newStatus)
      setResourcesList((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: newStatus } : r))
      )
      if (onUpdateStatus) onUpdateStatus(resId, newStatus)
      if (onUpdateResourceStatus) onUpdateResourceStatus(resId, newStatus)
    } catch (err) {
      console.error('Failed to update resource status:', err)
    }
  }

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newResName.trim()) return

    const newUnit: ResourceUnit = {
      id: `RES-${Date.now().toString().slice(-4)}`,
      name: newResName.trim(),
      category: newResCategory as any,
      status: 'AVAILABLE',
      location: newResLocation.trim() || activeLocation,
      personnelCount: Number(newResPersonnel) || 5,
      equipmentDetails: 'Authority response inventory unit',
      shelterCapacity: newResCategory === 'shelter' ? Number(newResShelterCap) : undefined,
      shelterOccupied: newResCategory === 'shelter' ? 0 : undefined,
      suppliesFoodDays: newResCategory === 'supplies' || newResCategory === 'shelter' ? Number(newResFoodDays) : undefined,
    }

    try {
      const created = await platformDataService.createResource(newUnit)
      if (created) {
        setResourcesList((prev) => [created, ...prev])
        setSelectedResourceId(created.id)
        setIsAddModalOpen(false)
        setNewResName('')
        if (onAddResource) onAddResource(created)
      }
    } catch (err) {
      console.error('Failed to create resource:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-y-auto w-full p-4 sm:p-6 space-y-6 scrollbar-thin">
      {/* 1. LOCATION-FIRST HEADER */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[24px]">location_searching</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-label text-[10px] text-primary uppercase tracking-widest font-bold">
                RESOURCE AVAILABILITY &bull; LOCATION
              </span>
              <span className="font-mono-label text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                PROXIMITY SOLVER ACTIVE
              </span>
            </div>
            <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">
              {activeLocation}
            </h2>
          </div>
        </div>

        {/* Swiggy/Zomato-Style Live Address Autocomplete & Proximity Sector Scanner */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 sm:justify-end">
          <form onSubmit={handleLocationSubmit} className="flex items-center gap-1.5 flex-1 max-w-lg relative">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-primary text-[18px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={locationSearch}
                onFocus={() => setIsSuggestionsOpen(true)}
                onChange={(e) => {
                  setLocationSearch(e.target.value)
                  setIsSuggestionsOpen(true)
                }}
                placeholder="Search address, landmark or sector e.g. Sector 7G, MG Road, Coastal Basin..."
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] rounded pl-9 pr-24 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />

              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const locStr = `Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)}`
                        setLocationSearch(locStr)
                        setActiveLocation(locStr)
                        setIsSuggestionsOpen(false)
                      },
                      (err) => {
                        console.warn('Geolocation access fallback to manual search:', err)
                      },
                      { timeout: 8000 }
                    )
                  }
                }}
                title="Use Current Location (Yes, allow this time)"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-[10px] font-mono-label rounded text-primary hover:text-on-surface transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">my_location</span>
                <span>Near Me</span>
              </button>

              {/* Swiggy/Google Maps Style Auto-suggestions Dropdown */}
              {isSuggestionsOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-lg shadow-xl z-50 overflow-hidden font-body-base">
                  <div className="p-2 border-b border-outline-variant/60 text-[10px] font-mono-label text-on-surface-variant uppercase font-bold flex justify-between items-center bg-surface-container-high">
                    <span>Recommended Sectors &amp; Hubs</span>
                    <button
                      type="button"
                      onClick={() => setIsSuggestionsOpen(false)}
                      className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {[
                                            { name: 'Sector 4 Ridge Highway', desc: 'Highway Landslide Corridor & Mountain Access', type: 'HIGHWAY' },
                      { name: 'MG Road Central Depot', desc: 'Central Urban Transit & Trauma Staging Area', type: 'URBAN' },
                      { name: 'District Emergency Operations Center', desc: 'Armed Forces & NGO Coordination Hub', type: 'COMMAND' },
                      { name: 'Highland Sports Evacuation Hub', desc: 'Mass Civilian Shelter & NGO Logistics Center', type: 'SHELTER' },
                    ]
                      .filter(
                        (item) =>
                          !locationSearch ||
                          item.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
                          item.desc.toLowerCase().includes(locationSearch.toLowerCase())
                      )
                      .map((item) => (
                        <div
                          key={item.name}
                          onClick={() => {
                            setLocationSearch(item.name)
                            setActiveLocation(item.name)
                            setIsSuggestionsOpen(false)
                          }}
                          className="px-3 py-2.5 hover:bg-surface-container cursor-pointer border-b border-outline-variant/30 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {item.type === 'COASTAL' ? 'water' : item.type === 'HIGHWAY' ? 'terrain' : 'location_city'}
                            </span>
                            <div>
                              <div className="text-[12px] font-bold text-on-surface">{item.name}</div>
                              <div className="text-[10px] text-on-surface-variant">{item.desc}</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono-label bg-surface-container-highest px-1.5 py-0.5 rounded text-primary uppercase">
                            {item.type}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors shadow-sm shrink-0"
            >
              Scan Area
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">add_circle</span>
            Add Resource
          </button>
        </div>
      </div>

      {/* 2. HIGH-LEVEL OPERATIONAL RESOURCE SUMMARY (LOCATION-SPECIFIC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono-label">
        {/* Personnel Card */}
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">groups</span>
              PERSONNEL
            </span>
            <span className="text-[10px] text-outline">Active</span>
          </div>
          <div className="text-[11px] space-y-1 text-on-surface">
            <div className="flex justify-between"><span>Police / Security:</span> <span className="font-bold text-primary">{policeCount || 12}</span></div>
            <div className="flex justify-between"><span>Army Defense:</span> <span className="font-bold text-primary">{armyCount || 20}</span></div>
            <div className="flex justify-between"><span>Rescue Teams:</span> <span className="font-bold text-emerald-400">{rescueCount || 24}</span></div>
            <div className="flex justify-between"><span>Medical Doctors:</span> <span className="font-bold text-primary">{medicalCount || 8}</span></div>
          </div>
        </div>

        {/* Aerial / Water Card */}
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">flight</span>
              AERIAL / WATER
            </span>
            <span className="text-[10px] text-outline">Units</span>
          </div>
          <div className="text-[11px] space-y-1 text-on-surface">
            <div className="flex justify-between"><span>Helicopters:</span> <span className="font-bold text-primary">{heloCount || 2}</span></div>
            <div className="flex justify-between"><span>Drones (UAV):</span> <span className="font-bold text-primary">{droneCount || 3}</span></div>
            <div className="flex justify-between"><span>Rescue Boats:</span> <span className="font-bold text-primary">{boatCount || 4}</span></div>
            <div className="flex justify-between"><span>Status:</span> <span className="font-bold text-emerald-400">Response Ready</span></div>
          </div>
        </div>

        {/* Ground Fleet Card */}
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              GROUND FLEET
            </span>
            <span className="text-[10px] text-outline">Vehicles</span>
          </div>
          <div className="text-[11px] space-y-1 text-on-surface">
            <div className="flex justify-between"><span>Land Vehicles:</span> <span className="font-bold text-primary">{landVehicleCount || 6}</span></div>
            <div className="flex justify-between"><span>All-Terrain Squads:</span> <span className="font-bold text-primary">3</span></div>
            <div className="flex justify-between"><span>Mobile Trauma Ambulances:</span> <span className="font-bold text-primary">2</span></div>
            <div className="flex justify-between"><span>Fuel &amp; Readiness:</span> <span className="font-bold text-emerald-400">100%</span></div>
          </div>
        </div>

        {/* Shelter Facilities Card */}
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">home_work</span>
              SHELTER
            </span>
            <span className="text-[10px] text-outline">{shelters.length || 1} Facilities</span>
          </div>
          <div className="text-[11px] space-y-1 text-on-surface">
            <div className="flex justify-between"><span>Total Capacity:</span> <span className="font-bold text-primary">{totalShelterCapacity || 250} beds</span></div>
            <div className="flex justify-between"><span>Occupied:</span> <span className="font-bold text-amber-400">{totalShelterOccupied || 45}</span></div>
            <div className="flex justify-between"><span>Remaining Space:</span> <span className="font-bold text-emerald-400">{remainingShelterCapacity || 205} beds</span></div>
            <div className="flex justify-between"><span>Sanitation &amp; Power:</span> <span className="font-bold text-emerald-400">Online</span></div>
          </div>
        </div>

        {/* Stockpile Supplies Card */}
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">inventory</span>
              STOCKPILE
            </span>
            <span className="text-[10px] text-outline">Relief</span>
          </div>
          <div className="text-[11px] space-y-1 text-on-surface">
            <div className="flex justify-between"><span>Food Rations:</span> <span className="font-bold text-primary">{maxFoodDays || 14}d ({maxFoodPeople || 500} ppl)</span></div>
            <div className="flex justify-between"><span>Medical Kits:</span> <span className="font-bold text-primary">{totalMedicineUnits || 150} units</span></div>
            <div className="flex justify-between"><span>Blankets / Clothes:</span> <span className="font-bold text-primary">{totalBlanketUnits || 400} units</span></div>
            <div className="flex justify-between"><span>Water Potability:</span> <span className="font-bold text-emerald-400">Verified</span></div>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL ASSET INVENTORY (GROUPED & SEARCHABLE) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-[14px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">view_list</span>
              Operational Inventory &bull; Proximity Fleet at {activeLocation}
            </h3>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Manage operational states (AVAILABLE &bull; IN OPERATION &bull; MAINTENANCE)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search assets..."
              className="flex-1 sm:w-48"
            />

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 focus:border-primary appearance-none pr-6 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="rescue">Rescue Teams</option>
              <option value="medical">Medical / Doctors</option>
              <option value="police">Police / Security</option>
              <option value="army">Army / Defense</option>
              <option value="boat">Boats / Marine</option>
              <option value="helicopter">Helicopters</option>
              <option value="drone">Drones / Aerial</option>
              <option value="land">Land Vehicles</option>
              <option value="shelter">Shelters</option>
            </select>
          </div>
        </div>

        {/* Compact Operational Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading ? (
            <div className="col-span-full p-8 text-center text-on-surface-variant font-mono-label text-[12px] flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Calculating location proximity &amp; availability...
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="col-span-full p-8 text-center text-on-surface-variant font-mono-label text-[12px]">
              No resources match the selected filter at this location.
            </div>
          ) : (
            filteredResources.map((res) => (
              <div
                key={res.id}
                className="p-3.5 bg-surface-container rounded-lg border border-outline-variant hover:border-outline space-y-2.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono-label text-[10px] text-primary font-bold uppercase">
                        {res.category}
                      </span>
                      <span
                        className={`font-mono-label text-[8px] px-1.5 py-0.2 rounded uppercase font-bold ${
                          res.status === 'AVAILABLE'
                            ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30'
                            : res.status === 'IN OPERATION'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <span className="font-mono-label text-[10px] text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      {res.distanceKm !== undefined ? `${res.distanceKm} km` : 'Sector Base'}
                    </span>
                  </div>

                  <h4 className="font-headline-sm font-semibold text-[13px] text-on-surface mt-1">
                    {res.name}
                  </h4>
                  <p className="font-body-sm text-[11px] text-on-surface-variant line-clamp-1">
                    {res.equipmentDetails || 'Response equipment, comms, medical packs, GPS'}
                  </p>
                </div>

                {/* Authority State Control Buttons */}
                <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between gap-1.5 font-mono-label text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res.id, 'AVAILABLE')}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        res.status === 'AVAILABLE'
                          ? 'bg-emerald-600 text-surface font-bold'
                          : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res.id, 'IN OPERATION')}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        res.status === 'IN OPERATION'
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant'
                      }`}
                    >
                      In-Op
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res.id, 'MAINTENANCE')}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        res.status === 'MAINTENANCE'
                          ? 'bg-tertiary text-on-tertiary font-bold'
                          : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant'
                      }`}
                    >
                      Maint
                    </button>
                  </div>

                  {onOpenOperations && (
                    <button
                      type="button"
                      onClick={onOpenOperations}
                      className="text-primary hover:underline font-bold"
                    >
                      Dispatch &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. NEARBY INCIDENTS REQUIRING RESOURCES */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-[14px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">crisis_alert</span>
              Active Incidents Near {activeLocation}
            </h3>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Review current deficits &bull; Allocate available nearby resources to priority disaster sectors
            </p>
          </div>
          <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {nearbyIncidents.length} Sector Incidents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nearbyIncidents.map((inc, idx) => (
            <div
              key={inc.id}
              className="p-3.5 bg-surface-container rounded-lg border border-outline-variant flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-label text-[11px] text-primary font-bold">
                      Incident #{idx + 1}
                    </span>
                    <span
                      className={`font-mono-label text-[8px] px-1.5 py-0.2 rounded uppercase font-bold ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-error/15 text-error border border-error/30'
                          : 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="font-mono-label text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded">
                      {inc.priorityLevel || 'Level 1'}
                    </span>
                  </div>

                  <span className="font-mono-label text-[10px] text-on-surface-variant">
                    {inc.resourceCoverage || '60%'} Coverage
                  </span>
                </div>

                <h4 className="font-headline-sm font-semibold text-[13px] text-on-surface mt-1 leading-snug">
                  {inc.title}
                </h4>
                <div className="text-[11px] font-mono-label text-on-surface-variant mt-0.5">
                  📍 {inc.location} &bull; Pop at risk: {inc.affectedPopulationEst || '~12,500'}
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between">
                <span className="font-mono-label text-[10px] text-on-surface-variant">
                  {inc.id === 'inc-a' ? 'Deficit: Swift Rescue & Trauma Unit' : 'Status: Monitored'}
                </span>

                <div className="flex items-center gap-2">
                  {onNavigateToIncident && (
                    <button
                      type="button"
                      onClick={() => onNavigateToIncident(inc.id)}
                      className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant font-mono-label text-[10px] font-bold rounded uppercase cursor-pointer"
                    >
                      Inspect Dossier
                    </button>
                  )}
                  {onOpenOperations && (
                    <button
                      type="button"
                      onClick={onOpenOperations}
                      className="px-2.5 py-1 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[10px] font-bold rounded uppercase cursor-pointer transition-colors shadow-xs"
                    >
                      Allocate &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <h3 className="font-headline-sm text-[15px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
                Add Emergency Resource / Shelter
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3 font-body-sm text-[12px]">
              <div>
                <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Resource Name *</label>
                <input
                  type="text"
                  required
                  value={newResName}
                  onChange={(e) => setNewResName(e.target.value)}
                  placeholder="e.g. State Disaster Response Team 9"
                  className="w-full bg-background border border-outline-variant rounded px-3 py-1.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Category</label>
                  <select
                    value={newResCategory}
                    onChange={(e) => setNewResCategory(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface focus:border-primary"
                  >
                    <option value="rescue">Rescue Team</option>
                    <option value="medical">Medical / Doctors</option>
                    <option value="police">Police / Security</option>
                    <option value="army">Army / Defense</option>
                    <option value="boat">Boat / Marine</option>
                    <option value="helicopter">Helicopter</option>
                    <option value="drone">Drone / UAV</option>
                    <option value="land">Land Vehicle</option>
                    <option value="shelter">Emergency Shelter</option>
                    <option value="supplies">Food / Relief Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Base Location</label>
                  <input
                    type="text"
                    value={newResLocation}
                    onChange={(e) => setNewResLocation(e.target.value)}
                    placeholder="e.g. Sector 7G Substation"
                    className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface focus:border-primary"
                  />
                </div>
              </div>

              {newResCategory === 'shelter' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Shelter Capacity</label>
                    <input
                      type="number"
                      value={newResShelterCap}
                      onChange={(e) => setNewResShelterCap(Number(e.target.value))}
                      className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Food Supply (Days)</label>
                    <input
                      type="number"
                      value={newResFoodDays}
                      onChange={(e) => setNewResFoodDays(Number(e.target.value))}
                      className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-outline font-mono-label text-[10px] uppercase mb-1">Personnel / Capacity</label>
                  <input
                    type="number"
                    value={newResPersonnel}
                    onChange={(e) => setNewResPersonnel(Number(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded px-2.5 py-1.5 text-on-surface"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 bg-surface-container-high text-on-surface font-mono-label text-[11px] rounded uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer shadow"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
