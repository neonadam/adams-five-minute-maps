import { useState, useEffect, useCallback } from 'react'
import Map from './components/Map'
import VesselInfoPanel from './components/VesselInfoPanel'
import PortInfoPanel from './components/PortInfoPanel'
import SearchBox from './components/SearchBox'
import './App.css'

function App() {
  const [vessels, setVessels] = useState([])
  const [ports, setPorts] = useState([])
  const [selectedVessel, setSelectedVessel] = useState(null)
  const [selectedPort, setSelectedPort] = useState(null)
  const [zoomToVessel, setZoomToVessel] = useState(null)
  const [zoomToPort, setZoomToPort] = useState(null)
  const [spotlightVessel, setSpotlightVessel] = useState(null)
  const [spotlightPort, setSpotlightPort] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const handleVesselClick = useCallback((vessel) => {
    setSelectedVessel(vessel)
    setSelectedPort(null) // Close port panel when vessel is selected
  }, [])

  const handlePortClick = useCallback((port) => {
    setSelectedPort(port)
    setSelectedVessel(null) // Close vessel panel when port is selected
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

  const handlePortSpotlight = useCallback((port) => {
    setSpotlightPort(port)
    // Clear the spotlight trigger after animation
    setTimeout(() => {
      setSpotlightPort(null)
    }, 600)
  }, [])

  useEffect(() => {
    // Load vessel data
    Promise.all([
      fetch('/vessel-data.json').then(res => {
        if (!res.ok) throw new Error(`Failed to load vessel data: ${res.status}`)
        return res.json()
      }),
      fetch('/ports-data.json').then(res => {
        if (!res.ok) throw new Error(`Failed to load ports data: ${res.status}`)
        return res.json()
      })
    ])
      .then(([vesselsData, portsData]) => {
        console.log(`Loaded ${vesselsData.length} vessels and ${portsData.length} ports`)
        setVessels(vesselsData)
        setPorts(portsData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setVessels([])
        setPorts([])
        setLoading(false)
      })
  }, [])

  const handlePortSearch = useCallback((port) => {
    setSelectedPort(port)
    setSelectedVessel(null) // Close vessel panel when port is selected
    setZoomToPort(port)
    // Clear the zoom trigger after a delay
    setTimeout(() => {
      setZoomToPort(null)
    }, 100)
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
        ports={ports}
        onVesselSelect={handleVesselSearch}
        onPortSelect={handlePortSearch}
      />
      <Map 
        vessels={vessels}
        ports={ports}
        onVesselClick={handleVesselClick}
        onPortClick={handlePortClick}
        zoomToVessel={zoomToVessel}
        zoomToPort={zoomToPort}
        selectedVessel={selectedVessel}
        spotlightVessel={spotlightVessel}
        spotlightPort={spotlightPort}
      />
      <VesselInfoPanel 
        vessel={selectedVessel} 
        onClose={() => setSelectedVessel(null)}
        onSpotlight={handleSpotlight}
      />
      <PortInfoPanel 
        port={selectedPort} 
        onClose={() => setSelectedPort(null)}
        onSpotlight={handlePortSpotlight}
      />
    </div>
  )
}

export default App
