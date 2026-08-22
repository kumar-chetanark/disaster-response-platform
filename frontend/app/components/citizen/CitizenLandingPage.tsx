'use client'

import React, { useState } from 'react'
import { CitizenReportSubmission } from '../../types'

interface CitizenLandingPageProps {
  onReportSubmitted: (submission: CitizenReportSubmission) => Promise<any> | void
  onNavigateToAuthorityLogin: () => void
}

export default function CitizenLandingPage({
  onReportSubmitted,
  onNavigateToAuthorityLogin,
}: CitizenLandingPageProps) {
  // Form State
  const [whatHappened, setWhatHappened] = useState('Flood')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [citizenName, setCitizenName] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [isPeopleTrapped, setIsPeopleTrapped] = useState(false)
  const [isImmediateDanger, setIsImmediateDanger] = useState(false)
  const [affectedPeople, setAffectedPeople] = useState('')
  
  // UI / Network States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedData, setSubmittedData] = useState<{
    reportId: string
    incidentId: string
    incidentTitle?: string
    isNewIncident?: boolean
    status?: string
    time: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setErrorMessage(null)

    // Validation
    if (!location.trim()) {
      setErrorMessage('Please enter your current location or landmark.')
      return
    }
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Please describe what you are seeing (at least 5 characters).')
      return
    }

    setIsSubmitting(true)

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const reportRef = `CIT-${Date.now().toString().slice(-4)}`

    const submission: CitizenReportSubmission = {
      id: reportRef,
      category: whatHappened as any,
      whatHappened,
      location: location.trim(),
      description: description.trim(),
      citizenName: citizenName.trim() || undefined,
      citizenContact: contactInfo.trim() || undefined,
      isPeopleTrapped,
      isImmediateDanger,
      affectedPeople: affectedPeople.trim() || undefined,
      submittedAt: timeStr,
    }

    try {
      // Call parent handler which calls real backend /api/citizen-reports
      const result = await onReportSubmitted(submission)

      setSubmittedData({
        reportId: (result && result.reportId) ? result.reportId : reportRef,
        incidentId: (result && result.incidentId) ? result.incidentId : 'INC-A',
        incidentTitle: 'Target Disaster Sector',
        status: 'TRANSMITTED TO RESPONDERS',
        time: timeStr,
      })
    } catch (err: any) {
      console.error('Error submitting citizen report:', err)
      setErrorMessage('Unable to transmit report to Command Center. Please verify connection and retry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setLocation('')
    setDescription('')
    setCitizenName('')
    setContactInfo('')
    setIsPeopleTrapped(false)
    setIsImmediateDanger(false)
    setAffectedPeople('')
    setSubmittedData(null)
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between w-full overflow-y-auto">
      {/* Public Header */}
      <header className="h-14 border-b border-outline-variant bg-surface px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            <span className="material-symbols-outlined text-[20px]">sos</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-[15px] font-bold text-on-surface tracking-wide">
              Disaster Response Emergency Portal
            </h1>
            <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
              Civil Protection Emergency Intake Network
            </p>
          </div>
        </div>

        {/* Authority Access Portal Entry */}
        <button
          type="button"
          onClick={onNavigateToAuthorityLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
          Authority Login
        </button>
      </header>

      {/* Main Centered Content Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 w-full">
        <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sm:p-8 shadow-xl space-y-6 my-auto">
          {/* Section Banner */}
          <div className="border-b border-outline-variant pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono-label text-[10px] text-primary uppercase tracking-widest font-bold block mb-1">
                CIVILIAN REPORTING CHANNEL
              </span>
              <h2 className="font-headline-md text-headline-sm font-bold text-on-surface">
                Report a Disaster or Emergency
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] font-mono-label w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Intake Channel
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-error/15 border border-error/30 text-error rounded font-body-sm text-[12px] flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {errorMessage}
            </div>
          )}

          {!submittedData ? (
            /* Emergency Intake Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Disaster Type */}
              <div className="space-y-1.5">
                <label className="block font-body-sm text-[12px] font-medium text-on-surface-variant uppercase tracking-wider">
                  1. What kind of disaster is occurring? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Flood', icon: 'flood' },
                    { label: 'Cyclone / Storm', icon: 'cyclone' },
                    { label: 'Landslide', icon: 'landslide' },
                    { label: 'Building Collapse', icon: 'domain_disabled' },
                    { label: 'Fire', icon: 'local_fire_department' },
                    { label: 'Earthquake', icon: 'earthquake' },
                    { label: 'Medical Emergency', icon: 'medical_services' },
                    { label: 'Other', icon: 'emergency' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setWhatHappened(item.label)}
                      className={`p-2.5 rounded border text-left flex items-center gap-2 font-mono-label text-[11px] transition-all cursor-pointer ${
                        whatHappened === item.label
                          ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm ring-1 ring-primary/40'
                          : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] shrink-0">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Location */}
              <div className="space-y-1.5">
                <label className="block font-body-sm text-[12px] font-medium text-on-surface-variant uppercase tracking-wider">
                  2. Location / Landmark / Address *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[18px]">
                    pin_drop
                  </span>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Sector 7G school building near North Basin Bridge"
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded pl-10 pr-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Step 3: Life Safety Triage Flags */}
              <div className="p-3.5 bg-surface-container rounded-lg border border-outline-variant space-y-2.5">
                <span className="font-mono-label text-[10px] text-error font-bold uppercase tracking-wider block">
                  URGENCY &amp; LIFE SAFETY FLAGS
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isSubmitting}
                      checked={isPeopleTrapped}
                      onChange={(e) => setIsPeopleTrapped(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant bg-background text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span className="font-body-sm text-[13px] text-on-surface">
                      People or animals are trapped and cannot evacuate safely.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isSubmitting}
                      checked={isImmediateDanger}
                      onChange={(e) => setIsImmediateDanger(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant bg-background text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span className="font-body-sm text-[13px] text-on-surface">
                      Immediate life danger (fast rising water, structural collapse risk).
                    </span>
                  </label>
                </div>

                <div className="pt-2 border-t border-outline-variant/60">
                  <label className="block font-body-sm text-[11px] text-on-surface-variant font-medium uppercase tracking-wider mb-1">
                    Estimated number of affected people (optional):
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={affectedPeople}
                    onChange={(e) => setAffectedPeople(e.target.value)}
                    placeholder="e.g. ~15 people, 3 families"
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] rounded px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Step 4: Situation Description */}
              <div className="space-y-1.5">
                <label className="block font-body-sm text-[12px] font-medium text-on-surface-variant uppercase tracking-wider">
                  3. Describe what you see and what help is needed *
                </label>
                <textarea
                  required
                  disabled={isSubmitting}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Water is up to 5 feet on the ground floor. 15 people are waiting on the 2nd floor terrace. We need a rescue boat or food supplies."
                  className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline resize-none disabled:opacity-60"
                />
              </div>

              {/* Step 5: Optional Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-body-sm text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] rounded px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-body-sm text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    disabled={isSubmitting}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-background border border-outline-variant text-on-surface font-body-base text-[12px] rounded px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[13px] font-bold rounded shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-surface border-t-transparent animate-spin" />
                      SUBMITTING EMERGENCY REPORT...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      SUBMIT EMERGENCY REPORT
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation State */
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">
                  Emergency Report Received
                </h3>
                <p className="font-body-base text-[13px] text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  Your report has been transmitted to the Central Disaster Command. Responders are tracking this incident.
                </p>
              </div>

              <div className="p-4 bg-surface-container rounded border border-outline-variant text-left space-y-2 max-w-md mx-auto font-mono-label text-[11px]">
                <div className="flex justify-between border-b border-outline-variant/60 pb-1.5">
                  <span className="text-outline">Report Reference:</span>
                  <span className="text-primary font-bold">{submittedData.reportId}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/60 pb-1.5">
                  <span className="text-outline">Assigned Incident:</span>
                  <span className="text-on-surface">{submittedData.incidentId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/60 pb-1.5">
                  <span className="text-outline">Time Recorded:</span>
                  <span className="text-on-surface">{submittedData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Dispatch Status:</span>
                  <span className="text-emerald-400 font-bold">
                    {submittedData.status || 'TRANSMITTED TO RESPONDERS'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-mono-label text-[11px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="h-10 border-t border-outline-variant/60 bg-surface px-6 flex items-center justify-between text-[11px] font-mono-label text-outline shrink-0">
        <span>Disaster Response Network • Civil Emergency Channel</span>
        <span>Confidential &amp; Encrypted Intake</span>
      </footer>
    </div>
  )
}
