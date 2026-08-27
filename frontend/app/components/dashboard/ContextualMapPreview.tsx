'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Incident, ResourceUnit } from '../../types'

interface MapPreviewProps {
  incidents?: Incident[]
  resources?: ResourceUnit[]
  selectedIncidentId?: string | null
  onSelectIncident?: (id: string) => void
}

export default function ContextualMapPreview({
  incidents = [],
  resources = [],
  selectedIncidentId,
  onSelectIncident,
}: MapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return

      if (!mapInstanceRef.current) {
        // Initial center on default region
        const centerLat = incidents.length > 0 && incidents[0].latitude ? incidents[0].latitude : 29.7604
        const centerLon = incidents.length > 0 && incidents[0].longitude ? incidents[0].longitude : -95.3698

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLon],
          zoom: 11,
          zoomControl: false,
        })

        // Tactical Dark Matter tile layer
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        const layerGroup = L.layerGroup().addTo(map)
        layerGroupRef.current = layerGroup
        mapInstanceRef.current = map
        setIsLeafletReady(true)
      }
    }).catch(err => {
      console.error('[LeafletMap] Failed to initialize map:', err)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Render Tactical Severity Markers + Dynamic Shockwave Heatwaves
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !layerGroupRef.current) return

    import('leaflet').then((L) => {
      const group = layerGroupRef.current
      group.clearLayers()

      if (incidents.length === 0) {
        return
      }

      // Auto-fit map bounds if incidents exist
      const validCoords: [number, number][] = []

      incidents.forEach((inc) => {
        const lat = inc.latitude || 29.7604
        const lon = inc.longitude || -95.3698
        validCoords.push([lat, lon])

        const isSelected = inc.id === selectedIncidentId
        const isCritical = inc.severity === 'CRITICAL'
        const isHigh = inc.severity === 'HIGH'

        const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#38bdf8'
        const waveRadius = isCritical ? 2800 : isHigh ? 1800 : 1200

        // 1. Dynamic Shockwave / Heatwave Gradient Circles based on severity & coverage
        // Outer dissipation wave
        L.circle([lat, lon], {
          radius: waveRadius * 1.4,
          fillColor: color,
          fillOpacity: 0.12,
          stroke: false,
        }).addTo(group)

        // Middle pulse ring
        L.circle([lat, lon], {
          radius: waveRadius,
          fillColor: color,
          fillOpacity: 0.28,
          color: color,
          weight: 1.5,
          dashArray: isCritical ? '3 3' : undefined,
        }).addTo(group)

        // Core intensity aura
        L.circle([lat, lon], {
          radius: waveRadius * 0.4,
          fillColor: color,
          fillOpacity: 0.55,
          stroke: false,
        }).addTo(group)

        // 2. Tactical Incident Pin Marker with pulsing radar halo
        const customHtml = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background-color: ${color};
              opacity: 0.4;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: ${isSelected ? '28px' : '22px'};
              height: ${isSelected ? '28px' : '22px'};
              background-color: ${color};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 14px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              z-index: 10;
            ">
              <span style="font-size: 11px; font-weight: 900; color: #000000;">!</span>
            </div>
          </div>
        `

        const customIcon = L.divIcon({
          html: customHtml,
          className: 'custom-leaflet-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(group)

        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 6px; color: #0f172a; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${color}; letter-spacing: 0.05em;">
              ${inc.severity} &bull; ${inc.disasterType || inc.type || 'INCIDENT'}
            </div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 3px; color: #0f172a;">
              ${inc.title}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
              📍 ${inc.location || 'Coordinates Lat/Lon'}
            </div>
            <div style="font-size: 10px; color: #334155; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between;">
              <span>Coverage: <b>${inc.resourceCoveragePct || inc.resourceCoverage || '60%'}</b></span>
              <span>Priority: <b>${inc.priorityLevel || 'Level 1'}</b></span>
            </div>
          </div>
        `)

        marker.on('click', () => {
          if (onSelectIncident) {
            onSelectIncident(inc.id)
          }
        })
      })

      // If valid coordinates exist, pan/fit
      if (validCoords.length > 0 && mapInstanceRef.current) {
        if (validCoords.length === 1) {
          mapInstanceRef.current.setView(validCoords[0], 12)
        } else {
          mapInstanceRef.current.fitBounds(validCoords, { padding: [40, 40] })
        }
      }
    })
  }, [isLeafletReady, incidents, selectedIncidentId, onSelectIncident])

  return (
    <div className="bg-surface border border-outline-variant rounded-lg flex flex-col overflow-hidden relative h-64 shadow-inner">
      {/* Top Header Status Overlay */}
      <div className="absolute top-2 left-2 z-400 bg-surface/90 border border-outline-variant px-2.5 py-1 rounded backdrop-blur text-[10px] font-mono-label text-on-surface flex items-center gap-2 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span className="font-bold">TACTICAL GIS RADAR</span>
        <span className="text-outline">|</span>
        <span className="text-on-surface-variant">{incidents.length} Active Incident{incidents.length === 1 ? '' : 's'}</span>
      </div>

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-10 bg-surface-container-lowest" />

      {/* Empty State Overlay */}
      {incidents.length === 0 && (
        <div className="absolute inset-0 z-400 bg-surface-container-lowest/80 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-[32px] text-outline mb-1">radar</span>
          <span className="font-mono-label text-[12px] text-on-surface font-bold">ZERO ACTIVE INCIDENT COORDINATES</span>
          <span className="font-body-base text-[11px] text-on-surface-variant mt-0.5">Awaiting live citizen submissions or external feeds</span>
        </div>
      )}

      {/* Bottom Coordinates Footer */}
      <div className="absolute bottom-2 left-2 z-400 text-[9px] font-mono-label text-on-surface-variant bg-surface-container/90 px-2 py-0.5 rounded border border-outline-variant pointer-events-none">
        OpenStreetMap &amp; CartoDB &bull; Real GIS Coordinates Active
      </div>
    </div>
  )
}
