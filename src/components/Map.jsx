import { useEffect, useRef } from 'react'
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

function getVesselBroadcast(vessel, isSelected = false) {
  const color = vesselTypeColors[vessel.type] || '#7f8c8d'
  const heading = vessel.heading || 0
  const cacheKey = `${color}_${heading}_${isSelected}`
  
  if (!vesselStyleCache[cacheKey]) {
    // Convert heading from degrees (0-360, where 0 is North) to radians
    // OpenLayers rotation is counterclockwise, and 0 is East
    // So we need: (90 - heading) * PI / 180
    const rotation = ((90 - heading) * Math.PI) / 180
    
    const arrowSrc = isSelected ? createHighlightedArrowSVG(color) : createArrowSVG(color)
    const scale = isSelected ? 1.3 : 0.9
    
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

function Map({ vessels, onVesselClick, zoomToVessel, selectedVessel, spotlightVessel }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const vectorLayerRef = useRef(null)
  const allFeaturesRef = useRef([])
  const onVesselClickRef = useRef(onVesselClick)
  const currentZoomRef = useRef(null)
  const zoomToVesselRef = useRef(zoomToVessel)

  // Keep the refs updated
  useEffect(() => {
    onVesselClickRef.current = onVesselClick
  }, [onVesselClick])

  useEffect(() => {
    zoomToVesselRef.current = zoomToVessel
  }, [zoomToVessel])

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

  // Update styles when selectedVessel changes
  useEffect(() => {
    if (!selectedVessel || !allFeaturesRef.current.length) {
      // Clear all highlights if no vessel is selected
      allFeaturesRef.current.forEach(feature => {
        const vessel = feature.get('vessel')
        if (vessel) {
          feature.setStyle(getVesselBroadcast(vessel, false))
        }
      })
      return
    }

    // Update styles for all features
    allFeaturesRef.current.forEach(feature => {
      const vessel = feature.get('vessel')
      if (vessel) {
        const isSelected = vessel.id === selectedVessel.id
        feature.setStyle(getVesselBroadcast(vessel, isSelected))
      }
    })
  }, [selectedVessel])

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

    // Add click handler - only for individual vessels
    const clickHandler = (event) => {
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const vessel = feature.get('vessel')
        if (vessel && onVesselClickRef.current) {
          onVesselClickRef.current(vessel)
        }
        return true
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
          // Style will be updated when selectedVessel changes
          feature.setStyle(getVesselBroadcast(vessel, false))
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