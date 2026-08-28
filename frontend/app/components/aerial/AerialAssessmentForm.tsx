'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MissionType, AssessmentMode, AssessmentSubmission, AerialAsset, Incident } from '../../types'
import { platformDataService } from '../../services/dataService'

interface AssessmentFormProps {
  initialIncidentTitle?: string
  initialIncidentId?: string | null
  initialAsset?: AerialAsset | null
  incidents?: Incident[]
  onSubmit: (data: AssessmentSubmission) => void
  onBackToDashboard: () => void
}

export default function AssessmentForm({
  initialIncidentTitle,
  initialIncidentId,
  initialAsset,
  incidents: providedIncidents = [],
  onSubmit,
  onBackToDashboard,
}: AssessmentFormProps) {
  // Real Incidents List for incident picker dropdown
  const [incidentsList, setIncidentsList] = useState<Incident[]>(providedIncidents)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIncidentId || '')

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)

  // Form State
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('Aerial — Drone')
  const [missionId] = useState(`ASSESS-${Math.floor(1000 + Math.random() * 9000)}`)
  const [missionType, setMissionType] = useState<MissionType>('Area Scan / Survey')
  const [assessmentTime, setAssessmentTime] = useState('12:00')
  const [weatherCondition, setWeatherCondition] = useState('Clear, Good Visibility')
  const [areaSurveyed, setAreaSurveyed] = useState('')
  
  const [hazards, setHazards] = useState<string[]>([])
  const [structuresAffected, setStructuresAffected] = useState<string>('')
  const [roadAccessibility, setRoadAccessibility] = useState('Clear')
  const [peopleObserved, setPeopleObserved] = useState('')
  
  const [recommendedResources, setRecommendedResources] = useState('')
  const [evacuationStatus, setEvacuationStatus] = useState<'Routes Clear' | 'Compromised'>('Routes Clear')
  
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [operatorObservations, setOperatorObservations] = useState('')
  const [confidenceScore, setConfidenceScore] = useState<number>(90)
  const [draftSaved, setDraftSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } else {
      setIncidentsList(providedIncidents)
      if (!selectedIncidentId && providedIncidents.length > 0) {
        setSelectedIncidentId(providedIncidents[0].id)
      }
    }
  }, [providedIncidents])

  // Sync selected incident metadata to form fields
  const currentIncident = incidentsList.find((i) => i.id === selectedIncidentId) || incidentsList[0] || null

  useEffect(() => {
    if (currentIncident) {
      setAreaSurveyed(currentIncident.location || currentIncident.sector || 'Target Disaster Sector')
      setWeatherCondition(currentIncident.category === 'Flood' ? 'Heavy Rain, Low Visibility' : 'Clear, Moderate Wind')
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
        const lat = currentIncident?.latitude || 28.5355
        const lon = currentIncident?.longitude || 77.3910

        const map = L.map(mapContainerRef.current, {
          center: [lat, lon],
          zoom: 13,
          zoomControl: false,
          attributionControl: false,
        })

        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 19,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
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

      const lat = currentIncident.latitude || 28.5355
      const lon = currentIncident.longitude || 77.3910
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
            ${currentIncident.severity} ASSESSMENT TARGET
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
      mapInstanceRef.current.invalidateSize()
    })
  }, [isLeafletReady, selectedIncidentId, currentIncident])

  const toggleHazard = (hazard: string) => {
    setHazards((prev) =>
      prev.includes(hazard) ? prev.filter((h) => h !== hazard) : [...prev, hazard]
    )
  }

  const handleSaveDraft = () => {
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 3000)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const targetInc = currentIncident || (incidentsList.length > 0 ? incidentsList[0] : null)

    const submission: AssessmentSubmission = {
      id: missionId,
      relatedIncidentId: targetInc?.id || 'inc-1',
      relatedIncidentTitle: targetInc?.title || 'Incident',
      assessmentMode,
      assetId: initialAsset?.id || 'field-team-1',
      assetName: initialAsset?.name || 'Field Assessment Unit',
      missionType,
      assessmentTime,
      weatherCondition,
      areaSurveyed,
      hazardsDetected: hazards,
      structuresAffected: structuresAffected === '' ? 0 : Number(structuresAffected),
      roadAccessibility,
      peopleObserved,
      recommendedResources: recommendedResources || '',
      evacuationStatus,
      mediaFiles,
      operatorObservations,
      confidenceScore,
      submittedAt: new Date().toISOString(),
    }

    try {
      await onSubmit(submission)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 scrollbar-thin">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-outline-variant/80 bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 sm:p-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded-lg transition-colors cursor-pointer shrink-0"
            title="Return to Incident Console"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline-md text-[16px] sm:text-[19px] md:text-[20px] font-bold text-on-surface truncate">
                Field Assessment
              </h1>
              <span className="font-mono-label text-[10px] bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                {missionId}
              </span>
            </div>
            <p className="font-body-sm text-[11px] sm:text-[12px] text-on-surface-variant mt-0.5 leading-snug">
              Multi-mode field verification feeding central incident scoring and automated allocation.
            </p>
          </div>
        </div>

        {/* Dynamic Incident Picker Dropdown */}
        <div className="flex items-center gap-2 bg-surface-container px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-outline-variant w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          <label className="font-mono-label text-[10px] sm:text-[11px] text-on-surface-variant font-bold uppercase shrink-0">
            Target Incident:
          </label>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-background border border-primary/40 text-on-surface font-mono-label text-[11px] sm:text-[12px] rounded px-2 sm:px-2.5 py-1 focus:ring-1 focus:ring-primary cursor-pointer max-w-[200px] sm:max-w-xs truncate font-bold"
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

      <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
        {/* Section 1: Assessment Modality & Mission Parameters */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 overflow-hidden shadow-xs">
          <div className="bg-surface-container px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-outline-variant flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">satellite_alt</span>
              <h3 className="font-headline-sm text-[13px] sm:text-[14px] font-bold text-on-surface">
                1. Assessment Modality &amp; Parameters
              </h3>
            </div>
            <span className="font-mono-label text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/40 px-2 sm:px-2.5 py-0.5 rounded border border-emerald-500/30 font-bold truncate max-w-[240px]">
              TARGET: {currentIncident?.title || 'Active Incident'}
            </span>
          </div>

          <div className="p-3.5 sm:p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Assessment Modality
              </label>
              <select
                value={assessmentMode}
                onChange={(e) => setAssessmentMode(e.target.value as AssessmentMode)}
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary cursor-pointer"
              >
                <option value="Aerial — Drone">Drone / UAV Reconnaissance</option>
                <option value="Aerial — Helicopter">Helicopter Aerial Survey</option>
                <option value="Land Team / Vehicle">Ground Team / 4x4 Survey Unit</option>
                <option value="Water / Boat Team">Water / Rescue Boat Survey</option>
              </select>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Objective
              </label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value as MissionType)}
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary cursor-pointer"
              >
                <option value="Area Scan / Survey">1. Area Scan &amp; Damage Mapping</option>
                <option value="Damage Assessment">2. Structural &amp; Infrastructure Assessment</option>
                <option value="Search & Rescue Support">3. Search &amp; Rescue Triage Support</option>
                <option value="Resource Delivery">4. Supply Drop / Emergency Delivery</option>
                <option value="Evacuation / Route Assessment">5. Evacuation Corridor Assessment</option>
                <option value="Communication / Observation">6. Comms / Relay Observation</option>
              </select>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Assessment Time
              </label>
              <input
                type="time"
                value={assessmentTime}
                onChange={(e) => setAssessmentTime(e.target.value)}
                className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Weather &amp; Ground Conditions
              </label>
              <input
                type="text"
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                placeholder="e.g. Overcast, 15kt wind"
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Spatial Data & Interactive Leaflet Map */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 overflow-hidden shadow-xs">
          <div className="bg-surface-container px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-outline-variant flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">map</span>
              <h3 className="font-headline-sm text-[13px] sm:text-[14px] font-bold text-on-surface">
                2. Sector Geospatial Coordinates &amp; Recon Map
              </h3>
            </div>
            <span className="font-mono-label text-[9px] sm:text-[10px] text-outline">
              LAT: {currentIncident?.latitude?.toFixed(4) || '29.7604'}, LON: {currentIncident?.longitude?.toFixed(4) || '-95.3698'}
            </span>
          </div>

          <div className="p-3.5 sm:p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div
                ref={mapContainerRef}
                className="h-[240px] sm:h-[300px] md:h-[340px] w-full rounded-xl overflow-hidden border border-outline-variant relative shadow-inner z-0"
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Area Surveyed / Sector
                </label>
                <input
                  type="text"
                  value={areaSurveyed}
                  onChange={(e) => setAreaSurveyed(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary"
                />
              </div>

              {/* Hazards Multi-Select Chips */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Identified Hazard Vectors
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Submerged Roads', 'Downed Powerlines', 'Structural Collapse', 'Hazardous Materials', 'Active Fire Perimeter', 'Severe Mudslide'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHazard(h)}
                      className={`px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono-label transition-colors cursor-pointer border ${
                        hazards.includes(h)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold'
                          : 'bg-background text-on-surface-variant border-outline-variant hover:border-outline'
                      }`}
                    >
                      {hazards.includes(h) ? `✓ ${h}` : `+ ${h}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Assessment Confidence
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={confidenceScore}
                    onChange={(e) => setConfidenceScore(Number(e.target.value))}
                    className="flex-1 accent-primary cursor-pointer"
                  />
                  <span className="font-mono-label text-[11px] sm:text-[12px] font-bold text-primary w-10 text-right">
                    {confidenceScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Ground Impact & Infrastructure Findings */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 overflow-hidden shadow-xs">
          <div className="bg-surface-container px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-outline-variant flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
              <h3 className="font-headline-sm text-[13px] sm:text-[14px] font-bold text-on-surface">
                3. Ground Impact &amp; Accessibility Findings
              </h3>
            </div>
            <span className="font-mono-label text-[9px] sm:text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Modality: {assessmentMode}
            </span>
          </div>

          <div className="p-3.5 sm:p-5 md:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Structure Damaged */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Structures Damaged
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">home_work</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 12"
                    value={structuresAffected}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^[0-9]+$/.test(val)) {
                        setStructuresAffected(val)
                      }
                    }}
                    className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary"
                  />
                </div>
              </div>

              {/* Roads / Accessibility */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  Roads &amp; Evacuation Access
                </label>
                <select
                  value={roadAccessibility}
                  onChange={(e) => setRoadAccessibility(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary cursor-pointer"
                >
                  <option value="Clear">Clear Access</option>
                  <option value="Partially Blocked">Partially Blocked</option>
                  <option value="Multiple Roads Blocked">Multiple Roads Blocked</option>
                  <option value="Impassable">Impassable (Boat / Helicopter Access Only)</option>
                </select>
              </div>

              {/* People Observed */}
              <div className="space-y-1 sm:space-y-1.5 sm:col-span-2 md:col-span-1">
                <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                  People Observed / Trapped
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">group</span>
                  </div>
                  <input
                    type="text"
                    value={peopleObserved}
                    onChange={(e) => setPeopleObserved(e.target.value)}
                    placeholder="e.g. 10 trapped on roof"
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Observations & Tactical Recommendations */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 overflow-hidden shadow-xs">
          <div className="bg-surface-container px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">assignment</span>
            <h3 className="font-headline-sm text-[13px] sm:text-[14px] font-bold text-on-surface">
              4. Recon Observations &amp; Resource Recommendations
            </h3>
          </div>

          <div className="p-3.5 sm:p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Recommended Resources &amp; Equipment
              </label>
              <textarea
                rows={3}
                value={recommendedResources}
                onChange={(e) => setRecommendedResources(e.target.value)}
                placeholder="e.g. Water rescue squad with inflatable boats, dewatering pumps, trauma field kit."
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block font-mono-label text-[10px] text-on-surface-variant font-bold uppercase">
                Operator Field Observations
              </label>
              <textarea
                rows={3}
                value={operatorObservations}
                onChange={(e) => setOperatorObservations(e.target.value)}
                placeholder="Enter direct observations regarding flood surge, route bottlenecks, building stability..."
                className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] sm:text-[13px] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 focus:border-primary resize-none"
              />
            </div>
          </div>
        </section>

        {/* Bottom Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded-lg uppercase cursor-pointer transition-colors text-center"
          >
            {draftSaved ? 'Draft Saved ✓' : 'Save Draft'}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[12px] font-bold rounded-lg uppercase cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>{isSubmitting ? 'Integrating Assessment...' : 'Submit Assessment & Verify Incident'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
