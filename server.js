import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { spawn } from 'child_process'

const HTTP_PORT = 3001

// 启动Vite开发服务器
const vite = spawn('npx', ['vite', '--host'], {
  stdio: 'inherit',
  shell: true
})

// WebSocket服务器
const server = createServer()
const wss = new WebSocketServer({ server })

const clients = new Set()
const checkedInNames = new Set() // 已签到名单
const checkinLog = [] // { name, time, blessing, timestamp }

const safeSend = (ws, payload) => {
  if (ws.readyState !== 1) return false
  try {
    ws.send(payload)
    return true
  } catch (err) {
    console.warn('Send failed:', err.message)
    return false
  }
}

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Client connected, total:', clients.size)
  safeSend(ws, JSON.stringify({ type: 'checkin_snapshot', items: checkinLog }))

  ws.on('error', (err) => {
    console.warn('Client socket error:', err.message)
    clients.delete(ws)
  })

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString())
    console.log('Received:', message)
    
    if (message.type === 'checkin') {
      const name = typeof message.name === 'string' ? message.name.trim() : ''
      if (!name) {
        ws.send(JSON.stringify({ type: 'checkin_error', message: 'Invalid name.' }))
        return
      }
      const blessing = typeof message.blessing === 'string' ? message.blessing.trim() : ''
      
      // 检查是否已签到
      if (checkedInNames.has(name)) {
        // 已签到，只通知发送者
        ws.send(JSON.stringify({ type: 'checkin_duplicate', name }))
        console.log('Duplicate checkin rejected:', name)
        return
      }
      
      // 新签到，记录并广播
      checkedInNames.add(name)
      console.log('New checkin:', name, 'Total:', checkedInNames.size)
      const timestamp = Date.now()
      const time = new Date(timestamp).toLocaleTimeString()
      const payload = { type: 'checkin', name, time, blessing, timestamp }
      checkinLog.unshift({ name, time, blessing, timestamp })
      
      clients.forEach(client => {
        const ok = safeSend(client, JSON.stringify(payload))
        if (!ok) clients.delete(client)
      })
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log('Client disconnected, total:', clients.size)
  })
})

server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on ws://localhost:${HTTP_PORT}`)
})

process.on('SIGINT', () => {
  vite.kill()
  process.exit()
})
