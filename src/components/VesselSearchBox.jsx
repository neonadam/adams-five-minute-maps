import { useState, useRef, useEffect } from 'react'
import './VesselSearchBox.css'

function VesselSearchBox({ vessels, onVesselSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const searchQuery = query.toLowerCase().trim()
    const matchingVessels = vessels
      .filter(vessel => 
        vessel.name.toLowerCase().includes(searchQuery) ||
        vessel.id.toLowerCase().includes(searchQuery)
      )
      .slice(0, 10) // Limit to 10 results

    setResults(matchingVessels)
    setShowResults(matchingVessels.length > 0)
    setSelectedIndex(-1)
  }, [query, vessels])

  const handleInputChange = (e) => {
    setQuery(e.target.value)
  }

  const handleVesselSelect = (vessel) => {
    setQuery(vessel.name)
    setShowResults(false)
    setSelectedIndex(-1)
    if (onVesselSelect) {
      onVesselSelect(vessel)
    }
  }

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleVesselSelect(results[selectedIndex])
      } else if (results.length > 0) {
        handleVesselSelect(results[0])
      }
    } else if (e.key === 'Escape') {
      setShowResults(false)
      setSelectedIndex(-1)
    }
  }

  const handleFocus = () => {
    if (results.length > 0) {
      setShowResults(true)
    }
  }

  const handleBlur = (e) => {
    // Delay hiding results to allow click events
    setTimeout(() => {
      if (!resultsRef.current?.contains(e.relatedTarget)) {
        setShowResults(false)
      }
    }, 200)
  }

  return (
    <div className="vessel-search-box">
      <div className="search-input-wrapper">
        <svg 
          className="search-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search for a vessel..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {query && (
          <button
            className="clear-button"
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
              inputRef.current?.focus()
            }}
          >
            ×
          </button>
        )}
      </div>
      {showResults && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="search-results"
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
          {results.map((vessel, index) => (
            <div
              key={vessel.id}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleVesselSelect(vessel)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-name">{vessel.name}</div>
              <div className="result-id">{vessel.id}</div>
              <div className="result-type">{vessel.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VesselSearchBox
