import { useState, useEffect, useCallback } from 'react'
import Map from './components/Map'
import VesselInfoPanel from './components/VesselInfoPanel'
import SearchBox from './components/SearchBox'
import './App.css'

function App() {
  const [vessels, setVessels] = useState([])
  const [selectedVessel, setSelectedVessel] = useState(null)
  const [zoomToVessel, setZoomToVessel] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const handleVesselClick = useCallback((vessel) => {
    setSelectedVessel(vessel)
  }, [])

  const handleVesselSearch = useCallback((vessel) => {
    setZoomToVessel(vessel)
    // Clear the zoom trigger after a delay
    setTimeout(() => {
      setZoomToVessel(null)
    }, 100)
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
      />
      <VesselInfoPanel 
        vessel={selectedVessel} 
        onClose={() => setSelectedVessel(null)} 
      />
    </div>
  )
}

export default App
