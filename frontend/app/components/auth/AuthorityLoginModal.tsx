'use client'

import React, { useState, useEffect } from 'react'
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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDemoModeEnabled, setIsDemoModeEnabled] = useState(false)

  useEffect(() => {
    if (isOpen) {
      platformDataService.authGetConfig().then((cfg) => {
        setIsDemoModeEnabled(!!cfg.demo_mode)
      }).catch(() => {
        setIsDemoModeEnabled(false)
      })
    }
  }, [isOpen])

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

  const handleDemoAccess = async () => {
    setIsDemoLoading(true)
    setErrorMsg(null)

    try {
      const data = await platformDataService.authDemoLogin()
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
      console.error('Demo authentication error:', err)
      setErrorMsg(err.message || 'Demo access is currently unavailable.')
    } finally {
      setIsDemoLoading(false)
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

        {/* Hackathon Demo Access Button Banner (Controlled strictly by backend DEMO_MODE) */}
        {isDemoModeEnabled && (
          <div className="p-3.5 bg-gradient-to-br from-[#0c1b3a] to-[#06122b] border border-sky-500/40 rounded-xl space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Hackathon Judge / Evaluation Mode
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="font-mono text-[10.5px] text-slate-300 leading-normal">
              Direct evaluator access enabled. Sign in as Commander Chetan Kumar (Level 5 Authority) with one click.
            </p>
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={isDemoLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-[11.5px] font-bold rounded-xl uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDemoLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  Initializing Demo Session...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  ENTER DEMO COMMAND CENTER
                </>
              )}
            </button>
          </div>
        )}

        {isDemoModeEnabled && (
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#1e293b] w-full"></div>
            <span className="bg-[#0b1329] px-3 font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Or Sign In with Credentials
            </span>
          </div>
        )}

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
              placeholder="e.g. authority_admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#060c1d] border border-[#1e293b] focus:border-sky-500 text-white font-mono text-[13px] rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Security Passcode
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#060c1d] border border-[#1e293b] focus:border-sky-500 text-white font-mono text-[13px] rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-slate-600"
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
