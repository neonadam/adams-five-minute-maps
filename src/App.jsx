import { useState, useEffect, useCallback } from 'react'
import Map from './components/Map'
import VesselInfoPanel from './components/VesselInfoPanel'
import SearchBox from './components/SearchBox'
import './App.css'

function App() {
  const [vessels, setVessels] = useState([])
  const [selectedVessel, setSelectedVessel] = useState(null)
  const [zoomToVessel, setZoomToVessel] = useState(null)
  const [spotlightVessel, setSpotlightVessel] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const handleVesselClick = useCallback((vessel) => {
    setSelectedVessel(vessel)
  }, [])

  const handleVesselSearch = useCallback((vessel) => {
    setSelectedVessel(vessel)
    setZoomToVessel(vessel)
    // Clear the zoom trigger after a delay
    setTimeout(() => {
      setZoomToVessel(null)
    }, 100)
  }, [])

  const handleSpotlight = useCallback((vessel) => {
    setSpotlightVessel(vessel)
    // Clear the spotlight trigger after animation
    setTimeout(() => {
      setSpotlightVessel(null)
    }, 600)
  }, [])

  useEffect(() => {
    // Load vessel data
    fetch('/vessel-data.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load vessel data: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log(`Loaded ${data.length} vessels`)
        setVessels(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load vessel data:', err)
        setVessels([])
        setLoading(false)
      })
  }, [])

  return (
    <div className="app">
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'white',
          padding: '20px 40px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '16px'
        }}>
          Loading vessel data...
        </div>
      )}
      <SearchBox 
        vessels={vessels} 
        onVesselSelect={handleVesselSearch}
      />
      <Map 
        vessels={vessels} 
        onVesselClick={handleVesselClick}
        zoomToVessel={zoomToVessel}
        selectedVessel={selectedVessel}
        spotlightVessel={spotlightVessel}
      />
      <VesselInfoPanel 
        vessel={selectedVessel} 
        onClose={() => setSelectedVessel(null)}
        onSpotlight={handleSpotlight}
      />
    </div>
  )
}

export default App
