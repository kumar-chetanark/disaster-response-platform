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
      if (typeof window !== 'undefined') {
        if (data.token) localStorage.setItem('authority_session_token', data.token)
        localStorage.setItem('authority_session_user', JSON.stringify({
          role: 'AUTHORITY',
          userName: data.name || 'Chetan Kumar',
          badgeId: data.badge_id || 'AUTH-2026-LV5',
          authorityLevel: data.authority_level || 5,
        }))
      }
      onLoginSuccess({
        role: 'AUTHORITY',
        userName: data.name || 'Chetan Kumar',
        badgeId: data.badge_id || 'AUTH-2026-LV5',
        authorityLevel: data.authority_level || 5,
      })
    } catch (err: any) {
      console.error('Authority authentication error:', err)
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1329]/95 border border-[#1e293b] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-[0_0_50px_rgba(2,132,199,0.2)] animate-in zoom-in-95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] border border-sky-400/40 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">shield_person</span>
            </div>
            <div>
              <h2 className="font-mono text-[16px] font-bold text-white tracking-tight">
                Authority Command Sign-In
              </h2>
              <span className="font-mono text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                Restricted Operational Terminal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Credentials Info Banner */}
        <div className="p-3 bg-[#060c1d] border border-sky-500/30 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
          <div className="font-bold text-sky-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">key</span>
            Verified Authority Credentials Pre-Loaded
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Account: <strong className="text-white">Chetan Kumar</strong> (Level 5 Command Authority). Requests cryptographic session verification.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 font-mono text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Authority Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#060c1d] border border-[#1e293b] focus:border-sky-500 text-white font-mono text-[13px] rounded-xl px-3.5 py-2.5 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Security Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#060c1d] border border-[#1e293b] focus:border-sky-500 text-white font-mono text-[13px] rounded-xl px-3.5 py-2.5 outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#060c1d] hover:bg-slate-800 border border-[#1e293b] text-slate-300 font-mono text-[11px] font-bold rounded-xl uppercase transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-mono text-[11px] font-bold rounded-xl uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
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
