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
  isCollapsed?: boolean
  onSelectTab: (id: string) => void
  onLogout?: () => void
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'incidents', label: 'Incidents', icon: 'warning' },
  { id: 'operations', label: 'Operations', icon: 'map' },
  { id: 'resources', label: 'Resources', icon: 'inventory_2' },
  { id: 'assessment', label: 'Assessment', icon: 'satellite_alt' },
  { id: 'alerts', label: 'Alerts', icon: 'campaign', badge: 3 },
  { id: 'reports', label: 'Reports', icon: 'description' },
]

const utilityNavItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'support', label: 'Support', icon: 'help' },
]

export default function Sidebar({
  currentTab,
  isCollapsed = false,
  onSelectTab,
  onLogout,
}: SidebarProps) {
  return (
    <nav
      className={`h-screen fixed left-0 top-0 bg-surface-container border-r border-outline-variant flex flex-col py-4 z-40 mt-header-height transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-sidebar-width'
      }`}
    >
      <ul className="flex flex-col flex-grow space-y-1 px-2.5">
        {mainNavItems.map((item) => {
          const isActive =
            currentTab === item.id ||
            (item.id === 'assessment' && (currentTab === 'assessments' || currentTab === 'aerial'))
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center w-full rounded-DEFAULT transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5 text-left'
                } ${
                  isActive
                    ? 'bg-surface-container-highest text-primary font-medium border-l-2 border-primary'
                    : 'text-on-surface-variant font-body-sm hover:bg-surface-container-highest'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`material-symbols-outlined text-[20px] ${!isCollapsed ? 'mr-3' : ''}`}>
                  {item.icon}
                </span>

                {!isCollapsed && <span className="font-body-sm flex-grow truncate">{item.label}</span>}

                {!isCollapsed && item.badge && (
                  <span className="bg-surface-variant text-on-surface-variant font-mono-label text-[10px] px-1.5 py-0.5 rounded border border-outline-variant shrink-0 ml-1">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="px-2.5 pt-3 border-t border-outline-variant/60 space-y-1">
        {utilityNavItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center text-on-surface-variant font-body-sm hover:bg-surface-container-highest rounded-DEFAULT transition-colors w-full cursor-pointer ${
                isCollapsed ? 'justify-center px-0 py-2' : 'px-3 py-2 text-left'
              } ${
                isActive ? 'bg-surface-container-highest text-primary font-medium border-l-2 border-primary' : ''
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`material-symbols-outlined text-[18px] ${!isCollapsed ? 'mr-3' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-[12px] truncate">{item.label}</span>}
            </button>
          )
        })}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`flex items-center text-on-surface-variant font-body-sm hover:text-error hover:bg-error/10 rounded-DEFAULT transition-colors w-full cursor-pointer mt-1 ${
              isCollapsed ? 'justify-center px-0 py-2' : 'px-3 py-2 text-left'
            }`}
            title={isCollapsed ? 'Exit Authority' : 'Return to Citizen Portal'}
          >
            <span className={`material-symbols-outlined text-[18px] ${!isCollapsed ? 'mr-3' : ''}`}>
              logout
            </span>
            {!isCollapsed && <span className="text-[12px] font-mono-label uppercase truncate">Exit Authority</span>}
          </button>
        )}
      </div>
    </nav>
  )
}
