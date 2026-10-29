require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const lessonRoutes = require('./routes/lessons')
const quizRoutes = require('./routes/quizzes')
const attemptRoutes = require('./routes/attempts')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5175' }))
app.use(express.json({ limit: '100kb' }))

// Health endpoint
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({
    message: 'Smart Maths LMS API is running',
    database: connected ? 'connected' : 'disconnected'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/attempts', attemptRoutes)

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from .env')
    }
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Startup failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = app
