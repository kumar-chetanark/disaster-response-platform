'use client'

import React, { useState } from 'react'
import { MissionType, AerialAssessmentSubmission, AerialAsset } from '../../types'

interface AerialAssessmentFormProps {
  initialIncidentTitle?: string
  initialAsset?: AerialAsset | null
  onSubmit: (data: AerialAssessmentSubmission) => void
  onBackToDashboard: () => void
}

export default function AerialAssessmentForm({
  initialIncidentTitle = 'Cyclone Alpha 4',
  initialAsset,
  onSubmit,
  onBackToDashboard,
}: AerialAssessmentFormProps) {
  // Form State
  const [missionId] = useState('SCAN-44A')
  const [missionType, setMissionType] = useState<MissionType>('Area Scan / Survey')
  const [assessmentTime, setAssessmentTime] = useState('14:30')
  const [weatherCondition, setWeatherCondition] = useState('Coastal Gale (35kt), Heavy Rain')
  const [areaSurveyed, setAreaSurveyed] = useState('Sector 4 / Coastal')
  
  const [hazards, setHazards] = useState<string[]>([
    'Flooding',
    'Downed Power Lines',
    'Debris'
  ])
  
  const [structuresAffected, setStructuresAffected] = useState<number>(2)
  const [roadAccessibility, setRoadAccessibility] = useState('3 roads blocked')
  const [peopleObserved, setPeopleObserved] = useState('~15 in isolated pockets')
  
  const [recommendedResources, setRecommendedResources] = useState(
    'Water rescue teams (Swiftwater), Heavy debris removal equipment (Dozer), Portable lighting.'
  )
  const [evacuationStatus, setEvacuationStatus] = useState<'Routes Clear' | 'Compromised'>('Compromised')
  
  const [mediaFiles, setMediaFiles] = useState<string[]>([
    'aerial_scan_01.jpg',
    'thermal_infrared_02.png'
  ])
  
  const [operatorObservations, setOperatorObservations] = useState(
    'Extensive coastal surge damage observed. Primary access bridge on Route 9 appears structurally compromised. Need engineering assessment before committing heavy ground vehicles.'
  )
  const [confidenceScore, setConfidenceScore] = useState<number>(91)
  const [draftSaved, setDraftSaved] = useState(false)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submission: AerialAssessmentSubmission = {
      id: missionId,
      relatedIncidentId: 'inc-a',
      relatedIncidentTitle: initialIncidentTitle,
      assetId: initialAsset?.id || 'drone-1',
      assetName: initialAsset?.name || 'Drone Alpha',
      missionType,
      assessmentTime,
      weatherCondition,
      areaSurveyed,
      hazardsDetected: hazards,
      structuresAffected,
      roadAccessibility,
      peopleObserved,
      recommendedResources,
      evacuationStatus,
      mediaFiles,
      operatorObservations,
      confidenceScore,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    onSubmit(submission)
  }

  return (
    <div className="flex-1 bg-background min-h-screen pb-32">
      {/* Top App Bar equivalent for Form Context */}
      <header className="h-header-height sticky top-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-container-padding z-30">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-2 -ml-2 rounded-lg hover:bg-surface-container-high flex items-center"
            title="Return to Command Dashboard"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
              Aerial Mission Assessment
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono-label text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                ID: {missionId}
              </span>
              <span className="text-outline-variant text-[11px]">|</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Asset: <span className="text-primary font-medium">{initialAsset?.name || 'Drone Alpha'}</span>
              </span>
              <span className="text-outline-variant text-[11px]">|</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Related Incident: <span className="text-on-surface font-medium">{initialIncidentTitle}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant text-[12px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Field Link Active
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-body-sm text-[12px] font-medium rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            {draftSaved ? 'Draft Saved!' : 'Save Draft'}
          </button>
        </div>
      </header>

      {/* Form Canvas */}
      <div className="max-w-4xl mx-auto p-container-padding pt-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Mission Metadata */}
          <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-6 py-3.5 border-b border-outline-variant flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <h3 className="font-headline-sm text-[15px] font-semibold text-on-surface">
                1. Mission Metadata
              </h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Mission Type
                </label>
                <div className="relative">
                  <select
                    value={missionType}
                    onChange={(e) => setMissionType(e.target.value as MissionType)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors"
                  >
                    <option value="Area Scan / Survey">Area Scan / Survey</option>
                    <option value="Damage Assessment">Damage Assessment</option>
                    <option value="Search & Rescue Support">Search &amp; Rescue Support</option>
                    <option value="Resource Delivery">Resource Delivery</option>
                    <option value="Evacuation / Route Assessment">Evacuation / Route Assessment</option>
                    <option value="Communication / Observation">Communication / Observation</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Time of Assessment (ZULU)
                </label>
                <input
                  type="time"
                  value={assessmentTime}
                  onChange={(e) => setAssessmentTime(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Weather Conditions
                </label>
                <input
                  type="text"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  placeholder="e.g. Gale winds, clear, etc."
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Spatial Data */}
          <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-6 py-3.5 border-b border-outline-variant flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">my_location</span>
              <h3 className="font-headline-sm text-[15px] font-semibold text-on-surface">
                2. Spatial Data &amp; Hazards
              </h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Area Surveyed
                </label>
                <input
                  type="text"
                  value={areaSurveyed}
                  onChange={(e) => setAreaSurveyed(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors text-[12px] font-body-sm ${
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
          </section>

          {/* Section 3: Impact Analysis */}
          <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-6 py-3.5 border-b border-outline-variant flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
              <h3 className="font-headline-sm text-[15px] font-semibold text-on-surface">
                3. Impact Analysis
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                    Structures Affected
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant material-symbols-outlined text-[18px]">
                      home_work
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={structuresAffected}
                      onChange={(e) => setStructuresAffected(Number(e.target.value))}
                      className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded pl-9 pr-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                    Roads / Accessibility
                  </label>
                  <div className="relative">
                    <select
                      value={roadAccessibility}
                      onChange={(e) => setRoadAccessibility(e.target.value)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors"
                    >
                      <option value="Clear">Clear</option>
                      <option value="Partially Blocked">Partially Blocked</option>
                      <option value="3 roads blocked">3 roads blocked</option>
                      <option value="Impassable">Impassable (Air Access Only)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                    People Observed (Trapped/Isolated)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant material-symbols-outlined text-[18px]">
                      group
                    </span>
                    <input
                      type="text"
                      value={peopleObserved}
                      onChange={(e) => setPeopleObserved(e.target.value)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded pl-9 pr-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Visualization / Spatial Canvas */}
              <div className="w-full h-44 bg-surface-container-lowest rounded border border-outline-variant overflow-hidden relative map-grid flex items-center justify-center">
                {/* SVG Coastline & Telemetry Markers */}
                <svg
                  viewBox="0 0 600 180"
                  className="w-full h-full object-cover opacity-50 text-outline"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M 0,110 Q 120,80 200,120 T 400,90 T 600,130 L 600,180 L 0,180 Z" fill="#131b2e" />
                  <path d="M 0,110 Q 120,80 200,120 T 400,90 T 600,130" stroke="#38bdf8" strokeDasharray="4 4" />
                </svg>

                {/* Drone Flight Path Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="120" y1="50" x2="320" y2="90" stroke="#adc6ff" strokeWidth="2" strokeDasharray="5 3" />
                  <circle cx="320" cy="90" r="5" fill="#adc6ff" className="animate-ping" />
                  <circle cx="320" cy="90" r="4" fill="#adc6ff" />
                </svg>

                {/* Road block pins */}
                <div className="absolute top-[45%] left-[22%] flex items-center gap-1 bg-error/90 border border-error px-2 py-0.5 rounded text-[10px] font-mono-label text-white shadow-md">
                  <span className="material-symbols-outlined text-[12px]">block</span>
                  Route 9 Blocked
                </div>

                <div className="absolute top-[60%] left-[55%] flex items-center gap-1 bg-tertiary-container/90 border border-tertiary px-2 py-0.5 rounded text-[10px] font-mono-label text-white shadow-md">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  ~15 Trapped (Sector 4)
                </div>

                <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono-label text-on-surface-variant border border-outline-variant">
                  LAT 29.7604° N / LON 95.3698° W • ALT 120m
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Resource Needs & Evacuation */}
          <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-6 py-3.5 border-b border-outline-variant flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
              <h3 className="font-headline-sm text-[15px] font-semibold text-on-surface">
                4. Field Resource Requirements &amp; Route Status
              </h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Recommended Resources
                </label>
                <textarea
                  rows={3}
                  value={recommendedResources}
                  onChange={(e) => setRecommendedResources(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline resize-none"
                  placeholder="Enter resource requirements..."
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Evacuation Route Status
                </label>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setEvacuationStatus('Routes Clear')}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded border transition-colors ${
                      evacuationStatus === 'Routes Clear'
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-outline-variant bg-background hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        evacuationStatus === 'Routes Clear'
                          ? 'border-emerald-500 bg-emerald-500 text-black'
                          : 'border-outline-variant'
                      }`}
                    >
                      {evacuationStatus === 'Routes Clear' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </span>
                    <div>
                      <div className="font-body-base text-[13px] text-on-surface font-medium">Routes Clear</div>
                      <div className="font-body-sm text-[11px] text-on-surface-variant">Primary and secondary paths accessible.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvacuationStatus('Compromised')}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded border transition-colors ${
                      evacuationStatus === 'Compromised'
                        ? 'border-error/60 bg-error/15'
                        : 'border-outline-variant bg-background hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        evacuationStatus === 'Compromised'
                          ? 'border-error bg-error'
                          : 'border-outline-variant'
                      }`}
                    >
                      {evacuationStatus === 'Compromised' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </span>
                    <div>
                      <div className="font-body-base text-[13px] text-error font-semibold">Compromised (Road Blocked)</div>
                      <div className="font-body-sm text-[11px] text-error/80">Air or specialized water extraction required.</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Media & Operator Notes */}
          <section className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-6 py-3.5 border-b border-outline-variant flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">perm_media</span>
              <h3 className="font-headline-sm text-[15px] font-semibold text-on-surface">
                5. Media &amp; Operator Observations
              </h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Attached Aerial Telemetry / Imagery
                </label>
                
                {/* Upload box */}
                <div className="w-full h-24 border-2 border-dashed border-outline-variant rounded bg-background flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-[24px] mb-1 group-hover:-translate-y-0.5 transition-transform">
                    cloud_upload
                  </span>
                  <span className="font-body-sm text-[12px]">Click to attach additional reconnaissance imagery</span>
                  <span className="text-[10px] text-outline-variant">GeoTIFF, JPG, PNG up to 50MB</span>
                </div>

                {/* Attached files list */}
                <div className="space-y-1.5">
                  {mediaFiles.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-2 rounded bg-surface-container border border-outline-variant"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">image</span>
                        <span className="font-body-sm text-[12px] text-on-surface truncate">{file}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(file)}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-[12px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Operator Field Observations
                </label>
                <textarea
                  rows={5}
                  value={operatorObservations}
                  onChange={(e) => setOperatorObservations(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline resize-none"
                  placeholder="Additional field notes..."
                />
              </div>
            </div>
          </section>

          {/* Form Action Submit / Slider Section */}
          <div className="pt-2">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full max-w-sm space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-body-sm text-[12px] text-on-surface-variant font-medium">
                    Assessment Confidence Score
                  </label>
                  <span className="font-mono-label text-[13px] text-emerald-400 font-bold">
                    {confidenceScore}%
                  </span>
                </div>
                <div className="relative w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full"
                    style={{ width: `${confidenceScore}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceScore}
                    onChange={(e) => setConfidenceScore(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="px-5 py-2 text-on-surface-variant font-body-sm font-medium hover:text-on-surface transition-colors rounded border border-outline-variant"
                >
                  Discard &amp; Return
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[12px] font-bold rounded shadow transition-all flex items-center gap-2 uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  SUBMIT TO COMMAND
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
