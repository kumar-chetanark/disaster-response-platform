'use client'

import React, { useState } from 'react'
import { IncidentCategory, CitizenReportSubmission } from '../../types'

interface CitizenLandingPageProps {
  onReportSubmitted: (report: CitizenReportSubmission) => void
  onNavigateToAuthorityLogin: () => void
}

export default function CitizenLandingPage({
  onReportSubmitted,
  onNavigateToAuthorityLogin,
}: CitizenLandingPageProps) {
  const [whatHappened, setWhatHappened] = useState('')
  const [category, setCategory] = useState<IncidentCategory>('Flood')
  const [location, setLocation] = useState('')
  const [affectedPeople, setAffectedPeople] = useState('')
  const [isImmediateDanger, setIsImmediateDanger] = useState(false)
  const [isPeopleTrapped, setIsPeopleTrapped] = useState(false)
  const [description, setDescription] = useState('')
  const [citizenContact, setCitizenContact] = useState('')
  
  const [submittedReport, setSubmittedReport] = useState<CitizenReportSubmission | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatHappened.trim() || !location.trim()) return

    const submission: CitizenReportSubmission = {
      id: `CIT-${Math.floor(100000 + Math.random() * 900000)}`,
      whatHappened,
      category,
      location,
      affectedPeople,
      isImmediateDanger,
      isPeopleTrapped,
      description,
      citizenContact,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    onReportSubmitted(submission)
    setSubmittedReport(submission)
  }

  const handleReset = () => {
    setSubmittedReport(null)
    setWhatHappened('')
    setLocation('')
    setAffectedPeople('')
    setDescription('')
    setCitizenContact('')
    setIsImmediateDanger(false)
    setIsPeopleTrapped(false)
  }

  return (
    <div className="min-h-screen w-full bg-background text-on-background flex flex-col font-body-base">
      {/* Top Citizen Header - Full Width */}
      <header className="w-full h-header-height bg-surface-container border-b border-outline-variant px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-surface shadow">
            <span className="material-symbols-outlined text-[18px]">emergency</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-[15px] font-bold text-on-surface leading-tight">
              Emergency Response Portal
            </h1>
            <span className="font-mono-label text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Public Disaster Intake Gateway Active
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToAuthorityLogin}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-highest hover:bg-surface-bright text-primary border border-outline-variant rounded font-mono-label text-[11px] font-semibold transition-colors uppercase tracking-wider cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">shield_person</span>
          Authority Access →
        </button>
      </header>

      {/* Main Content Area - Perfectly Centered Horizontally and Vertically */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
          {submittedReport ? (
            /* Confirmation State (Calm, Informative, No Internal AI/Authority internals exposed) */
            <div className="bg-surface-container border border-emerald-500/40 rounded-lg p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-[20px] font-bold text-on-surface">
                    Your Emergency Report Has Been Received
                  </h2>
                  <p className="font-body-sm text-[13px] text-on-surface-variant">
                    Emergency coordination authorities have been notified and will verify the situation for resource deployment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface p-4 rounded border border-outline-variant">
                <div>
                  <span className="text-[10px] font-mono-label text-on-surface-variant uppercase block mb-0.5">
                    Report Reference ID
                  </span>
                  <span className="font-mono-label text-[15px] font-bold text-primary">
                    {submittedReport.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono-label text-on-surface-variant uppercase block mb-0.5">
                    Submission Time
                  </span>
                  <span className="font-mono-label text-[14px] text-on-surface">
                    {submittedReport.submittedAt}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono-label text-on-surface-variant uppercase block mb-0.5">
                    Status
                  </span>
                  <span className="font-mono-label text-[12px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 inline-block font-bold">
                    TRANSMITTED TO COMMAND
                  </span>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low rounded border border-outline-variant text-[12px] text-on-surface-variant space-y-1">
                <div className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  Safety Guidance while awaiting emergency response:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-outline">
                  <li>If water is rising, move to higher ground or upper structural floors immediately.</li>
                  <li>Avoid walking or driving through moving floodwaters or near downed electrical lines.</li>
                  <li>Keep phone lines open for official emergency contact if you provided a phone number.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant font-mono-label text-[11px] rounded uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          ) : (
            /* Citizen Emergency Report Form */
            <div className="bg-surface-container border border-outline-variant rounded-lg p-5 sm:p-7 shadow-xl space-y-6">
              <div className="border-b border-outline-variant pb-4 text-left">
                <span className="bg-error/20 text-error font-mono-label text-[10px] font-bold px-2 py-0.5 rounded border border-error/30 uppercase tracking-wider">
                  Public Disaster Report
                </span>
                <h2 className="font-headline-md text-[20px] font-bold text-on-surface mt-1.5">
                  Report an Emergency or Hazard
                </h2>
                <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                  Provide essential details to alert response command authorities. No account required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* What happened */}
                <div className="space-y-1.5">
                  <label className="block font-body-sm text-[12px] font-medium text-on-surface">
                    What happened? <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash flood submerging residential street, building collapse, blocked road"
                    value={whatHappened}
                    onChange={(e) => setWhatHappened(e.target.value)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                {/* Category & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-body-sm text-[12px] font-medium text-on-surface">
                      Incident Category <span className="text-error">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-body-sm text-[13px] rounded px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    >
                      <option value="Flood">Flood</option>
                      <option value="Cyclone">Cyclone</option>
                      <option value="Fire">Fire</option>
                      <option value="Landslide">Landslide</option>
                      <option value="Building damage">Building damage</option>
                      <option value="Road blockage">Road blockage</option>
                      <option value="Medical emergency">Medical emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-body-sm text-[12px] font-medium text-on-surface">
                      Location / Landmark <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Near Sector 7G bridge, East Coast Road"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Urgency & Trapped People Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                      isImmediateDanger
                        ? 'border-error bg-error/15 text-error font-medium'
                        : 'border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isImmediateDanger}
                      onChange={(e) => setIsImmediateDanger(e.target.checked)}
                      className="w-4 h-4 rounded text-error border-outline-variant focus:ring-error"
                    />
                    <div className="text-[12px]">
                      <div className="font-semibold text-on-surface">Immediate Danger to Life?</div>
                      <div className="text-[10px] text-outline">Active fire, fast rising water, structural collapse</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                      isPeopleTrapped
                        ? 'border-tertiary bg-tertiary/15 text-tertiary font-medium'
                        : 'border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isPeopleTrapped}
                      onChange={(e) => setIsPeopleTrapped(e.target.checked)}
                      className="w-4 h-4 rounded text-tertiary border-outline-variant focus:ring-tertiary"
                    />
                    <div className="text-[12px]">
                      <div className="font-semibold text-on-surface">People Trapped / Stranded?</div>
                      <div className="text-[10px] text-outline">Rooftops, surrounded by water, or confined</div>
                    </div>
                  </label>
                </div>

                {/* Estimated People Count & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-body-sm text-[12px] font-medium text-on-surface">
                      Number of people affected / present (if known)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ~15 people, 4 families"
                      value={affectedPeople}
                      onChange={(e) => setAffectedPeople(e.target.value)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-body-sm text-[12px] font-medium text-on-surface">
                      Your Contact Phone / Radio (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={citizenContact}
                      onChange={(e) => setCitizenContact(e.target.value)}
                      className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block font-body-sm text-[12px] font-medium text-on-surface">
                    Detailed Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe access conditions, water height, visible landmarks, or specific medical needs..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="text-[11px] font-mono-label text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Confidential emergency dispatch line
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[12px] font-bold rounded shadow transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Submit Emergency Report
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="w-full py-3 px-6 bg-surface-container-lowest border-t border-outline-variant text-center text-outline text-[11px] font-mono-label shrink-0">
        Disaster Response Platform • Public Emergency Intake Portal • 24/7 Monitoring
      </footer>
    </div>
  )
}
