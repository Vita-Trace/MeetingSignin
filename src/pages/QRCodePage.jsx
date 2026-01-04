import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect, useRef, useCallback } from 'react'
import './QRCodePage.css'

function QRCodePage() {
  const [url, setUrl] = useState('')
  const [names, setNames] = useState([])
  const [checkinList, setCheckinList] = useState([])
  const wsRef = useRef(null)
  const idCounter = useRef(0)
  const reconnectTimer = useRef(null)

  const addMeteor = useCallback((name) => {
    const id = idCounter.current++
    const meteor = {
      id,
      name,
      left: 30 + Math.random() * 50,
      delay: Math.random() * 0.3,
      duration: 4 + Math.random() * 2
    }
    
    setNames(prev => [...prev, meteor])
    setCheckinList(prev => [{ name, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50))
    
    setTimeout(() => {
      setNames(prev => prev.filter(m => m.id !== id))
    }, (meteor.duration + meteor.delay) * 1000 + 500)
  }, [])

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'checkin') {
        addMeteor(data.name)
      }
    }

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connectWS, 2000)
    }

    ws.onerror = () => ws.close()
  }, [addMeteor])

  useEffect(() => {
    const host = window.location.origin
    setUrl(`${host}/animation`)
    connectWS()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connectWS])

  return (
    <div className="scifi-page">
      {/* 视频背景 */}
      <video className="video-bg" autoPlay loop muted playsInline>
        <source src="/280905_small.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
      
      {/* 背景网格 */}
      <div className="grid-bg"></div>
      <div className="scan-line"></div>
      
      {/* 流星名字 */}
      <div className="meteors-container">
        {names.map(m => (
          <div
            key={m.id}
            className="meteor"
            style={{
              left: `${m.left}%`,
              animationDelay: `${m.delay}s`,
              animationDuration: `${m.duration}s`
            }}
          >
            <div className="meteor-trail"></div>
            <div className="meteor-head">{m.name}</div>
          </div>
        ))}
      </div>

      {/* 左侧签到名单 */}
      <div className="left-panel">
        <div className="panel-frame">
          <div className="panel-header">
            <span className="blink">●</span> CREW MANIFEST
          </div>
          <div className="panel-content">
            {checkinList.length === 0 ? (
              <div className="empty-list">等待船员登记...</div>
            ) : (
              checkinList.map((item, i) => (
                <div key={i} className="crew-item" style={{animationDelay: `${i * 0.05}s`}}>
                  <span className="crew-name">{item.name}</span>
                  <span className="crew-time">{item.time}</span>
                </div>
              ))
            )}
          </div>
          <div className="panel-footer">
            TOTAL: {checkinList.length} CREW MEMBERS
          </div>
        </div>
      </div>

      {/* 中间二维码 */}
      <div className="center-content">
        <div className="title-area">
          <div className="title-line"></div>
          <h1>STARSHIP CHECK-IN</h1>
          <div className="title-line"></div>
        </div>
        
        <div className="qr-frame">
          <div className="corner tl"></div>
          <div className="corner tr"></div>
          <div className="corner bl"></div>
          <div className="corner br"></div>
          <div className="qr-inner">
            {url && (
              <QRCodeSVG
                value={url}
                size={240}
                level="H"
                bgColor="transparent"
                fgColor="#0ff"
              />
            )}
          </div>
          <div className="qr-glow"></div>
        </div>

        <p className="instruction">
          <span className="blink">&gt;</span> SCAN TO BOARD <span className="blink">&lt;</span>
        </p>
      </div>

      {/* 右侧装饰面板 */}
      <div className="right-panel">
        <div className="status-block">
          <div className="status-label">SYSTEM STATUS</div>
          <div className="status-value online">ONLINE</div>
        </div>
        <div className="status-block">
          <div className="status-label">BOARDING GATE</div>
          <div className="status-value">GATE-07</div>
        </div>
        <div className="status-block">
          <div className="status-label">DESTINATION</div>
          <div className="status-value">ANDROMEDA</div>
        </div>
        <div className="data-stream">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="data-line" style={{animationDelay: `${i * 0.2}s`}}>
              {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QRCodePage
