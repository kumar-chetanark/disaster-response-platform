'use client'

import React, { useState } from 'react'
import { UserSession } from '../../types'

interface AuthorityLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (session: UserSession) => void
}

export default function AuthorityLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: AuthorityLoginModalProps) {
  const [badgeId, setBadgeId] = useState('AUTH-7721')
  const [passcode, setPasscode] = useState('••••••••')
  const [selectedRole, setSelectedRole] = useState('Commander (Level 5)')

  if (!isOpen) return null

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    onLoginSuccess({
      role: 'AUTHORITY',
      userName: 'Cmdr. J. Vance',
      badgeId,
      authorityLevel: 5,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant rounded-lg max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">shield_person</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">
                Authority Command Sign-In
              </h2>
              <span className="font-mono-label text-[10px] text-primary uppercase">
                Restricted Operational Terminal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded font-mono-label text-[11px] text-on-surface space-y-1">
          <div className="font-bold text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">key</span>
            Demo Session Credentials Ready
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Authorized as Command Director (Cmdr. J. Vance) with full resource deployment and mission approval permissions.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              Authority Badge ID
            </label>
            <input
              type="text"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              Security Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              Command Station Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[12px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="Commander (Level 5)">Commander (Level 5) — Full Authorization</option>
              <option value="Operations Director">Operations Director — Dispatch &amp; Logistics</option>
              <option value="Incident Supervisor">Incident Supervisor — Field Intelligence</option>
            </select>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-outline-variant text-on-surface font-mono-label text-[11px] rounded uppercase hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase transition-colors shadow"
            >
              Authenticate &amp; Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
