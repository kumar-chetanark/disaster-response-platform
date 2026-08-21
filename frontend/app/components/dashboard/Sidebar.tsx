'use client'

import React from 'react'

interface NavItem {
  id: string
  label: string
  icon: string
  badge?: number
}

interface SidebarProps {
  currentTab: string
  onSelectTab: (id: string) => void
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'incidents', label: 'Incidents', icon: 'warning' },
  { id: 'operations', label: 'Operations', icon: 'map' },
  { id: 'resources', label: 'Resources', icon: 'inventory_2' },
  { id: 'teams', label: 'Teams', icon: 'groups' },
  { id: 'aerial', label: 'Aerial', icon: 'satellite_alt' },
  { id: 'alerts', label: 'Alerts', icon: 'campaign', badge: 3 },
  { id: 'reports', label: 'Reports', icon: 'description' },
  { id: 'audit', label: 'Audit', icon: 'history' },
]

export default function Sidebar({ currentTab, onSelectTab }: SidebarProps) {
  return (
    <nav className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container border-r border-outline-variant flex flex-col py-4 z-40 mt-header-height">
      <ul className="flex flex-col flex-grow space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center px-3 py-2.5 w-full rounded-DEFAULT transition-colors text-left ${
                  isActive
                    ? 'bg-surface-container-highest text-primary font-medium'
                    : 'text-on-surface-variant font-body-sm hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
                <span className="font-body-sm flex-grow">{item.label}</span>
                {item.badge && (
                  <span className="bg-surface-variant text-on-surface-variant font-mono-label text-[10px] px-1.5 py-0.5 rounded border border-outline-variant">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="px-3">
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className="flex items-center px-3 py-2.5 text-on-surface-variant font-body-sm hover:bg-surface-container-highest rounded-DEFAULT transition-colors w-full"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">settings</span>
          <span>Settings</span>
        </button>
      </div>
    </nav>
  )
}
