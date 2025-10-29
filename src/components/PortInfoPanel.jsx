import './PortInfoPanel.css'

function PortInfoPanel({ port, onClose, onSpotlight }) {
  if (!port) return null

  return (
    <div className="port-info-panel">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <div className="port-info-content">
        <h2>{port.name}</h2>
        <div className="info-row">
          <span className="info-label">Country:</span>
          <span className="info-value">{port.country}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Location:</span>
          <span className="info-value">
            {port.latitude.toFixed(4)}, {port.longitude.toFixed(4)}
          </span>
        </div>
      </div>
      <div className="port-info-actions">
        <button className="spotlight-button" onClick={() => onSpotlight(port)}>
          Spotlight this port
        </button>
      </div>
    </div>
  )
}

export default PortInfoPanel
