'use client'

import React from 'react'

interface ConfirmDialogState {
  isOpen: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

let openConfirmFn: ((options: {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  type?: 'danger' | 'warning' | 'info'
}) => Promise<boolean>) | null = null

export function showConfirmDialog(options: {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  type?: 'danger' | 'warning' | 'info'
}): Promise<boolean> {
  if (openConfirmFn) {
    return openConfirmFn(options)
  }
  return Promise.resolve(typeof window !== 'undefined' ? window.confirm(options.message) : true)
}

export default function ConfirmDialogProvider() {
  const [dialog, setDialog] = React.useState<ConfirmDialogState>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  })

  React.useEffect(() => {
    openConfirmFn = (options) => {
      return new Promise<boolean>((resolve) => {
        setDialog({
          isOpen: true,
          title: options.title || 'CONFIRM PLATFORM ACTION',
          message: options.message,
          confirmLabel: options.confirmLabel || 'PERMANENTLY DELETE',
          cancelLabel: options.cancelLabel || 'CANCEL',
          type: options.type || 'danger',
          onConfirm: () => {
            setDialog((prev) => ({ ...prev, isOpen: false }))
            resolve(true)
          },
          onCancel: () => {
            setDialog((prev) => ({ ...prev, isOpen: false }))
            resolve(false)
          },
        })
      })
    }

    return () => {
      openConfirmFn = null
    }
  }, [])

  if (!dialog.isOpen) return null

  const isDanger = dialog.type === 'danger'
  const isWarning = dialog.type === 'warning'

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b1329]/95 border border-[#1e293b] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-in zoom-in-95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-md shrink-0 ${
              isDanger
                ? 'bg-red-950/60 border-red-500/40 text-red-400'
                : isWarning
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                : 'bg-sky-950/60 border-sky-500/40 text-sky-400'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDanger ? 'warning' : isWarning ? 'help' : 'info'}
            </span>
          </div>
          <div>
            <h3 className="font-mono text-[14px] font-bold text-white tracking-wide uppercase">
              {dialog.title}
            </h3>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              COMMAND CONFIRMATION PROTOCOL
            </span>
          </div>
        </div>

        {/* Body Message */}
        <p className="font-mono text-[12px] text-slate-200 leading-relaxed bg-[#060c1d] p-3.5 rounded-xl border border-[#1e293b]">
          {dialog.message}
        </p>

        {/* Action Controls */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={dialog.onCancel}
            className="flex-1 py-2.5 bg-[#060c1d] hover:bg-slate-800 border border-[#1e293b] text-slate-300 font-mono text-[11px] font-bold rounded-xl uppercase transition-all cursor-pointer"
          >
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            onClick={dialog.onConfirm}
            className={`flex-1 py-2.5 font-mono text-[11px] font-bold rounded-xl uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDanger ? 'delete_forever' : 'check'}
            </span>
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
