'use client'

import React from 'react'

interface DetailsHeaderProps {
  badgeId: string
  title: string
  statusText?: string
  statusColor?: 'error' | 'tertiary' | 'emerald' | 'primary' | 'outline'
  severityBadge?: string
  subItems?: { label?: string; value: string; icon?: string; highlight?: boolean }[]
  extraAction?: React.ReactNode
  accentColor?: string
}

export default function DetailsHeader({
  badgeId,
  title,
  statusText,
  statusColor = 'primary',
  severityBadge,
  subItems = [],
  extraAction,
  accentColor,
}: DetailsHeaderProps) {
  const getBadgeStyle = () => {
    switch (statusColor) {
      case 'error':
        return 'bg-error/15 text-error border-error/30'
      case 'tertiary':
        return 'bg-tertiary/15 text-tertiary border-tertiary/30'
      case 'emerald':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 font-bold'
      case 'outline':
        return 'bg-surface text-on-surface-variant border-outline-variant'
      case 'primary':
      default:
        return 'bg-primary/15 text-primary border-primary/30'
    }
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0 shadow-sm">
      {accentColor && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            accentColor === 'error'
              ? 'bg-error'
              : accentColor === 'emerald'
              ? 'bg-emerald-400'
              : accentColor === 'tertiary'
              ? 'bg-tertiary'
              : 'bg-primary'
          }`}
        />
      )}

      <div className="flex flex-col gap-1 pl-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono-label text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            {badgeId}
          </span>

          {severityBadge && (
            <span
              className={`font-mono-label text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                severityBadge === 'CRITICAL'
                  ? 'bg-error/15 text-error border-error/30'
                  : severityBadge === 'HIGH'
                  ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                  : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {severityBadge}
            </span>
          )}

          {statusText && (
            <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded border uppercase ${getBadgeStyle()}`}>
              {statusText}
            </span>
          )}
        </div>

        <h3 className="font-headline-sm text-[16px] font-bold text-on-surface truncate leading-normal mt-0.5" title={title}>
          {title}
        </h3>

        {subItems.length > 0 && (
          <div className="flex items-center gap-3 text-on-surface-variant font-mono-label text-[11px] flex-wrap mt-0.5">
            {subItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-outline-variant">•</span>}
                <div className={`flex items-center gap-1 ${item.highlight ? 'text-primary font-medium' : ''}`}>
                  {item.icon && <span className="material-symbols-outlined text-[13px]">{item.icon}</span>}
                  {item.label && <span className="text-outline">{item.label}: </span>}
                  <span>{item.value}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {extraAction && (
        <div className="shrink-0 flex items-center gap-2">
          {extraAction}
        </div>
      )}
    </div>
  )
}
