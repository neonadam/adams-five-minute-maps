import './VesselInfoPanel.css'

function VesselInfoPanel({ vessel, onClose, onSpotlight, isPirateTakeover, onPirateTakeover, onStopTakeover }) {
  if (!vessel) return null

  return (
    <div className="vessel-info-panel">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <div className="vessel-info-content">
        <h2>{vessel.name}</h2>
        <div className="info-row">
          <span className="info-label">ID:</span>
          <span className="info-value">{vessel.id}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Type:</span>
          <span className="info-value">{vessel.type}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Status:</span>
          <span className="info-value">{vessel.status}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Location:</span>
          <span className="info-value">
            {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Heading:</span>
          <span className="info-value">{vessel.heading}°</span>
        </div>
        <div className="info-row">
          <span className="info-label">Speed:</span>
          <span className="info-value">{vessel.speed} knots</span>
        </div>
        <div className="info-row">
          <span className="info-label">Destination:</span>
          <span className="info-value">{vessel.destination}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Flag:</span>
          <span className="info-value">{vessel.flag}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Length:</span>
          <span className="info-value">{vessel.length} m</span>
        </div>
        <div className="info-row">
          <span className="info-label">Tonnage:</span>
          <span className="info-value">
            {vessel.tonnage.toLocaleString()} tons
          </span>
        </div>
      </div>
      <div className="vessel-info-actions">
        <button className="spotlight-button" onClick={() => onSpotlight(vessel)}>
          Spotlight this vessel
        </button>
        {isPirateTakeover ? (
          <>
            <button className="stop-takeover-button" onClick={onStopTakeover}>
              Stop Takeover
            </button>
            <div className="pirate-instructions">
              Use W, A, S, D keys to move the vessel
            </div>
          </>
        ) : (
          <button className="pirate-takeover-button" onClick={() => onPirateTakeover(vessel)}>
            Pirate Takeover
          </button>
        )}
      </div>
    </div>
  )
}

export default VesselInfoPanel
