import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { YSocketIO } from "y-socket.io/dist/server"

import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.static("public"))

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"],
  allowEIO3: true
})

const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()

app.get('/health', (req, res) => {
  res.status(200).json({
    message: "Server is healthy",
    success: true
  })
})

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

const PORT = process.env.PORT || 5001

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})