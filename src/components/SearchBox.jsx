import { useState, useRef, useEffect } from 'react'
import './SearchBox.css'

function SearchBox({ vessels, ports, onVesselSelect, onPortSelect }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setResults([])
      setIsOpen(false)
      return
    }

    const query = searchTerm.toLowerCase()
    const matched = []
    
    // Search vessels
    if (vessels) {
      vessels
        .filter(vessel => 
          vessel.name.toLowerCase().includes(query) ||
          vessel.id.toLowerCase().includes(query)
        )
        .slice(0, 5)
        .forEach(v => matched.push({ ...v, type: 'vessel' }))
    }
    
    // Search ports
    if (ports) {
      ports
        .filter(port => 
          port.name.toLowerCase().includes(query) ||
          port.country.toLowerCase().includes(query)
        )
        .slice(0, 5)
        .forEach(p => matched.push({ ...p, type: 'port' }))
    }
    
    setResults(matched.slice(0, 10)) // Limit to 10 total results
    setIsOpen(matched.length > 0)
    setSelectedIndex(-1)
  }, [searchTerm, vessels, ports])

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSelect = (item) => {
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    if (item.type === 'vessel') {
      onVesselSelect(item)
    } else if (item.type === 'port') {
      onPortSelect(item)
    }
  }

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setResults([])
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="search-box-container">
      <div className="search-box-wrapper" ref={searchRef}>
        <input
          type="text"
          className="search-input"
          placeholder="Search vessels or ports..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true)
            }
          }}
        />
        {searchTerm && (
          <button
            className="search-clear"
            onClick={() => {
              setSearchTerm('')
              setResults([])
              setIsOpen(false)
            }}
          >
            ×
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="search-results" ref={resultsRef}>
          {results.map((item, index) => (
            <div
              key={item.id}
              className={`search-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-name">
                {item.name}
                {item.type === 'port' && <span className="result-badge">Port</span>}
              </div>
              <div className="result-details">
                {item.type === 'vessel' 
                  ? `${item.id} • ${item.type}` 
                  : `${item.country} • Port`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBox
