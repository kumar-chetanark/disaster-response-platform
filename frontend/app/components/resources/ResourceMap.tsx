'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ResourceUnit, Incident, ResourceCenter } from '../../types'

interface ResourceMapProps {
  resources: ResourceUnit[]
  incidents?: Incident[]
  shelters?: any[]
  resourceCenters?: ResourceCenter[]
  selectedResourceId?: string | null
  selectedIncidentId?: string | null
  selectedResourceCenterId?: string | null
  onSelectResource?: (resourceId: string) => void
  onSelectIncident?: (incidentId: string) => void
  onSelectResourceCenter?: (centerId: string) => void
  activeLocation?: string
  mapCenterCoord?: { lat: number; lon: number } | null
  radiusKm?: number
  isScanned?: boolean
}

export default function ResourceMap({
  resources,
  incidents = [],
  shelters = [],
  resourceCenters = [],
  selectedResourceId,
  selectedIncidentId,
  selectedResourceCenterId,
  onSelectResource,
  onSelectIncident,
  onSelectResourceCenter,
  activeLocation = 'New Delhi, Delhi, India',
  mapCenterCoord,
  radiusKm = 25,
  isScanned = false,
}: ResourceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const circleLayerRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)

  // Center coordinate
  const currentCenterLat = mapCenterCoord?.lat ?? 28.6139
  const currentCenterLon = mapCenterCoord?.lon ?? 77.2090

  // Initialize Map with Google Maps Raster Tiles
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
        const map = L.map(mapContainerRef.current, {
          center: [currentCenterLat, currentCenterLon],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        })

        // Standard clean Google Maps tiles (No API key required)
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 19,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        }).addTo(map)

        const layerGroup = L.layerGroup().addTo(map)
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
        circleLayerRef.current = null
      }
    }
  }, [])

  // Update Operational Coverage Radius Circle
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return

    import('leaflet').then((L) => {
      if (circleLayerRef.current) {
        mapInstanceRef.current.removeLayer(circleLayerRef.current)
        circleLayerRef.current = null
      }

      const radiusMeters = (radiusKm || 25) * 1000
      const circle = L.circle([currentCenterLat, currentCenterLon], {
        radius: radiusMeters,
        color: '#0284c7',
        fillColor: '#0284c7',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(mapInstanceRef.current)

      circleLayerRef.current = circle
    })
  }, [isLeafletReady, currentCenterLat, currentCenterLon, radiusKm])

  // Render Operational Markers (Incidents, Resources, Resource Centers, Facilities)
  useEffect(() => {
    if (!isLeafletReady || !layerGroupRef.current) return

    import('leaflet').then((L) => {
      const group = layerGroupRef.current
      group.clearLayers()

      // 1. Render Resource Centers
      if (resourceCenters && resourceCenters.length > 0) {
        resourceCenters.forEach((rc) => {
          if (typeof rc.latitude !== 'number' || typeof rc.longitude !== 'number') return
          const isSelected = rc.id === selectedResourceCenterId

          const rcIcon = L.divIcon({
            className: '',
            html: `
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                cursor: pointer;
                position: relative;
                transform: translate(-12px, -12px);
                z-index: 9999;
                pointer-events: auto;
              ">
                <div style="
                  width: ${isSelected ? '30px' : '26px'};
                  height: ${isSelected ? '30px' : '26px'};
                  background: #0284c7;
                  border: 2.5px solid #ffffff;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #ffffff;
                  box-shadow: 0 0 14px rgba(2, 132, 199, 1), 0 4px 6px rgba(0,0,0,0.6);
                ">
                  <span class="material-symbols-outlined" style="font-size: 16px; font-weight: bold; line-height: 1;">hub</span>
                </div>
                <div style="
                  background: #060c1d;
                  border: 1.5px solid ${isSelected ? '#38bdf8' : '#0284c7'};
                  padding: 3px 7px;
                  border-radius: 6px;
                  color: #ffffff;
                  font-family: monospace;
                  font-size: 11px;
                  font-weight: bold;
                  white-space: nowrap;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
                ">
                  ${rc.id} &bull; RC
                </div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })

          const marker = L.marker([rc.latitude, rc.longitude], { icon: rcIcon }).addTo(group)
          marker.on('click', () => {
            if (onSelectResourceCenter) onSelectResourceCenter(rc.id)
          })
        })
      }

      // 2. Render Incidents (Hexagonal Red Alert Badges with Priority)
      incidents.forEach((inc, idx) => {
        // If incident is exactly co-located with Resource Center (0 distance), give it a realistic operational offset (Sector Incident Zone)
        let lat = typeof inc.latitude === 'number' ? inc.latitude : currentCenterLat + 0.022
        let lon = typeof inc.longitude === 'number' ? inc.longitude : currentCenterLon + 0.022
        
        // Prevent exact visual overlapping with the central Resource Center
        if (Math.abs(lat - currentCenterLat) < 0.008 && Math.abs(lon - currentCenterLon) < 0.008) {
          lat += 0.018 + (idx * 0.006)
          lon += 0.018 + (idx * 0.006)
        }
        const isSelected = inc.id === selectedIncidentId
        const sev = (inc.severity || 'HIGH').toUpperCase()
        const isCrit = sev === 'CRITICAL'

        const incIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              cursor: pointer;
              position: relative;
              transform: translate(-12px, -12px);
              z-index: 9998;
              pointer-events: auto;
            ">
              <div style="
                width: ${isSelected ? '30px' : '26px'};
                height: ${isSelected ? '30px' : '26px'};
                background: ${isCrit ? '#ef4444' : '#f43f5e'};
                border: 2.5px solid #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 0 14px ${isCrit ? 'rgba(239, 68, 68, 1)' : 'rgba(244, 63, 94, 1)'}, 0 4px 6px rgba(0,0,0,0.6);
                animation: pulse 1.5s infinite;
              ">
                <span class="material-symbols-outlined" style="font-size: 15px; font-weight: bold; line-height: 1;">warning</span>
              </div>
              <div style="
                background: #0b1329;
                border: 1.5px solid ${isCrit ? '#ef4444' : '#f43f5e'};
                padding: 3px 7px;
                border-radius: 6px;
                color: #f8fafc;
                font-family: monospace;
                font-size: 10px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
              ">
                <div style="color: ${isCrit ? '#f87171' : '#fb7185'}; font-size: 10px; font-weight: bold;">
                  ${inc.id}
                </div>
                <div style="color: #cbd5e1; font-size: 8.5px; font-weight: normal;">
                  ${inc.disasterType || 'Disaster'} &bull; <span style="text-transform: uppercase; color: ${isCrit ? '#fca5a5' : '#fed7aa'}; font-weight: bold;">${sev}</span>
                </div>
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        const marker = L.marker([lat, lon], { icon: incIcon }).addTo(group)
        marker.on('click', () => {
          if (onSelectIncident) onSelectIncident(inc.id)
        })
      })

      // 3. Resources, Shelters & Hospitals are strictly managed via Resource Center cards

      // 4. Render Shelters & Hospitals
      // 3. Shelters and Hospitals are managed exclusively via Resource Center cards (no icons on map)
    })
  }, [
    isLeafletReady,
    incidents,
    resources,
    shelters,
    resourceCenters,
    selectedResourceId,
    selectedIncidentId,
    selectedResourceCenterId,
    isScanned,
    onSelectResource,
    onSelectIncident,
    onSelectResourceCenter,
  ])

  // Fly and Zoom when mapCenterCoord updates
  useEffect(() => {
    if (!mapInstanceRef.current || !mapCenterCoord) return
    const lat = Number(mapCenterCoord.lat)
    const lon = Number(mapCenterCoord.lon)
    if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
      mapInstanceRef.current.flyTo([lat, lon], 12.5, {
        animate: true,
        duration: 1.2,
      })
    }
  }, [mapCenterCoord, isLeafletReady])

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl flex flex-col overflow-hidden relative h-[360px] shadow-lg w-full z-0">
      {/* Bottom Left Legend: Simplified to Incident & Resource Center only */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 bg-[#0b1329]/90 border border-[#1e293b] px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          Incident
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300 ml-1">
          <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block"></span>
          Resource Center
        </div>
      </div>

      {/* Bottom Right Attribution */}
      <div className="absolute bottom-2 right-3 z-30 pointer-events-none text-[9px] font-mono text-slate-400 bg-[#0b1329]/80 px-2 py-0.5 rounded border border-[#1e293b]/60">
        &copy; Google Maps &bull; Leaflet
      </div>

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0 bg-[#060c1d]" />
    </div>
  )
}
