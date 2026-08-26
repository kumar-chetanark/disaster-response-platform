'use client'

import React from 'react'

interface SidebarProps {
  currentTab: string
  isCollapsed?: boolean
  isMobileOpen?: boolean
  alertCount?: number
  incidentCount?: number
  operationCount?: number
  reportCount?: number
  onSelectTab: (id: string) => void
  onCloseMobile?: () => void
  onLogout?: () => void
}

export default function Sidebar({
  currentTab,
  isCollapsed = false,
  isMobileOpen = false,
  alertCount = 0,
  incidentCount = 0,
  operationCount = 0,
  reportCount = 0,
  onSelectTab,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'incidents', label: 'Incidents', icon: 'warning', badge: incidentCount > 0 ? incidentCount : undefined },
    { id: 'operations', label: 'Operations', icon: 'map', badge: operationCount > 0 ? operationCount : undefined },
    { id: 'resources', label: 'Resources', icon: 'inventory_2' },
    { id: 'assessment', label: 'Assessment', icon: 'satellite_alt' },
    { id: 'alerts', label: 'Alerts', icon: 'campaign', badge: alertCount > 0 ? alertCount : undefined, isAlertBadge: true },
    { id: 'reports', label: 'Reports', icon: 'description', badge: reportCount > 0 ? reportCount : undefined },
  ]

  const utilityNavItems = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'support', label: 'Support', icon: 'help' },
  ]

  const handleItemClick = (id: string) => {
    onSelectTab(id)
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <nav
        className={`h-screen fixed left-0 top-0 bg-surface-container border-r border-outline-variant flex flex-col py-4 z-40 mt-header-height transition-all duration-200 ${
          /* Desktop behavior */
          isCollapsed ? 'md:w-16' : 'md:w-sidebar-width'
        } ${
          /* Mobile / Small screen behavior: Drawer translate */
          isMobileOpen
            ? 'translate-x-0 w-64 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
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
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center w-full rounded-DEFAULT transition-colors cursor-pointer ${
                    isCollapsed ? 'md:justify-center md:px-0 px-3 py-2.5' : 'px-3 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-surface-container-highest text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant font-body-sm hover:bg-surface-container-highest'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`material-symbols-outlined text-[20px] ${!isCollapsed || isMobileOpen ? 'mr-3' : ''}`}>
                    {item.icon}
                  </span>

                  {(!isCollapsed || isMobileOpen) && <span className="font-body-sm flex-grow truncate">{item.label}</span>}

                  {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
                    <span
                      className={`font-mono-label text-[10px] px-1.5 py-0.5 rounded border shrink-0 ml-1 font-bold ${
                        item.isAlertBadge
                          ? 'bg-error/20 text-error border-error/40 animate-pulse'
                          : 'bg-surface-variant text-on-surface font-semibold border-outline-variant'
                      }`}
                    >
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
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center text-on-surface-variant font-body-sm hover:bg-surface-container-highest rounded-DEFAULT transition-colors w-full cursor-pointer ${
                  isCollapsed ? 'md:justify-center md:px-0 px-3 py-2' : 'px-3 py-2 text-left'
                } ${
                  isActive ? 'bg-surface-container-highest text-primary font-medium border-l-2 border-primary' : ''
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`material-symbols-outlined text-[18px] ${!isCollapsed || isMobileOpen ? 'mr-3' : ''}`}>
                  {item.icon}
                </span>
                {(!isCollapsed || isMobileOpen) && <span className="text-[12px] truncate">{item.label}</span>}
              </button>
            )
          })}

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                if (onCloseMobile) onCloseMobile()
                onLogout()
              }}
              className={`flex items-center text-on-surface-variant font-body-sm hover:text-error hover:bg-error/10 rounded-DEFAULT transition-colors w-full cursor-pointer mt-1 ${
                isCollapsed ? 'md:justify-center md:px-0 px-3 py-2' : 'px-3 py-2 text-left'
              }`}
              title={isCollapsed ? 'Exit Authority' : 'Return to Citizen Portal'}
            >
              <span className={`material-symbols-outlined text-[18px] ${!isCollapsed || isMobileOpen ? 'mr-3' : ''}`}>
                logout
              </span>
              {(!isCollapsed || isMobileOpen) && <span className="text-[12px] font-mono-label uppercase truncate">Exit Authority</span>}
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
