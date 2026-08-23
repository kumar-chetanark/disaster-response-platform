'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MissionType, AssessmentMode, AssessmentSubmission, AerialAsset, Incident } from '../../types'
import { platformDataService } from '../../services/dataService'

interface AssessmentFormProps {
  initialIncidentTitle?: string
  initialAsset?: AerialAsset | null
  incidents?: Incident[]
  onSubmit: (data: AssessmentSubmission) => void
  onBackToDashboard: () => void
}

export default function AssessmentForm({
  initialIncidentTitle,
  initialAsset,
  incidents: providedIncidents = [],
  onSubmit,
  onBackToDashboard,
}: AssessmentFormProps) {
  // Real Incidents List for incident picker dropdown
  const [incidentsList, setIncidentsList] = useState<Incident[]>(providedIncidents)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('')

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)

  // Form State
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('Aerial — Drone')
  const [missionId] = useState(`RECON-${Math.floor(1000 + Math.random() * 9000)}`)
  const [missionType, setMissionType] = useState<MissionType>('Area Scan / Survey')
  const [assessmentTime, setAssessmentTime] = useState('12:00')
  const [weatherCondition, setWeatherCondition] = useState('')
  const [areaSurveyed, setAreaSurveyed] = useState('')
  
  const [hazards, setHazards] = useState<string[]>([])
  const [structuresAffected, setStructuresAffected] = useState<number>(0)
  const [roadAccessibility, setRoadAccessibility] = useState('Clear')
  const [peopleObserved, setPeopleObserved] = useState('')
  
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [commsStatus, setCommsStatus] = useState('')
  const [evacRouteRisk, setEvacRouteRisk] = useState('Low')
  
  const [recommendedResources, setRecommendedResources] = useState('')
  const [evacuationStatus, setEvacuationStatus] = useState<'Routes Clear' | 'Compromised'>('Routes Clear')
  
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [operatorObservations, setOperatorObservations] = useState('')
  const [confidenceScore, setConfidenceScore] = useState<number>(90)
  const [draftSaved, setDraftSaved] = useState(false)

  // Load Incidents from backend if not provided
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const data = await platformDataService.getIncidents()
        setIncidentsList(data)
        if (data.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(data[0].id)
        }
      } catch (err) {
        console.error('Error fetching incidents for assessment form:', err)
      }
    }
    if (providedIncidents.length === 0) {
      loadIncidents()
    } else if (!selectedIncidentId && providedIncidents.length > 0) {
      setSelectedIncidentId(providedIncidents[0].id)
    }
  }, [providedIncidents])

  // Sync selected incident metadata to form fields
  const currentIncident = incidentsList.find((i) => i.id === selectedIncidentId) || incidentsList[0] || null

  useEffect(() => {
    if (currentIncident) {
      setAreaSurveyed(currentIncident.location || currentIncident.sector || 'Target Disaster Sector')
      setWeatherCondition(currentIncident.category === 'Flood' ? 'Heavy Rain, Low Visibility' : 'Overcast, Moderate Wind')
    }
  }, [selectedIncidentId, currentIncident])

  // Initialize Real Interactive GIS Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return

      if (!mapInstanceRef.current) {
        const lat = currentIncident?.latitude || 29.7604
        const lon = currentIncident?.longitude || -95.3698

        const map = L.map(mapContainerRef.current, {
          center: [lat, lon],
          zoom: 12,
          zoomControl: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)
        const layerGroup = L.layerGroup().addTo(map)
        layerGroupRef.current = layerGroup
        mapInstanceRef.current = map
        setIsLeafletReady(true)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update Map Marker & Shockwave Circle when selected incident changes
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !layerGroupRef.current) return

    import('leaflet').then((L) => {
      const group = layerGroupRef.current
      group.clearLayers()

      if (!currentIncident) return

      const lat = currentIncident.latitude || 29.7604
      const lon = currentIncident.longitude || -95.3698
      const isCritical = currentIncident.severity === 'CRITICAL'
      const color = isCritical ? '#ef4444' : '#f97316'

      // Tactical Recon Survey Circle
      L.circle([lat, lon], {
        radius: 2200,
        fillColor: color,
        fillOpacity: 0.15,
        color: color,
        weight: 1.5,
        dashArray: '4 4',
      }).addTo(group)

      L.circle([lat, lon], {
        radius: 800,
        fillColor: color,
        fillOpacity: 0.35,
        stroke: false,
      }).addTo(group)

      // Tactical Recon Pin
      const customHtml = `
        <div style="width: 28px; height: 28px; background-color: ${color}; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color};">
          <span style="font-size: 11px; font-weight: bold; color: #ffffff;">📍</span>
        </div>
      `
      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-recon-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(group)
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
          <div style="font-size: 10px; font-weight: bold; color: ${color}; text-transform: uppercase;">
            ${currentIncident.severity} RECON TARGET
          </div>
          <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">
            ${currentIncident.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${currentIncident.location || 'Target Sector'}
          </div>
        </div>
      `).openPopup()

      mapInstanceRef.current.setView([lat, lon], 12)
    })
  }, [isLeafletReady, selectedIncidentId, currentIncident])

  const toggleHazard = (hazard: string) => {
    setHazards((prev) =>
      prev.includes(hazard) ? prev.filter((h) => h !== hazard) : [...prev, hazard]
    )
  }

  const removeMediaFile = (fileName: string) => {
    setMediaFiles((prev) => prev.filter((f) => f !== fileName))
  }

  const handleSaveDraft = () => {
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 3000)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submission: AssessmentSubmission = {
      id: missionId,
      relatedIncidentId: currentIncident?.id || 'inc-1',
      relatedIncidentTitle: currentIncident?.title || 'Incident #1',
      assessmentMode,
      assetId: initialAsset?.id || 'asset-uav-9',
      assetName: initialAsset?.name || 'Field UAV Recon Asset',
      missionType,
      assessmentTime,
      weatherCondition,
      areaSurveyed,
      hazardsDetected: hazards,
      structuresAffected,
      roadAccessibility,
      peopleObserved,
      recommendedResources: recommendedResources || '',
      evacuationStatus,
      mediaFiles,
      operatorObservations,
      confidenceScore,
      submittedAt: new Date().toISOString(),
    }

    onSubmit(submission)
  }

  return (
    <div className="flex flex-col gap-6 min-h-screen pb-16 bg-background">
      {/* Top Breadcrumb & Incident Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-[18px] sm:text-[20px] font-bold text-on-surface">
                Field Assessment &amp; Reconnaissance Ingestion
              </h1>
              <span className="font-mono-label text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase">
                {missionId}
              </span>
            </div>
            <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
              Live multi-mode reconnaissance telemetry feeding central incident verification &amp; dynamic allocation.
            </p>
          </div>
        </div>

        {/* Dynamic Incident Picker */}
        <div className="flex items-center gap-2">
          <label className="font-mono-label text-[11px] text-on-surface-variant font-bold uppercase shrink-0">
            Select Incident:
          </label>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-surface-container-high border border-primary text-on-surface font-mono-label text-[12px] rounded px-3 py-1.5 focus:ring-1 focus:ring-primary cursor-pointer max-w-xs truncate"
          >
            {incidentsList.length === 0 ? (
              <option value="">No Active Incidents Available</option>
            ) : (
              incidentsList.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.title} ({inc.severity})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Section 1: Mission Metadata & Assessment Mode */}
        <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden shadow-xs">
          <div className="bg-surface-container-high px-4 sm:px-6 py-3 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              <h3 className="font-headline-sm text-[14px] font-bold text-on-surface">
                1. Mission Metadata &amp; Recon Modality
              </h3>
            </div>
            <span className="font-mono-label text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              TARGET: {currentIncident?.title || 'Incident #1'}
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Assessment Modality
              </label>
              <select
                value={assessmentMode}
                onChange={(e) => setAssessmentMode(e.target.value as AssessmentMode)}
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary cursor-pointer"
              >
                <option value="Aerial — Drone">Aerial  Drone (UAV)</option>
                <option value="Aerial — Helicopter">Aerial  Helicopter</option>
                <option value="Land Team / Vehicle">Land Team / 4x4 Vehicle</option>
                <option value="Water / Boat Team">Water / Rescue Boat Team</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Objective Type
              </label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value as MissionType)}
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary cursor-pointer"
              >
                <option value="Area Scan / Survey">1. Area Scan / Recon</option>
                <option value="Damage Assessment">2. Damage Assessment</option>
                <option value="Search & Rescue Support">3. Search &amp; Rescue Support</option>
                <option value="Resource Delivery">4. Supply Drop / Delivery</option>
                <option value="Evacuation / Route Assessment">5. Evacuation Route Assessment</option>
                <option value="Communication / Observation">6. Comms / Relay Observation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Assessment Time (ZULU)
              </label>
              <input
                type="time"
                value={assessmentTime}
                onChange={(e) => setAssessmentTime(e.target.value)}
                className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Weather &amp; Visibility
              </label>
              <input
                type="text"
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                placeholder="e.g. Overcast, 20kt wind"
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Spatial Data & Real Leaflet GIS Map */}
        <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden shadow-xs">
          <div className="bg-surface-container-high px-4 sm:px-6 py-3 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">map</span>
              <h3 className="font-headline-sm text-[14px] font-bold text-on-surface">
                2. Tactical Spatial Recon Map &amp; Hazards
              </h3>
            </div>
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              Target Lat: {currentIncident?.latitude?.toFixed(4) || '29.7604'}, Lon: {currentIncident?.longitude?.toFixed(4) || '-95.3698'}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Real GIS Leaflet Map for Assessment */}
            <div className="w-full h-64 rounded border border-outline-variant overflow-hidden relative shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full bg-surface-container-lowest" />
              <div className="absolute top-2 left-2 z-400 bg-surface/90 border border-outline-variant px-2.5 py-1 rounded backdrop-blur text-[10px] font-mono-label text-on-surface flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>RECON SECTOR: {currentIncident?.location || (incidentsList.length > 0 ? incidentsList[0].location : 'Unassigned Sector')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Area Surveyed / Sector
                </label>
                <input
                  type="text"
                  value={areaSurveyed}
                  onChange={(e) => setAreaSurveyed(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Hazards Detected
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Flooding', color: 'error' },
                    { name: 'Downed Power Lines', color: 'error' },
                    { name: 'Debris', color: 'tertiary' },
                    { name: 'Landslide Risk', color: 'tertiary' },
                  ].map((hazard) => {
                    const isChecked = hazards.includes(hazard.name)
                    return (
                      <button
                        key={hazard.name}
                        type="button"
                        onClick={() => toggleHazard(hazard.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors text-[11px] font-body-sm cursor-pointer ${
                          isChecked
                            ? hazard.color === 'error'
                              ? 'border-error/60 bg-error/15 text-error font-medium'
                              : 'border-tertiary/60 bg-tertiary/15 text-tertiary font-medium'
                            : 'border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isChecked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        {hazard.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Impact Analysis */}
        <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden shadow-xs">
          <div className="bg-surface-container-high px-4 sm:px-6 py-3 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
              <h3 className="font-headline-sm text-[14px] font-bold text-on-surface">
                3. Field Impact Analysis
              </h3>
            </div>
            <span className="font-mono-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Modality: {assessmentMode}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Structure Damaged */}
              <div className="space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Structures Damaged
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-surface-container rounded border border-outline-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">home_work</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={structuresAffected}
                    onChange={(e) => setStructuresAffected(Number(e.target.value))}
                    className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary"
                  />
                </div>
              </div>

              {/* Roads / Accessibility */}
              <div className="space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Roads / Accessibility
                </label>
                <select
                  value={roadAccessibility}
                  onChange={(e) => setRoadAccessibility(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary cursor-pointer"
                >
                  <option value="Clear">Clear</option>
                  <option value="Partially Blocked">Partially Blocked</option>
                  <option value="Multiple Roads Blocked">Multiple Roads Blocked</option>
                  <option value="Impassable">Impassable (Boat / Helicopter Access Only)</option>
                </select>
              </div>

              {/* People Observed */}
              <div className="space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  People Observed / Trapped
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-surface-container rounded border border-outline-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">group</span>
                  </div>
                  <input
                    type="text"
                    value={peopleObserved}
                    onChange={(e) => setPeopleObserved(e.target.value)}
                    placeholder="e.g. 10 trapped on roof"
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Recommended Resources & Notes */}
        <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden shadow-xs">
          <div className="bg-surface-container-high px-4 sm:px-6 py-3 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">assignment</span>
            <h3 className="font-headline-sm text-[14px] font-bold text-on-surface">
              4. Recon Observations &amp; Resource Recommendations
            </h3>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Recommended Resources
              </label>
              <textarea
                rows={3}
                value={recommendedResources}
                onChange={(e) => setRecommendedResources(e.target.value)}
                placeholder="e.g. Water rescue team with inflatable boats, portable dewatering pumps."
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Operator Field Observations
              </label>
              <textarea
                rows={3}
                value={operatorObservations}
                onChange={(e) => setOperatorObservations(e.target.value)}
                placeholder="Enter direct operator notes, access conditions, structural safety..."
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary resize-none"
              />
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded uppercase cursor-pointer transition-colors"
          >
            {draftSaved ? 'Draft Saved ✓' : 'Save Draft'}
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[12px] font-bold rounded uppercase cursor-pointer transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Submit Assessment &amp; Verify Incident</span>
          </button>
        </div>
      </form>
    </div>
  )
}
