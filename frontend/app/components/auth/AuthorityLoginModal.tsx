'use client'

import React, { useState } from 'react'
import { UserSession } from '../../types'
import { platformDataService } from '../../services/dataService'

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
  const [username, setUsername] = useState('authority_admin')
  const [password, setPassword] = useState('Commander@2026!')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const data = await platformDataService.authLogin(username, password)
      onLoginSuccess({
        role: 'AUTHORITY',
        userName: data.name,
        badgeId: data.badge_id,
        authorityLevel: data.authority_level,
      })
    } catch (err: any) {
      console.error('Authority authentication error:', err)
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setIsLoading(false)
    }
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

        {/* Credentials Info Banner */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded font-mono-label text-[11px] text-on-surface space-y-1">
          <div className="font-bold text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">key</span>
            Verified Authority Credentials Pre-Loaded
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Account: <strong>Commander R. Vance</strong> (Level 5 Command Authority). Automatically requests backend cryptographic session token.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-950/20 border border-red-500/40 rounded text-red-400 font-mono-label text-[11px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              Authority Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              Security Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-outline-variant text-on-surface font-mono-label text-[13px] rounded px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
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
              disabled={isLoading}
              className="flex-1 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono-label text-[11px] font-bold rounded uppercase transition-colors shadow flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                  Authenticating...
                </>
              ) : (
                'Authenticate & Enter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
