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

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Client connected, total:', clients.size)

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString())
    console.log('Received:', message)
    
    // 广播给所有客户端
    clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message))
      }
    })
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
