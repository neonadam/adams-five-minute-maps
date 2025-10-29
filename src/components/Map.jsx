import { useEffect, useRef } from 'react'
import { toLonLat } from 'ol/proj'
import { Map as OlMap, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { fromLonLat } from 'ol/proj'
import { Style, Icon, Fill, Stroke } from 'ol/style'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import 'ol/ol.css'

// Vessel type colors
const vesselTypeColors = {
  'Cargo Ship': '#3498db',
  'Tanker': '#e74c3c',
  'Container Ship': '#2ecc71',
  'Cruise Ship': '#9b59b6',
  'Fishing Vessel': '#f39c12',
  'Yacht': '#1abc9c',
  'Ferry': '#34495e',
  'Bulk Carrier': '#e67e22',
}

// Style cache for individual vessels
const vesselStyleCache = {}

// Create arrow SVG data URI
function createArrowSVG(color) {
  const svg = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2 L18 18 L10 14 L2 18 Z" 
          fill="${color}" 
          stroke="white" 
          stroke-width="1.2" 
          stroke-linejoin="round" 
          stroke-linecap="round"/>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// Create highlighted arrow SVG with glow effect
function createHighlightedArrowSVG(color) {
  const svg = `<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-${color.replace('#', '')}">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="15" cy="15" r="13" fill="${color}" opacity="0.3" filter="url(#glow-${color.replace('#', '')})"/>
    <path d="M15 4 L26 26 L15 20 L4 26 Z" 
          fill="${color}" 
          stroke="#fff" 
          stroke-width="2" 
          stroke-linejoin="round" 
          stroke-linecap="round"
          filter="url(#glow-${color.replace('#', '')})"/>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// Create pirate hat SVG - proper pirate hat design that rotates with vessel
function createPirateHatSVG(color) {
  const svg = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="hatGlow-${color.replace('#', '')}">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- Vessel arrow (centered at 25,25 for 50x50 SVG) -->
    <path d="M25 20 L38 42 L25 32 L12 42 Z" 
          fill="${color}" 
          stroke="#fff" 
          stroke-width="3" 
          stroke-linejoin="round" 
          stroke-linecap="round"/>
    <!-- Classic pirate hat with wide brim and tall crown -->
    <!-- Wide curved brim -->
    <ellipse cx="24" cy="6" rx="12" ry="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
    <!-- Tall crown -->
    <path d="M12 6 Q24 0 36 6 L33 16 Q24 13 15 16 Z" fill="#8B4513" stroke="#654321" stroke-width="2"/>
    <!-- Gold band -->
    <path d="M15 10 Q24 11 33 10" stroke="#FFD700" stroke-width="2.5" fill="none"/>
    <!-- Skull decoration -->
    <circle cx="24" cy="9" r="3" fill="#fff" stroke="#333" stroke-width="0.5"/>
    <circle cx="22.5" cy="8.5" r="0.8" fill="#333"/>
    <circle cx="25.5" cy="8.5" r="0.8" fill="#333"/>
    <path d="M22 10 Q24 10.5 26 10" stroke="#333" stroke-width="1" fill="none"/>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function getVesselBroadcast(vessel, isSelected = false, isPirateTakeover = false) {
  const color = vesselTypeColors[vessel.type] || '#7f8c8d'
  const heading = vessel.heading || 0
  const cacheKey = `${color}_${heading}_${isSelected}_${isPirateTakeover}`
  
  if (!vesselStyleCache[cacheKey]) {
    // Convert heading from degrees (0-360, where 0 is North) to radians
    // OpenLayers rotation is counterclockwise, and 0 is East
    // So we need: (90 - heading) * PI / 180
    const rotation = ((90 - heading) * Math.PI) / 180
    
    let arrowSrc
    let scale
    if (isPirateTakeover) {
      arrowSrc = createPirateHatSVG(color)
      scale = 1.0
    } else if (isSelected) {
      arrowSrc = createHighlightedArrowSVG(color)
      scale = 1.3
    } else {
      arrowSrc = createArrowSVG(color)
      scale = 0.9
    }
    
    vesselStyleCache[cacheKey] = new Style({
      image: new Icon({
        src: arrowSrc,
        rotation: rotation,
        anchor: [0.5, 0.5], // Anchor at the center point of the arrow
        scale: scale,
      }),
    })
  }
  return vesselStyleCache[cacheKey]
}

function Map({ vessels, ports, onVesselClick, onPortClick, zoomToVessel, selectedVessel, spotlightVessel, zoomToPort, spotlightPort, pirateTakeoverVessel, onVesselPositionUpdate }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const vectorLayerRef = useRef(null)
  const portsLayerRef = useRef(null)
  const allFeaturesRef = useRef([])
  const onVesselClickRef = useRef(onVesselClick)
  const onPortClickRef = useRef(onPortClick)
  const onVesselPositionUpdateRef = useRef(onVesselPositionUpdate)
  const currentZoomRef = useRef(null)
  const zoomToVesselRef = useRef(zoomToVessel)
  const pirateTakeoverVesselRef = useRef(pirateTakeoverVessel)

  // Keep the refs updated
  useEffect(() => {
    onVesselClickRef.current = onVesselClick
  }, [onVesselClick])

  useEffect(() => {
    onPortClickRef.current = onPortClick
  }, [onPortClick])

  useEffect(() => {
    onVesselPositionUpdateRef.current = onVesselPositionUpdate
  }, [onVesselPositionUpdate])

  useEffect(() => {
    zoomToVesselRef.current = zoomToVessel
  }, [zoomToVessel])

  useEffect(() => {
    pirateTakeoverVesselRef.current = pirateTakeoverVessel
  }, [pirateTakeoverVessel])

  // Handle keyboard controls for pirate takeover
  useEffect(() => {
    if (!pirateTakeoverVessel) return

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (!['w', 'a', 's', 'd'].includes(key)) return

      event.preventDefault()

      const feature = allFeaturesRef.current.find(
        f => f.get('vessel')?.id === pirateTakeoverVessel.id
      )

      if (!feature || !mapInstanceRef.current) return

      const geometry = feature.getGeometry()
      const currentCoord = geometry.getCoordinates()
      const [lon, lat] = toLonLat(currentCoord)

      // Move distance in degrees (approximately 0.002 degrees ≈ 200m at equator)
      const moveDistance = 0.002

      let newLon = lon
      let newLat = lat

      if (key === 'w') newLat += moveDistance // North
      if (key === 's') newLat -= moveDistance // South
      if (key === 'a') newLon -= moveDistance // West
      if (key === 'd') newLon += moveDistance // East

      // Update feature position
      const newCoord = fromLonLat([newLon, newLat])
      geometry.setCoordinates(newCoord)
      feature.changed() // Trigger feature change to ensure map updates

      // Update vessel data and notify parent
      if (onVesselPositionUpdateRef.current) {
        const updatedVessel = {
          ...pirateTakeoverVessel,
          longitude: newLon,
          latitude: newLat,
        }
        // Update the feature's stored vessel data
        feature.set('vessel', updatedVessel)
        
        onVesselPositionUpdateRef.current(updatedVessel)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pirateTakeoverVessel])

  // Handle zoom to vessel
  useEffect(() => {
    if (!zoomToVessel || !mapInstanceRef.current) return

    // Find the feature for this vessel
    const feature = allFeaturesRef.current.find(
      f => f.get('vessel')?.id === zoomToVessel.id
    )

    if (feature && mapInstanceRef.current) {
      const map = mapInstanceRef.current
      const geometry = feature.getGeometry()
      const coordinate = geometry.getCoordinates()
      
      // Zoom to the vessel location
      map.getView().animate({
        center: coordinate,
        zoom: 12,
        duration: 500,
      })

      // Trigger click on the vessel to show info panel
      setTimeout(() => {
        if (onVesselClickRef.current) {
          onVesselClickRef.current(zoomToVessel)
        }
      }, 600)
    }
  }, [zoomToVessel])

  // Update styles when selectedVessel or pirateTakeoverVessel changes
  useEffect(() => {
    if (!allFeaturesRef.current.length) return

    // Update styles for all features
    allFeaturesRef.current.forEach(feature => {
      const vessel = feature.get('vessel')
      if (vessel) {
        const isSelected = selectedVessel && vessel.id === selectedVessel.id
        const isPirateTakeover = pirateTakeoverVessel && vessel.id === pirateTakeoverVessel.id
        feature.setStyle(getVesselBroadcast(vessel, isSelected, isPirateTakeover))
      }
    })
  }, [selectedVessel, pirateTakeoverVessel])

  // Handle spotlight vessel (zoom to selected vessel)
  useEffect(() => {
    if (!spotlightVessel || !mapInstanceRef.current) return

    const feature = allFeaturesRef.current.find(
      f => f.get('vessel')?.id === spotlightVessel.id
    )

    if (feature && mapInstanceRef.current) {
      const map = mapInstanceRef.current
      const geometry = feature.getGeometry()
      const coordinate = geometry.getCoordinates()
      
      // Zoom to the vessel location at a nice zoom level
      map.getView().animate({
        center: coordinate,
        zoom: 14,
        duration: 500,
      })
    }
  }, [spotlightVessel])

  // Handle zoom to port (from search)
  useEffect(() => {
    if (!zoomToPort || !mapInstanceRef.current) return

    const map = mapInstanceRef.current
    const coordinate = fromLonLat([zoomToPort.longitude, zoomToPort.latitude])
    
    // Zoom to the port location at a nice zoom level to see nearby vessels
    map.getView().animate({
      center: coordinate,
      zoom: 11,
      duration: 500,
    })
  }, [zoomToPort])

  // Handle spotlight port (zoom to selected port)
  useEffect(() => {
    if (!spotlightPort || !mapInstanceRef.current) return

    const map = mapInstanceRef.current
    const coordinate = fromLonLat([spotlightPort.longitude, spotlightPort.latitude])
    
    // Zoom to the port location at a nice zoom level to see nearby vessels
    map.getView().animate({
      center: coordinate,
      zoom: 12,
      duration: 500,
    })
  }, [spotlightPort])

  // Function to determine how many vessels to show based on zoom
  function getVesselCountForZoom(zoom, totalCount) {
    if (zoom < 3) return Math.floor(totalCount * 0.2)  // 20% at very low zoom
    if (zoom < 4) return Math.floor(totalCount * 0.4)  // 40%
    if (zoom < 5) return Math.floor(totalCount * 0.6)  // 60%
    if (zoom < 6) return Math.floor(totalCount * 0.75)  // 75%
    if (zoom < 7) return Math.floor(totalCount * 0.9)  // 90%
    return totalCount  // 100% at higher zoom levels
  }

  // Function to update visible vessels based on current zoom
  function updateVisibleVessels() {
    if (!mapInstanceRef.current || !vectorLayerRef.current || !allFeaturesRef.current.length) return

    const map = mapInstanceRef.current
    const zoom = map.getView().getZoom()
    
    // Avoid unnecessary updates
    if (currentZoomRef.current === zoom) return
    currentZoomRef.current = zoom

    const vectorSource = vectorLayerRef.current.getSource()
    const maxVessels = getVesselCountForZoom(zoom, allFeaturesRef.current.length)
    
    // Clear current features
    vectorSource.clear()
    
    // Show subset based on zoom - use deterministic sampling based on zoom
    if (maxVessels >= allFeaturesRef.current.length) {
      // Show all
      vectorSource.addFeatures(allFeaturesRef.current)
    } else {
      // Show a subset - use a deterministic seed based on zoom for consistent sampling
      const step = Math.floor(allFeaturesRef.current.length / maxVessels)
      const featuresToShow = []
      for (let i = 0; i < allFeaturesRef.current.length && featuresToShow.length < maxVessels; i += step) {
        featuresToShow.push(allFeaturesRef.current[i])
      }
      // Fill remaining spots with random selection if needed
      while (featuresToShow.length < maxVessels && featuresToShow.length < allFeaturesRef.current.length) {
        const randomIndex = Math.floor(Math.random() * allFeaturesRef.current.length)
        if (!featuresToShow.includes(allFeaturesRef.current[randomIndex])) {
          featuresToShow.push(allFeaturesRef.current[randomIndex])
        }
      }
      vectorSource.addFeatures(featuresToShow)
    }
  }

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize OpenLayers map
    const map = new OlMap({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
        maxZoom: 18,
      }),
    })

    mapInstanceRef.current = map

    // Force map update after initialization
    setTimeout(() => {
      map.updateSize()
    }, 0)
    
    setTimeout(() => {
      map.updateSize()
    }, 100)
    
    setTimeout(() => {
      map.updateSize()
    }, 300)

    // Add click handler for vessels and ports
    const clickHandler = (event) => {
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const vessel = feature.get('vessel')
        const port = feature.get('port')
        
        // Prioritize port clicks
        if (port && onPortClickRef.current) {
          onPortClickRef.current(port)
          return true
        } else if (vessel && onVesselClickRef.current) {
          onVesselClickRef.current(vessel)
          return true
        }
        return false
      })
    }

    // Change cursor on hover
    const pointerHandler = (event) => {
      const hit = map.hasFeatureAtPixel(event.pixel)
      map.getViewport().style.cursor = hit ? 'pointer' : ''
    }

    // Handle zoom change to update visible vessels
    const zoomChangeHandler = () => {
      updateVisibleVessels()
    }

    map.on('click', clickHandler)
    map.on('pointermove', pointerHandler)
    map.getView().on('change:resolution', zoomChangeHandler)

    // Handle window resize
    const handleResize = () => {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.updateSize()
        }
      }, 100)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      map.un('click', clickHandler)
      map.un('pointermove', pointerHandler)
      map.getView().un('change:resolution', zoomChangeHandler)
      window.removeEventListener('resize', handleResize)
      map.setTarget(null)
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !vessels.length) return
    
    const map = mapInstanceRef.current
    
    // Remove existing vector layer if it exists
    if (vectorLayerRef.current) {
      map.removeLayer(vectorLayerRef.current)
      vectorLayerRef.current = null
      allFeaturesRef.current = []
    }

    // Create all features asynchronously in batches
    const createFeatures = () => {
      allFeaturesRef.current = []
      
      // Process in batches to avoid blocking
      const batchSize = 500
      let index = 0

      const processBatch = () => {
        const end = Math.min(index + batchSize, vessels.length)
        
        for (let i = index; i < end; i++) {
          const vessel = vessels[i]
          
          // Validate coordinates
          if (
            typeof vessel.longitude !== 'number' ||
            typeof vessel.latitude !== 'number' ||
            isNaN(vessel.longitude) ||
            isNaN(vessel.latitude) ||
            vessel.longitude < -180 ||
            vessel.longitude > 180 ||
            vessel.latitude < -90 ||
            vessel.latitude > 90
          ) {
            continue
          }

          const feature = new Feature({
            geometry: new Point(fromLonLat([vessel.longitude, vessel.latitude])),
            vessel: vessel,
          })

          // Set style based on vessel (type + heading for arrow rotation)
          // Style will be updated when selectedVessel or pirateTakeoverVessel changes
          feature.setStyle(getVesselBroadcast(vessel, false, false))
          // Store vessel data in feature for later reference
          feature.set('vessel', vessel)
          allFeaturesRef.current.push(feature)
        }

        index = end

        if (index < vessels.length) {
          // Use requestAnimationFrame for smooth processing
          requestAnimationFrame(processBatch)
        } else {
          // All features created, now create vector layer with empty source
          const vectorSource = new VectorSource()
          
          const vectorLayer = new VectorLayer({
            source: vectorSource,
          })

          map.addLayer(vectorLayer)
          vectorLayerRef.current = vectorLayer
          
          // Update visible vessels based on initial zoom
          currentZoomRef.current = null
          updateVisibleVessels()
          
          // Force map update
          setTimeout(() => {
            map.updateSize()
          }, 100)
        }
      }

      requestAnimationFrame(processBatch)
    }

    try {
      createFeatures()
    } catch (error) {
      console.error('Error creating vessel features:', error)
    }

    return () => {
      if (vectorLayerRef.current && map) {
        map.removeLayer(vectorLayerRef.current)
        vectorLayerRef.current = null
        allFeaturesRef.current = []
      }
    }
  }, [vessels])

  // Create port markers
  useEffect(() => {
    if (!mapInstanceRef.current || !ports || ports.length === 0) return

    const map = mapInstanceRef.current

    // Remove existing ports layer if it exists
    if (portsLayerRef.current) {
      map.removeLayer(portsLayerRef.current)
      portsLayerRef.current = null
    }

    const portSource = new VectorSource()
    const portStyleCache = {}

    ports.forEach(port => {
      // Create port icon SVG - smaller green circle with white outline
      const portSVG = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="#2ecc71" stroke="#fff" stroke-width="2"/>
      </svg>`
      const portSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(portSVG)}`

      if (!portStyleCache[portSrc]) {
        portStyleCache[portSrc] = new Style({
          image: new Icon({
            src: portSrc,
            anchor: [0.5, 0.5],
            scale: 0.8,
          }),
        })
      }

      const feature = new Feature({
        geometry: new Point(fromLonLat([port.longitude, port.latitude])),
        port: port,
      })

      feature.setStyle(portStyleCache[portSrc])
      portSource.addFeature(feature)
    })

    const portLayer = new VectorLayer({
      source: portSource,
    })

    map.addLayer(portLayer)
    portsLayerRef.current = portLayer

    return () => {
      if (portsLayerRef.current && map) {
        map.removeLayer(portsLayerRef.current)
        portsLayerRef.current = null
      }
    }
  }, [ports])

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#e5e3df'
      }} 
    />
  )
}

export default Map