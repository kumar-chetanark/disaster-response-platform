'use client'

import React from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center min-w-[220px] ${className}`}>
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-3 pointer-events-none select-none">
        search
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-outline-variant text-on-surface font-body-sm text-[12px] rounded pl-9 pr-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 text-on-surface-variant hover:text-on-surface text-[12px] p-0.5 rounded"
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
