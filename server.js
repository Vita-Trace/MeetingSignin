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

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Client connected, total:', clients.size)

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString())
    console.log('Received:', message)
    
    if (message.type === 'checkin') {
      const name = message.name.trim()
      
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
      
      clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(message))
        }
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
