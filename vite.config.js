import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const WISHES_FILE = path.resolve(__dirname, 'wishes.local.json')

function localWishesApi() {
  function read() {
    if (!fs.existsSync(WISHES_FILE)) return []
    return JSON.parse(fs.readFileSync(WISHES_FILE, 'utf-8'))
  }
  function write(data) {
    fs.writeFileSync(WISHES_FILE, JSON.stringify(data, null, 2))
  }

  return {
    name: 'local-wishes-api',
    configureServer(server) {
      server.middlewares.use('/api/wishes', (req, res) => {
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          return res.end(JSON.stringify(read()))
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            const { name, message, patternSeed, patternMode } = JSON.parse(body)
            const wishes = read()
            const wish = {
              id: Date.now(),
              name: (name || 'Anonymous').trim().slice(0, 100),
              message: message.trim().slice(0, 200),
              patternSeed: patternSeed ? Math.floor(Number(patternSeed)) : null,
              patternMode: patternMode || null,
              created_at: new Date().toISOString(),
            }
            wishes.unshift(wish)
            write(wishes)
            res.statusCode = 201
            return res.end(JSON.stringify(wish))
          })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
      })
    },
  }
}

export default defineConfig({
  plugins: [localWishesApi(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/wishes.local.json'],
    },
  },
})
