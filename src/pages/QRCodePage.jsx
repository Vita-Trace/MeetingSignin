import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Animator } from '@arwes/react-animator'
import { Animated } from '@arwes/react-animated'
import './QRCodePage.css'

function QRCodePage() {
  const [url, setUrl] = useState('')
  const [names, setNames] = useState([])
  const [checkinList, setCheckinList] = useState([])
  const [toasts, setToasts] = useState([])
  const [wsStatus, setWsStatus] = useState('connecting') // connecting | online | offline
  const [perMin, setPerMin] = useState(0)
  const [peakPerMin, setPeakPerMin] = useState(0)
  const [recentPulseKey, setRecentPulseKey] = useState(0)
  const wsRef = useRef(null)
  const idCounter = useRef(0)
  const reconnectTimer = useRef(null)
  const toastTimersRef = useRef(new Map())
  const toastCleanupTimersRef = useRef(new Map())
  const toastsRef = useRef([])
  const centerContentRef = useRef(null)
  const centerBoundsRef = useRef(null)
  const leftPanelRef = useRef(null)
  const rightPanelRef = useRef(null)
  const leftBoundsRef = useRef(null)
  const rightBoundsRef = useRef(null)
  const viewportRef = useRef({ width: 0, height: 0 })
  const telemetryLinesRef = useRef(null)
  const checkinTimesRef = useRef([])
  const TOAST_DISPLAY_MS = 2000
  const TOAST_EXIT_MS = 600

  if (!telemetryLinesRef.current) {
    const toHex = (num, len) => num.toString(16).toUpperCase().padStart(len, '0')
    telemetryLinesRef.current = Array.from({ length: 18 }, (_, i) => {
      const a = (0xC0FFEE ^ (i * 2654435761)) >>> 0
      const b = (0x1A2B3C ^ (i * 2246822519)) >>> 0
      const tag = i % 6 === 0 ? 'SYS' : i % 6 === 1 ? 'NET' : i % 6 === 2 ? 'GATE' : i % 6 === 3 ? 'AUTH' : i % 6 === 4 ? 'TLM' : 'IO'
      return {
        id: `tlm-${i}`,
        hot: i % 7 === 0 || i % 11 === 0,
        text: `${tag} ${toHex(a, 8)}-${toHex(b & 0xffff, 4)}  CRC:${toHex((a ^ b) & 0xffff, 4)}`
      }
    })
  }

  const refreshRates = useCallback(() => {
    const now = Date.now()

    const recent = checkinTimesRef.current.filter(t => now - t < 60_000)
    checkinTimesRef.current = checkinTimesRef.current.filter(t => now - t < 10 * 60_000)

    const nextPerMin = recent.length
    setPerMin(nextPerMin)
    setPeakPerMin(prev => Math.max(prev, nextPerMin))
  }, [])

  useEffect(() => {
    toastsRef.current = toasts
  }, [toasts])

  useEffect(() => {
    const updateBounds = () => {
      viewportRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      }
      if (centerContentRef.current) {
        centerBoundsRef.current = centerContentRef.current.getBoundingClientRect()
      }
      if (leftPanelRef.current) {
        leftBoundsRef.current = leftPanelRef.current.getBoundingClientRect()
      }
      if (rightPanelRef.current) {
        rightBoundsRef.current = rightPanelRef.current.getBoundingClientRect()
      }
    }
    updateBounds()
    window.addEventListener('resize', updateBounds)
    return () => window.removeEventListener('resize', updateBounds)
  }, [])

  const getToastPosition = useCallback(() => {
    const { width, height } = viewportRef.current
    const rect = centerBoundsRef.current
    const leftRect = leftBoundsRef.current
    const rightRect = rightBoundsRef.current
    const toastWidth = Math.min(560, width - 60)
    const toastHeight = 180
    const margin = 20

    if (!width || !height || !rect || !leftRect || !rightRect) {
      return { x: 40 + Math.random() * 200, y: 60 + Math.random() * 120 }
    }

    const columnLeft = Math.min(width - margin, leftRect.right + margin)
    const columnRight = Math.max(margin, rightRect.left - margin)
    const columnWidth = columnRight - columnLeft

    if (columnWidth < toastWidth * 0.8) {
      return { x: columnLeft, y: Math.max(margin, rect.top - toastHeight - margin) }
    }

    const safeAreas = [
      {
        x: columnLeft,
        y: margin,
        w: columnWidth,
        h: rect.top - margin
      },
      {
        x: columnLeft,
        y: rect.bottom + margin,
        w: columnWidth,
        h: height - rect.bottom - margin
      }
    ].filter(area => area.h > toastHeight * 0.8)

    const target = safeAreas.length
      ? safeAreas[Math.floor(Math.random() * safeAreas.length)]
      : safeAreas[0] || {
          x: columnLeft,
          y: margin,
          w: columnWidth,
          h: Math.max(120, rect.top - margin)
        }

    const maxX = Math.max(target.x, target.x + target.w - toastWidth)
    const maxY = Math.max(target.y, target.y + target.h - toastHeight)
    const x = target.x + Math.random() * Math.max(0, maxX - target.x)
    const y = target.y + Math.random() * Math.max(0, maxY - target.y)

    return { x, y }
  }, [])

  const scheduleToastRemoval = useCallback((toastId) => {
    if (toastCleanupTimersRef.current.has(toastId)) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== toastId))
      toastCleanupTimersRef.current.delete(toastId)
    }, TOAST_EXIT_MS)
    toastCleanupTimersRef.current.set(toastId, timer)
  }, [TOAST_EXIT_MS])

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.map(item => (item.id === toastId ? { ...item, dismissed: true } : item)))
    const timer = toastTimersRef.current.get(toastId)
    if (timer) {
      clearTimeout(timer)
      toastTimersRef.current.delete(toastId)
    }
    scheduleToastRemoval(toastId)
  }, [scheduleToastRemoval])

  const scheduleToastAutoDismiss = useCallback((toastId) => {
    const timer = setTimeout(() => dismissToast(toastId), TOAST_DISPLAY_MS)
    toastTimersRef.current.set(toastId, timer)
  }, [dismissToast, TOAST_DISPLAY_MS])

  const addMeteor = useCallback((name) => {
    const id = idCounter.current++
    const time = new Date().toLocaleTimeString()
    const meteor = {
      id,
      name,
      left: 30 + Math.random() * 50,
      delay: Math.random() * 0.3,
      duration: 4 + Math.random() * 2
    }
    
    setNames(prev => [...prev, meteor])
    setCheckinList(prev => [{ name, time }, ...prev].slice(0, 50))

    checkinTimesRef.current.push(Date.now())
    refreshRates()

    toastsRef.current.forEach((item) => {
      if (!item.dismissed) {
        dismissToast(item.id)
      }
    })
    const position = getToastPosition()
    const toast = {
      id,
      name,
      time,
      x: position.x,
      y: position.y,
      dismissed: false
    }
    setToasts(prev => [...prev, toast])
    scheduleToastAutoDismiss(toast.id)

    setRecentPulseKey(prev => prev + 1)
    
    setTimeout(() => {
      setNames(prev => prev.filter(m => m.id !== id))
    }, (meteor.duration + meteor.delay) * 1000 + 500)
  }, [dismissToast, getToastPosition, refreshRates, scheduleToastAutoDismiss])

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    
    setWsStatus('connecting')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => setWsStatus('online')

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'checkin') {
        addMeteor(data.name)
      }
    }

    ws.onclose = () => {
      setWsStatus('offline')
      reconnectTimer.current = setTimeout(connectWS, 2000)
    }

    ws.onerror = () => {
      setWsStatus('offline')
      ws.close()
    }
  }, [addMeteor])

  useEffect(() => {
    const host = window.location.origin
    setUrl(`${host}/animation`)
    connectWS()

    const interval = setInterval(refreshRates, 1000)
    return () => {
      clearTimeout(reconnectTimer.current)
      toastTimersRef.current.forEach(timer => clearTimeout(timer))
      toastTimersRef.current.clear()
      toastCleanupTimersRef.current.forEach(timer => clearTimeout(timer))
      toastCleanupTimersRef.current.clear()
      clearInterval(interval)
      wsRef.current?.close()
    }
  }, [connectWS, refreshRates])

  const recentNames = checkinList.slice(0, 5)

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
      <div className="hud-overlay">
        <div className="hud-lines"></div>
        <div className="hud-paths">
          <span className="hud-path path-1"></span>
          <span className="hud-path path-2"></span>
          <span className="hud-path path-3"></span>
        </div>
        <div className="hud-nodes">
          <span className="hud-node node-1"></span>
          <span className="hud-node node-2"></span>
          <span className="hud-node node-3"></span>
          <span className="hud-node node-4"></span>
          <span className="hud-node node-5"></span>
          <span className="hud-node node-6"></span>
          <span className="hud-node node-7"></span>
          <span className="hud-node node-8"></span>
        </div>
      </div>

      {/* 签到确认弹层 */}
      {toasts.map(toast => (
        <Animator
          key={toast.id}
          duration={{ enter: 0.35, exit: 0.6 }}
          active={!toast.dismissed}
        >
          <Animated
            className="checkin-toast"
            animated="fade"
            hideOnExited={false}
            style={{ top: toast.y, left: toast.x }}
          >
            <div className="toast-frame">
              <div className="toast-corner tl"></div>
              <div className="toast-corner tr"></div>
              <div className="toast-corner bl"></div>
              <div className="toast-corner br"></div>
              <div className="toast-badges">
                <span className="toast-badge">ACCESS GRANTED</span>
                <span className="toast-badge">BOARDING CONFIRMED</span>
              </div>
              <div className="toast-title">年会签到成功</div>
              <div className="toast-subtitle">欢迎入场</div>
              <div className="toast-name">{toast.name}</div>
              <div className="toast-meta">TIME {toast.time}</div>
            </div>
            <div className="toast-scan"></div>
          </Animated>
        </Animator>
      ))}
      
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
      <div className="left-panel" ref={leftPanelRef}>
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
      <div className="center-content" ref={centerContentRef}>
        <div className="title-area">
          <div className="title-line"></div>
          <h1>STARSHIP CHECK-IN</h1>
          <div className="title-line"></div>
        </div>

        <div className="qr-stack">
          <div className="qr-title">
            <span className="qr-title-line"></span>
            <span className="qr-title-text">Annual meeting sign-in system</span>
            <span className="qr-title-line"></span>
          </div>

          <div className="qr-bay">
            <div className="dock-door left"></div>
            <div className="qr-core">
              <div className="hud-ring ring-one"></div>
              <div className="hud-ring ring-two"></div>
              <div className="hud-ring ring-three"></div>
              <div className="shield-pulse"></div>
              <div className="door-seam"></div>
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
                      fgColor="var(--ui-cyan)"
                    />
                  )}
                </div>
                <div className="qr-glow"></div>
              </div>
            </div>
            <div className="dock-door right"></div>
          </div>

          <div className="holo-cone"></div>

          <p className="instruction">
            <span className="blink">&gt;</span> SCAN TO BOARD <span className="blink">&lt;</span>
          </p>

          <div key={recentPulseKey} className="recent-strip">
            <div className="recent-label">最近入场</div>
            {recentNames.length ? (
              <div className="recent-names">
                {recentNames.map((item, i) => (
                  <div key={`${item.name}-${item.time}-${i}`} className={`recent-name ${i === 0 ? 'latest' : ''}`}>
                    {item.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="recent-empty">等待签到...</div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧装饰面板 */}
      <div className="right-panel" ref={rightPanelRef}>
        <div className="status-block">
          <div className="status-label">SYSTEM STATUS</div>
          <div className={`status-value ${wsStatus}`}>
            {wsStatus === 'online' ? 'ONLINE' : wsStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
          </div>
        </div>
        <div className="status-block">
          <div className="status-label">TOTAL</div>
          <div className="status-value">{checkinList.length}</div>
        </div>
        <div className="status-block">
          <div className="status-label">PER MIN</div>
          <div className="status-value">{perMin}</div>
        </div>
        <div className="status-block">
          <div className="status-label">PEAK / MIN</div>
          <div className="status-value">{peakPerMin}</div>
        </div>
        <div className="status-block docking-block">
          <div className="docking-row">
            <span className="docking-label">DOCKING QUEUE</span>
            <span className="docking-value">{String(perMin).padStart(2, '0')}</span>
          </div>
          <div className="docking-row">
            <span className="docking-label">BOARDING CHANNEL</span>
            <span className={`docking-value ${wsStatus}`}>
              {wsStatus === 'online' ? 'OPEN' : wsStatus === 'connecting' ? 'SYNC' : 'LOCKED'}
            </span>
          </div>
        </div>
        <div className="data-stream">
          <div className="data-stream-inner">
            {[...telemetryLinesRef.current, ...telemetryLinesRef.current].map((line, i) => (
              <div
                key={`${line.id}-${i}`}
                className={`data-line ${line.hot ? 'hot' : ''}`}
                style={{ animationDelay: `${(i % telemetryLinesRef.current.length) * 0.15}s` }}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodePage
