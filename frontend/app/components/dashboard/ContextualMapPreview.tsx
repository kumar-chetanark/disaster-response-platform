'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Incident, ResourceUnit } from '../../types'
import { ExternalAlert } from '../../services/dataService'

interface MapPreviewProps {
  incidents?: Incident[]
  resources?: ResourceUnit[]
  externalAlerts?: ExternalAlert[]
  selectedIncidentId?: string | null
  focusedCoordinates?: { lat: number; lon: number; zoom?: number } | null
  onSelectIncident?: (id: string) => void
  onReviewExternalAlert?: (alert: ExternalAlert) => void
}

export default function ContextualMapPreview({
  incidents = [],
  resources = [],
  externalAlerts = [],
  selectedIncidentId,
  focusedCoordinates,
  onSelectIncident,
  onReviewExternalAlert,
}: MapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const heatLayerGroupRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)
  const [filterMode, setFilterMode] = useState<'ALL' | 'INCIDENTS' | 'GLOBAL_INTEL'>('ALL')
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState(true)

  // 1. Initialize Leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((LModule) => {
      const L = LModule.default || LModule

      if (!mapContainerRef.current) return

      if (!mapInstanceRef.current) {
        const centerLat = incidents.length > 0 && incidents[0].latitude ? incidents[0].latitude : 20.0
        const centerLon = incidents.length > 0 && incidents[0].longitude ? incidents[0].longitude : 0.0

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLon],
          zoom: 3,
          zoomControl: false,
        })

        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Maps &bull; Leaflet',
          maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        const heatLayerGroup = L.layerGroup().addTo(map)
        const layerGroup = L.layerGroup().addTo(map)

        heatLayerGroupRef.current = heatLayerGroup
        layerGroupRef.current = layerGroup
        mapInstanceRef.current = map
        setIsLeafletReady(true)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        layerGroupRef.current = null
        heatLayerGroupRef.current = null
      }
    }
  }, [])

  // 2. Focus/Fly to coordinates when requested
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !focusedCoordinates) return
    if (focusedCoordinates.lat != null && focusedCoordinates.lon != null) {
      mapInstanceRef.current.flyTo(
        [focusedCoordinates.lat, focusedCoordinates.lon],
        focusedCoordinates.zoom || 8,
        { duration: 1.2 }
      )
    }
  }, [isLeafletReady, focusedCoordinates])

  // 3. Render Heatmap Rings & Tactical Markers (Zero dependency, guaranteed 100% crash-free)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !layerGroupRef.current || !heatLayerGroupRef.current) return

    import('leaflet').then((LModule) => {
      const L = LModule.default || LModule
      const layerGroup = layerGroupRef.current
      const heatLayerGroup = heatLayerGroupRef.current

      layerGroup.clearLayers()
      heatLayerGroup.clearLayers()

      // Collect points for heatmap rendering
      const heatItems: { lat: number; lon: number; type: 'INCIDENT' | 'GLOBAL'; severity?: string; isCritical: boolean }[] = []

      // A. Canonical Incidents
      if (filterMode === 'ALL' || filterMode === 'INCIDENTS') {
        incidents.forEach((inc) => {
          if (inc.latitude == null || inc.longitude == null) return

          const sevUpper = (inc.severity || 'MEDIUM').toUpperCase()
          const isCritical = sevUpper === 'CRITICAL' || sevUpper === 'RED'
          const isHigh = sevUpper === 'HIGH' || sevUpper === 'ORANGE'
          const isSelected = inc.id === selectedIncidentId
          const color = isCritical ? '#ef4444' : isHigh ? '#ea580c' : '#0284c7'

          heatItems.push({ lat: inc.latitude, lon: inc.longitude, type: 'INCIDENT', severity: sevUpper, isCritical })

          const icon = L.divIcon({
            className: 'custom-incident-marker',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
                <div style="position: absolute; width: ${isSelected ? '32px' : '22px'}; height: ${isSelected ? '32px' : '22px'}; border-radius: 50%; background: ${color}; opacity: 0.95; border: 2px solid #ffffff; box-shadow: 0 0 12px ${color};"></div>
                <span style="position: relative; font-family: monospace; font-size: 11px; font-weight: bold; color: #ffffff;">!</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })

          const marker = L.marker([inc.latitude, inc.longitude], { icon })
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 180px; color: #0f172a;">
              <div style="font-weight: bold; font-size: 13px; margin-bottom: 2px; color: ${color};">${inc.title} &bull; ${inc.severity}</div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${inc.location || 'Active Incident'}</div>
              <div style="font-family: monospace; font-size: 10px; color: #334155; margin-bottom: 6px;">Status: <strong>${inc.status}</strong></div>
            </div>
          `)

          marker.on('click', () => {
            if (onSelectIncident) onSelectIncident(inc.id)
          })

          layerGroup.addLayer(marker)
        })
      }

      // B. Worldwide External Disaster Alerts (GDACS)
      if (filterMode === 'ALL' || filterMode === 'GLOBAL_INTEL') {
        externalAlerts.forEach((alt) => {
          if (alt.latitude == null || alt.longitude == null) return

          const sevUpper = (alt.alertLevel || alt.severity || 'MEDIUM').toUpperCase()
          const isCrit = sevUpper === 'CRITICAL' || sevUpper === 'RED'
          const isHigh = sevUpper === 'HIGH' || sevUpper === 'ORANGE'
          const bg = '#0284c7'

          heatItems.push({ lat: alt.latitude, lon: alt.longitude, type: 'GLOBAL', severity: sevUpper, isCritical: isCrit })

          const icon = L.divIcon({
            className: 'custom-gdacs-marker',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; cursor: pointer;">
                <div style="position: absolute; width: 20px; height: 20px; border-radius: 4px; background: ${bg}; border: 1.5px solid #ffffff; transform: rotate(45deg); box-shadow: 0 0 10px ${bg};"></div>
                <span style="position: relative; font-family: monospace; font-size: 10px; font-weight: bold; color: #ffffff;">G</span>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          })

          const marker = L.marker([alt.latitude, alt.longitude], { icon })
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 200px; color: #0f172a;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${alt.source} INTEL</span>
                <span style="font-family: monospace; font-size: 9px; font-weight: bold; color: #0284c7; text-transform: uppercase;">${alt.alertLevel || alt.severity}</span>
              </div>
              <div style="font-weight: bold; font-size: 12px; line-height: 1.2; margin-bottom: 3px;">${alt.title.replace(/\[GDACS\]\s*/, '')}</div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${alt.country || alt.locationName || 'Global Zone'}</div>
              <div style="font-family: monospace; font-size: 10px; color: #475569; margin-bottom: 6px;">Status: <strong>${alt.status}</strong></div>
              <a href="${alt.sourceUrl || '#'}" target="_blank" style="color: #0284c7; font-size: 10px; font-weight: bold; text-decoration: none;">View GDACS Report &rarr;</a>
            </div>
          `)

          layerGroup.addLayer(marker)
        })
      }

      // C. Render Single Disaster Impact Circle with Severity-Driven Color Spectrum
      if (isHeatmapEnabled && heatItems.length > 0) {
        heatItems.forEach((item: any) => {
          const isIncident = item.type === 'INCIDENT'
          const sev = (item.severity || '').toUpperCase()

          // Determine exact color based on severity:
          // CRITICAL / RED -> Red (#ef4444)
          // HIGH / ORANGE  -> Orange (#ea580c)
          // MEDIUM / GREEN -> Emerald Green (#10b981)
          // Default        -> Tactical Blue (#0284c7)
          let circleColor = '#0284c7'
          if (sev.includes('CRITICAL') || sev.includes('RED')) {
            circleColor = '#ef4444'
          } else if (sev.includes('HIGH') || sev.includes('ORANGE')) {
            circleColor = '#ea580c'
          } else if (sev.includes('GREEN') || sev.includes('LOW')) {
            circleColor = '#10b981'
          } else {
            circleColor = isIncident ? '#ea580c' : '#0284c7'
          }

          // Single clean unified impact circle colored strictly by severity
          const singleHeatCircle = L.circle([item.lat, item.lon], {
            radius: isIncident ? 75000 : 55000,
            fillColor: circleColor,
            fillOpacity: 0.40,
            stroke: true,
            color: circleColor,
            weight: 1.8,
            opacity: 0.75,
            interactive: false,
          })

          heatLayerGroup.addLayer(singleHeatCircle)
        })
      }
    })
  }, [isLeafletReady, incidents, externalAlerts, selectedIncidentId, filterMode, isHeatmapEnabled])

  return (
    <div className="relative w-full h-[440px] rounded-xl overflow-hidden border border-outline-variant bg-surface-container shadow-md">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Tactical Layer Legend & Filter Controls */}
      <div className="absolute top-3 right-3 z-[400] bg-surface-container/90 backdrop-blur-md p-2 rounded-lg border border-outline-variant flex items-center gap-1.5 font-mono text-[10px]">
        {/* Heatmap Toggle */}
        <button
          type="button"
          onClick={() => setIsHeatmapEnabled(!isHeatmapEnabled)}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-bold ${
            isHeatmapEnabled ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xs' : 'text-slate-400 hover:bg-surface'
          }`}
          title="Toggle Disaster Heatmap Density Layer"
        >
          <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
          <span>HEATMAP {isHeatmapEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('ALL')}
          className={`px-2.5 py-1 rounded transition-colors ${filterMode === 'ALL' ? 'bg-primary text-on-primary font-bold' : 'text-slate-300 hover:bg-surface'}`}
        >
          ALL ({incidents.length + externalAlerts.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('INCIDENTS')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${filterMode === 'INCIDENTS' ? 'bg-red-600 text-white font-bold' : 'text-red-400 hover:bg-surface'}`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white text-[9px] font-bold text-white flex items-center justify-center shadow-xs">
            !
          </span>
          <span>INCIDENTS ({incidents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('GLOBAL_INTEL')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${filterMode === 'GLOBAL_INTEL' ? 'bg-sky-600 text-white font-bold' : 'text-sky-400 hover:bg-surface'}`}
        >
          <span className="relative w-3.5 h-3.5 flex items-center justify-center">
            <span className="absolute w-3 h-3 rounded-xs bg-sky-500 border border-white rotate-45"></span>
            <span className="relative text-[8px] font-bold text-white z-10 leading-none">G</span>
          </span>
          <span>GLOBALS ({externalAlerts.length})</span>
        </button>
      </div>

      {/* Bottom Floating Legend with 100% Identical Visual Glyphs & Heatmap Spectrum */}
      <div className="absolute bottom-3 left-3 z-[400] bg-surface-container/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-outline-variant flex flex-wrap items-center gap-5 font-mono text-[10px] text-slate-300 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-sm">
            <span className="text-[10px] font-bold text-white leading-none">!</span>
          </div>
          <span className="font-bold text-slate-200">Incidents</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="absolute w-3.5 h-3.5 rounded-xs bg-sky-500 border-2 border-white rotate-45 shadow-sm"></div>
            <span className="relative text-[9px] font-bold text-white z-10 leading-none">G</span>
          </div>
          <span className="font-bold text-slate-200">Globals</span>
        </div>

        {/* Heatmap Density Spectrum */}
        {isHeatmapEnabled && (
          <div className="flex items-center gap-2 border-l border-outline-variant pl-4">
            <span className="text-slate-400 text-[9px] uppercase">Density:</span>
            <div className="w-16 h-2.5 rounded-full bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500 shadow-inner"></div>
            <span className="text-[9px] text-slate-400">High Risk</span>
          </div>
        )}
      </div>
    </div>
  )
}
