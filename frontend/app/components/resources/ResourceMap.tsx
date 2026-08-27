'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ResourceUnit, Incident } from '../../types'

interface ResourceMapProps {
  resources: ResourceUnit[]
  incidents?: Incident[]
  shelters?: any[]
  selectedResourceId?: string | null
  selectedIncidentId?: string | null
  onSelectResource?: (resourceId: string) => void
  onSelectIncident?: (incidentId: string) => void
  activeLocation?: string
  mapCenterCoord?: { lat: number; lon: number } | null
  radiusKm?: number
}

export default function ResourceMap({
  resources,
  incidents = [],
  shelters = [],
  selectedResourceId,
  selectedIncidentId,
  onSelectResource,
  onSelectIncident,
  activeLocation = 'New Delhi, Delhi, India',
  mapCenterCoord,
  radiusKm = 25,
}: ResourceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const circleLayerRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)
  const tileLayerRef = useRef<any>(null)

  // Center coordinate (Rourkela / Active reference)
  const currentCenterLat = mapCenterCoord?.lat ?? 28.6139
  const currentCenterLon = mapCenterCoord?.lon ?? 77.2090

  // Initialize Map with Google Maps Tiles
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
        const tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Maps',
          maxZoom: 20,
        }).addTo(map)
        tileLayerRef.current = tileLayer

        L.control.zoom({ position: 'topleft' }).addTo(map)

        const circleGroup = L.layerGroup().addTo(map)
        circleLayerRef.current = circleGroup

        const layerGroup = L.layerGroup().addTo(map)
        layerGroupRef.current = layerGroup
        mapInstanceRef.current = map
        setIsLeafletReady(true)
      }
    }).catch((err) => {
      console.error('[ResourceMap] Failed to initialize map:', err)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Draw 25 km Tactical Geodesic Coverage Circle & Target Marker
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !circleLayerRef.current) return

    import('leaflet').then((L) => {
      const circleGroup = circleLayerRef.current
      circleGroup.clearLayers()

      const lat = currentCenterLat
      const lon = currentCenterLon

      if (!isNaN(lat) && !isNaN(lon)) {
        // Operational Radius Circle (e.g. 25km = 25000m)
        const radiusMeters = (radiusKm || 25) * 1000
        const circle = L.circle([lat, lon], {
          radius: radiusMeters,
          color: '#38bdf8',
          weight: 1.5,
          dashArray: '5, 6',
          fillColor: '#0284c7',
          fillOpacity: 0.08,
        })
        circle.addTo(circleGroup)

        // Center Reference Crosshair Marker
        const centerIcon = L.divIcon({
          className: 'custom-center-marker',
          html: `
            <div style="
              width: 12px;
              height: 12px;
              border: 2px solid #38bdf8;
              border-radius: 50%;
              background: rgba(56, 189, 248, 0.6);
              box-shadow: 0 0 8px rgba(56, 189, 248, 0.9);
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })

        L.marker([lat, lon], { icon: centerIcon }).addTo(circleGroup)
      }
    })
  }, [isLeafletReady, currentCenterLat, currentCenterLon, radiusKm])

  // Render Markers (Incidents, Resources, Shelters, Hospitals)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !layerGroupRef.current) return

    import('leaflet').then((L) => {
      const group = layerGroupRef.current
      group.clearLayers()

      // 1. Render Incidents (Hexagonal / Badge Red/Orange Markers with ID & Disaster Type)
      incidents.forEach((inc) => {
        if (typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number') return
        const isSelected = inc.id === selectedIncidentId
        const sev = (inc.severity || 'HIGH').toUpperCase()
        const isCrit = sev === 'CRITICAL'
        const badgeColor = isCrit ? '#ef4444' : '#e11d48'

        const incIcon = L.divIcon({
          className: 'custom-inc-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <div style="
                width: ${isSelected ? '26px' : '22px'};
                height: ${isSelected ? '26px' : '22px'};
                background: ${badgeColor};
                border: 2px solid #ffffff;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
              ">
                <span class="material-symbols-outlined" style="font-size: 14px;">warning</span>
              </div>
              <div style="
                background: rgba(11, 19, 41, 0.92);
                border: 1px solid ${isCrit ? 'rgba(239, 68, 68, 0.8)' : 'rgba(225, 29, 72, 0.7)'};
                padding: 2px 6px;
                border-radius: 4px;
                color: #ffffff;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 9px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
              ">
                <div style="color: ${isCrit ? '#f87171' : '#fb7185'}; font-size: 9px; font-weight: bold;">
                  ${inc.id}
                </div>
                <div style="color: #cbd5e1; font-size: 8px; font-weight: normal;">
                  ${inc.disasterType || 'Disaster'} &bull; <span style="text-transform: uppercase; color: ${isCrit ? '#fca5a5' : '#fed7aa'};">${sev}</span>
                </div>
              </div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        const marker = L.marker([inc.latitude, inc.longitude], { icon: incIcon }).addTo(group)
        marker.on('click', () => {
          if (onSelectIncident) onSelectIncident(inc.id)
        })
      })

      // 2. Render Resources (Circular Blue / Teal Badges with ID & Category)
      resources.forEach((res) => {
        if (typeof res.latitude !== 'number' || typeof res.longitude !== 'number') return
        const isSelected = res.id === selectedResourceId
        const cat = (res.category || '').toLowerCase()

        let iconName = 'groups'
        let badgeBg = '#0284c7'
        if (cat === 'boat' || cat === 'water') {
          iconName = 'sailing'
          badgeBg = '#0369a1'
        } else if (cat === 'helicopter' || cat === 'aerial') {
          iconName = 'flight'
          badgeBg = '#0284c7'
        } else if (cat === 'drone') {
          iconName = 'videocam'
          badgeBg = '#0891b2'
        } else if (cat === 'fire') {
          iconName = 'local_fire_department'
          badgeBg = '#ea580c'
        } else if (cat === 'medical') {
          iconName = 'medical_services'
          badgeBg = '#059669'
        } else if (cat === 'police' || cat === 'police_army') {
          iconName = 'local_police'
          badgeBg = '#2563eb'
        }

        const resIcon = L.divIcon({
          className: 'custom-res-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 3px;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <div style="
                width: ${isSelected ? '24px' : '20px'};
                height: ${isSelected ? '24px' : '20px'};
                background: ${badgeBg};
                border: 1.5px solid #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 0 8px rgba(2, 132, 199, 0.7);
              ">
                <span class="material-symbols-outlined" style="font-size: 12px;">${iconName}</span>
              </div>
              <div style="
                background: rgba(11, 19, 41, 0.88);
                border: 1px solid rgba(56, 189, 248, 0.4);
                padding: 1px 4px;
                border-radius: 3px;
                color: #e2e8f0;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 8px;
                font-weight: bold;
                white-space: nowrap;
              ">
                ${res.id}
              </div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })

        const marker = L.marker([res.latitude, res.longitude], { icon: resIcon }).addTo(group)
        marker.on('click', () => {
          if (onSelectResource) onSelectResource(res.id)
        })
      })

      // 3. Render Shelters & Hospitals
      shelters.forEach((shl) => {
        if (typeof shl.latitude !== 'number' || typeof shl.longitude !== 'number') return
        const isHospital = shl.facility_type === 'Hospital' || (shl.name && shl.name.toLowerCase().includes('hospital'))

        const shlIcon = L.divIcon({
          className: 'custom-shl-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 3px;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <div style="
                width: 20px;
                height: 20px;
                background: ${isHospital ? '#9333ea' : '#10b981'};
                border: 1.5px solid #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
              ">
                <span class="material-symbols-outlined" style="font-size: 12px;">${isHospital ? 'local_hospital' : 'home'}</span>
              </div>
              <div style="
                background: rgba(11, 19, 41, 0.88);
                border: 1px solid ${isHospital ? 'rgba(147, 51, 234, 0.5)' : 'rgba(16, 185, 129, 0.5)'};
                padding: 1px 4px;
                border-radius: 3px;
                color: #f8fafc;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 8px;
                white-space: nowrap;
              ">
                ${shl.name}
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        L.marker([shl.latitude, shl.longitude], { icon: shlIcon }).addTo(group)
      })
    })
  }, [
    isLeafletReady,
    incidents,
    resources,
    shelters,
    selectedResourceId,
    selectedIncidentId,
    onSelectResource,
    onSelectIncident,
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
      {/* Bottom Left Legend */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 bg-[#0b1329]/90 border border-[#1e293b] px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          Incident
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300 ml-1">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
          Resource
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300 ml-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          Shelter
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300 ml-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
          Hospital
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
