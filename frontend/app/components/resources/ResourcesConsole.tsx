'use client'

import React, { useState } from 'react'
import { ResourceUnit, AllocationAdvisory, ResourceStatus, ResourceCategory } from '../../types'
import SearchInput from '../common/SearchInput'

interface ResourcesConsoleProps {
  resources: ResourceUnit[]
  advisories: AllocationAdvisory[]
  onApproveAdvisory: (id: string) => void
  onRejectAdvisory: (id: string) => void
  onModifyAdvisory: (id: string) => void
  onUpdateResourceStatus?: (id: string, newStatus: ResourceStatus) => void
  onAddResource?: (newRes: ResourceUnit) => void
}

export default function ResourcesConsole({
  resources,
  advisories,
  onApproveAdvisory,
  onRejectAdvisory,
  onModifyAdvisory,
  onUpdateResourceStatus,
  onAddResource,
}: ResourcesConsoleProps) {
  // A. Location First Selector
  const [selectedLocation, setSelectedLocation] = useState<string>('Sector 7G / Coastal Basin')
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // C. Manage Resource Inventory Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceUnit | null>(null)
  const [managedStatus, setManagedStatus] = useState<ResourceStatus>('AVAILABLE')

  // Form for adding new resource
  const [newResName, setNewResName] = useState('')
  const [newResCategory, setNewResCategory] = useState<ResourceCategory>('medical')
  const [newResLocation, setNewResLocation] = useState('Sector 7G / Coastal Basin')
  const [newResPersonnel, setNewResPersonnel] = useState(6)
  const [newResDetails, setNewResDetails] = useState('')

  const availableLocations = [
    'Sector 7G / Coastal Basin',
    'Coastal Causeway Km 18',
    'Sector 1 Highland Ridge',
    'Riverfront Sector 2',
    'Civic Arena Shelter District',
    'Regional Airbase',
  ]

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'ALL', label: 'All Assets', icon: 'inventory_2' },
    { id: 'medical', label: 'Medical', icon: 'medical_services' },
    { id: 'police_army', label: 'Police / Army', icon: 'shield' },
    { id: 'rescue', label: 'Rescue Teams', icon: 'groups' },
    { id: 'aerial', label: 'Aerial (Drones/Helis)', icon: 'helicopter' },
    { id: 'water', label: 'Water / Boats', icon: 'directions_boat' },
    { id: 'land', label: 'Land Vehicles', icon: 'local_shipping' },
    { id: 'shelter', label: 'Shelters', icon: 'night_shelter' },
    { id: 'supplies', label: 'Supplies', icon: 'inventory' },
  ]

  const filteredResources = resources.filter((res) => {
    const matchesCat = activeCategory === 'ALL' || res.category === activeCategory
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.equipmentDetails.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleEditResource = (res: ResourceUnit) => {
    setEditingResource(res)
    setManagedStatus(res.status)
    setIsManageModalOpen(true)
  }

  const handleSaveResourceStatus = () => {
    if (editingResource && onUpdateResourceStatus) {
      onUpdateResourceStatus(editingResource.id, managedStatus)
    }
    setIsManageModalOpen(false)
    setEditingResource(null)
  }

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newResName.trim() || !onAddResource) return

    const newUnit: ResourceUnit = {
      id: `res-${newResCategory.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
      name: newResName,
      category: newResCategory,
      status: 'AVAILABLE',
      location: newResLocation,
      personnelCount: newResPersonnel,
      equipmentDetails: newResDetails || 'Standard operational loadout',
    }

    onAddResource(newUnit)
    setNewResName('')
    setNewResDetails('')
    setIsManageModalOpen(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Header / Authority Notice */}
      <div className="px-6 py-3.5 border-b border-outline-variant bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-[15px] font-bold text-on-surface">
              Authority Resource Inventory &amp; Deployment Pool
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Restricted Authority-Only Operations • Physical assets deployed strictly by Authority decision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search resource inventory..."
            className="w-56"
          />

          <button
            type="button"
            onClick={() => {
              setEditingResource(null)
              setIsManageModalOpen(true)
            }}
            className="px-3.5 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase tracking-wider hover:bg-primary-container transition-colors shadow flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Manage Inventory
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
        {/* A. Location First Operational Context Selector */}
        <section className="bg-surface-container-low border border-outline-variant rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[18px]">near_me</span>
            </div>
            <div>
              <span className="text-[10px] font-mono-label text-outline uppercase block">
                Resource Command Location
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-background border border-outline-variant text-on-surface font-body-sm font-semibold text-[13px] rounded px-3 py-1 focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedLocation('Sector 7G / Coastal Basin')}
                  className="px-2 py-1 bg-surface-container hover:bg-surface text-primary border border-outline-variant rounded font-mono-label text-[10px] uppercase cursor-pointer"
                >
                  Use Primary Area
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-on-surface-variant font-mono-label text-[11px]">
            <div>Filtered Units: <span className="text-on-surface font-bold">{filteredResources.length}</span></div>
            <span>•</span>
            <div>Status: <span className="text-emerald-400 font-bold">Operational Ready</span></div>
          </div>
        </section>

        {/* 1. Category Filter Pill Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-label text-[11px] font-semibold transition-colors shrink-0 uppercase tracking-wider cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-primary text-on-primary shadow'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 2. AI Recommended Allocations awaiting Authority Sign-Off */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              <h3 className="font-headline-sm text-[13px] font-bold text-on-surface">
                9-Step Advisory Allocation Queue
              </h3>
            </div>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              AI RECOMMENDS / AUTHORITY DECIDES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {advisories.map((advisory) => {
              const isApproved = advisory.status === 'APPROVED'
              const isRejected = advisory.status === 'REJECTED'

              return (
                <div
                  key={advisory.id}
                  className={`p-3.5 bg-surface border rounded flex flex-col justify-between gap-2.5 ${
                    isApproved
                      ? 'border-emerald-500/50 bg-emerald-950/10'
                      : isRejected
                      ? 'border-error/40 bg-error/5'
                      : 'border-outline-variant'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm font-semibold text-on-surface text-[13px]">
                        {advisory.resourceName}
                      </span>
                      <span
                        className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                          isApproved
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isRejected
                            ? 'bg-error/15 text-error border-error/30'
                            : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                        }`}
                      >
                        {advisory.status}
                      </span>
                    </div>
                    <div className="font-mono-label text-[11px] text-primary">{advisory.details}</div>
                    <div className="font-body-sm text-[11px] text-on-surface-variant">
                      <span className="text-outline font-medium">Target:</span> {advisory.targetIncident}
                    </div>
                    <p className="font-body-sm text-[11px] text-outline pt-0.5">
                      <span className="font-medium text-on-surface-variant">Rationale:</span> {advisory.reason}
                    </p>
                  </div>

                  {!isApproved && !isRejected && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
                      <button
                        type="button"
                        onClick={() => onModifyAdvisory(advisory.id)}
                        className="px-2.5 py-1 font-mono-label text-[10px] border border-outline-variant text-on-surface hover:bg-surface-container rounded uppercase cursor-pointer"
                      >
                        Modify
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectAdvisory(advisory.id)}
                        className="px-2.5 py-1 font-mono-label text-[10px] border border-outline-variant text-error hover:bg-error/10 rounded uppercase cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveAdvisory(advisory.id)}
                        className="px-3 py-1 bg-primary text-on-primary font-mono-label text-[10px] font-bold rounded uppercase hover:bg-primary-container cursor-pointer"
                      >
                        Approve &amp; Dispatch
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. Resource Inventory Grid with Edit Action */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-[13px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">view_list</span>
              Physical Resource Inventory Ledger ({filteredResources.length} assets)
            </h3>
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              Live Readiness Breakdown
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="p-3.5 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between gap-2.5 hover:border-outline transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        {res.category === 'medical'
                          ? 'medical_services'
                          : res.category === 'police_army'
                          ? 'shield'
                          : res.category === 'rescue'
                          ? 'groups'
                          : res.category === 'aerial'
                          ? 'helicopter'
                          : res.category === 'water'
                          ? 'directions_boat'
                          : res.category === 'shelter'
                          ? 'night_shelter'
                          : res.category === 'supplies'
                          ? 'inventory'
                          : 'local_shipping'}
                      </span>
                      <div>
                        <h4 className="font-body-sm font-bold text-[13px] text-on-surface">
                          {res.name}
                        </h4>
                        <span className="font-mono-label text-[10px] text-outline uppercase block">
                          {res.id} • {res.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-mono-label text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold shrink-0 ${
                        res.status === 'AVAILABLE'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          : res.status === 'IN OPERATION' || res.status === 'IN USE'
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                    {res.equipmentDetails}
                  </p>

                  {/* Shelters */}
                  {res.shelterCapacity && (
                    <div className="p-2 bg-surface rounded border border-outline-variant text-[10px] font-mono-label space-y-1">
                      <div className="flex justify-between">
                        <span className="text-outline">Shelter Capacity:</span>
                        <span className="text-on-surface font-bold">{res.shelterOccupied} / {res.shelterCapacity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.round(((res.shelterOccupied || 0) / res.shelterCapacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Supplies */}
                  {res.suppliesFoodDays && (
                    <div className="p-2 bg-surface rounded border border-outline-variant text-[10px] font-mono-label grid grid-cols-3 gap-1 text-center">
                      <div>
                        <span className="text-[8px] text-outline block">Food</span>
                        <span className="text-emerald-400 font-bold">{res.suppliesFoodDays} Days</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-outline block">Medicine</span>
                        <span className="text-primary font-bold">{res.suppliesMedicineCount} Kits</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-outline block">Clothing</span>
                        <span className="text-tertiary font-bold">{res.suppliesClothingCount} Sets</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono-label text-on-surface-variant">
                  <div className="flex items-center gap-1 truncate max-w-[150px]">
                    <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                    <span className="truncate">{res.location}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEditResource(res)}
                    className="px-2 py-0.5 bg-surface hover:bg-surface-container border border-outline-variant rounded text-primary text-[10px] font-mono-label uppercase cursor-pointer"
                  >
                    [Edit]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* C. Resource Management Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-[15px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                {editingResource ? `Edit Resource: ${editingResource.name}` : 'Add New Resource Unit'}
              </h3>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="text-on-surface-variant hover:text-white"
              >
                ✕
              </button>
            </div>

            {editingResource ? (
              <div className="space-y-4 text-left">
                <div className="p-3 bg-surface rounded border border-outline-variant text-[12px] font-mono-label space-y-1">
                  <div>ID: <span className="text-primary font-bold">{editingResource.id}</span></div>
                  <div>Category: <span className="text-on-surface capitalize">{editingResource.category}</span></div>
                  <div>Location: <span className="text-on-surface">{editingResource.location}</span></div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase">
                    Update Operational Status
                  </label>
                  <select
                    value={managedStatus}
                    onChange={(e) => setManagedStatus(e.target.value as ResourceStatus)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[12px] rounded px-3 py-2 cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="RECOMMENDED">RECOMMENDED</option>
                    <option value="ALLOCATED">ALLOCATED</option>
                    <option value="IN OPERATION">IN OPERATION</option>
                    <option value="IN USE">IN USE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(false)}
                    className="px-4 py-1.5 border border-outline-variant text-on-surface font-mono-label text-[11px] rounded uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveResourceStatus}
                    className="px-4 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateResource} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="block font-mono-label text-[10px] text-on-surface-variant uppercase">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swift Evacuation Truck 4"
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-sm text-[12px] rounded px-3 py-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-mono-label text-[10px] text-on-surface-variant uppercase">
                      Category
                    </label>
                    <select
                      value={newResCategory}
                      onChange={(e) => setNewResCategory(e.target.value as ResourceCategory)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 cursor-pointer"
                    >
                      <option value="medical">Medical</option>
                      <option value="police_army">Police / Army</option>
                      <option value="rescue">Rescue</option>
                      <option value="aerial">Aerial</option>
                      <option value="water">Water</option>
                      <option value="land">Land</option>
                      <option value="shelter">Shelter</option>
                      <option value="supplies">Supplies</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono-label text-[10px] text-on-surface-variant uppercase">
                      Personnel Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newResPersonnel}
                      onChange={(e) => setNewResPersonnel(Number(e.target.value))}
                      className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[12px] rounded px-3 py-1.5"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono-label text-[10px] text-on-surface-variant uppercase">
                    Staging Location
                  </label>
                  <select
                    value={newResLocation}
                    onChange={(e) => setNewResLocation(e.target.value)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[11px] rounded px-2.5 py-1.5 cursor-pointer"
                  >
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono-label text-[10px] text-on-surface-variant uppercase">
                    Equipment / Capabilities Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4x4 off-road chassis, winch, 20 passenger capacity"
                    value={newResDetails}
                    onChange={(e) => setNewResDetails(e.target.value)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-sm text-[12px] rounded px-3 py-1.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(false)}
                    className="px-4 py-1.5 border border-outline-variant text-on-surface font-mono-label text-[11px] rounded uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-primary text-on-primary font-mono-label text-[11px] font-bold rounded uppercase shadow"
                  >
                    Add to Inventory
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
