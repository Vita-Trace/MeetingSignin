import { useState } from 'react'
import './AnimationPage.css'

function AnimationPage() {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [bootPhase, setBootPhase] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setConnecting(true)
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`)
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'checkin', name: name.trim() }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'checkin' && data.name === name.trim()) {
        setConnecting(false)
        setSubmitted(true)
        let phase = 0
        const timer = setInterval(() => {
          phase++
          setBootPhase(phase)
          if (phase >= 5) clearInterval(timer)
        }, 600)
        ws.close()
      } else if (data.type === 'checkin_duplicate') {
        setConnecting(false)
        alert('您已经签到过了！')
        ws.close()
      }
    }

    ws.onerror = () => {
      alert('连接失败，请重试')
      setConnecting(false)
    }
  }

  if (submitted) {
    return (
      <div className="cockpit-page">
        <div className="cockpit-bg"></div>
        <div className="cockpit-panel">
          <div className="panel-top">
            <div className="status-bar">
              <span className={`status-item ${bootPhase >= 1 ? 'active' : ''}`}>
                <span className="dot"></span> NEURAL LINK
              </span>
              <span className={`status-item ${bootPhase >= 2 ? 'active' : ''}`}>
                <span className="dot"></span> LIFE SUPPORT
              </span>
              <span className={`status-item ${bootPhase >= 3 ? 'active' : ''}`}>
                <span className="dot"></span> NAV SYSTEM
              </span>
            </div>
          </div>

          <div className="welcome-display">
            <div className="hud-frame">
              <div className="hud-corner tl"></div>
              <div className="hud-corner tr"></div>
              <div className="hud-corner bl"></div>
              <div className="hud-corner br"></div>
              
              <div className="pilot-info">
                <div className="pilot-label">PILOT REGISTERED</div>
                <div className="pilot-name">{name}</div>
                <div className="pilot-id">ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
              </div>
            </div>

            <div className={`boot-sequence ${bootPhase >= 4 ? 'complete' : ''}`}>
              <div className="boot-line">{'>'} Initializing neural interface...</div>
              <div className="boot-line">{bootPhase >= 1 && '> Connection established'}</div>
              <div className="boot-line">{bootPhase >= 2 && '> Synchronizing bio-metrics...'}</div>
              <div className="boot-line">{bootPhase >= 3 && '> Loading pilot profile...'}</div>
              <div className="boot-line success">{bootPhase >= 4 && '> BOARDING COMPLETE'}</div>
            </div>
          </div>

          <div className="control-panel">
            <div className="gauge">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="gauge-bg"/>
                <circle cx="50" cy="50" r="40" className={`gauge-fill ${bootPhase >= 5 ? 'full' : ''}`}/>
              </svg>
              <span className="gauge-label">SYNC</span>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="gauge-bg"/>
                <circle cx="50" cy="50" r="40" className={`gauge-fill ${bootPhase >= 4 ? 'full' : ''}`}/>
              </svg>
              <span className="gauge-label">LINK</span>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="gauge-bg"/>
                <circle cx="50" cy="50" r="40" className={`gauge-fill ${bootPhase >= 3 ? 'full' : ''}`}/>
              </svg>
              <span className="gauge-label">PWR</span>
            </div>
          </div>

          <div className="bottom-hint">
            {bootPhase >= 5 ? (
              <span className="ready">✓ READY FOR DEPARTURE</span>
            ) : (
              <span className="loading">INITIALIZING SYSTEMS...</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cockpit-page">
      <div className="cockpit-bg"></div>
      <div className="login-terminal">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span></span><span></span><span></span>
          </div>
          <span className="terminal-title">CREW AUTHENTICATION</span>
        </div>
        
        <div className="terminal-body">
          <div className="terminal-art">
{`    ╔══════════════════════╗
    ║   STARSHIP NEXUS-7   ║
    ║   BOARDING TERMINAL  ║
    ╚══════════════════════╝`}
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>PILOT CALLSIGN:</label>
              <div className="input-wrapper">
                <span className="prompt">&gt;</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENTER NAME"
                  autoFocus
                  autoComplete="off"
                />
                <span className="cursor"></span>
              </div>
            </div>
            
            <button type="submit" className="auth-button" disabled={connecting || !name.trim()}>
              <span className="btn-content">
                {connecting ? (
                  <>
                    <span className="spinner"></span>
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">⬡</span>
                    INITIATE BOARDING
                  </>
                )}
              </span>
              <span className="btn-border"></span>
            </button>
          </form>

          <div className="terminal-footer">
            <span>SYS.STATUS: ONLINE</span>
            <span>SEC.LEVEL: ALPHA</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnimationPage
