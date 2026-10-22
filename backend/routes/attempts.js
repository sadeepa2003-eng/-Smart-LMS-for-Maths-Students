const express = require('express')
const router = express.Router()
const Attempt = require('../models/Attempt')
const { authenticateToken, requireRole } = require('../middleware/auth')

// GET /api/attempts/my-history (Student: view personal past attempts)
router.get('/my-history', authenticateToken, async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user.id })
      .sort({ submittedAt: -1 })
      .populate('quizId', 'title topic')

    res.json(attempts)
  } catch (error) {
    console.error('Fetch student history error:', error)
    res.status(500).json({ message: 'Failed to retrieve attempt history.' })
  }
})

// GET /api/attempts/stats (Student: summary statistics and latest recommendations per topic)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user.id }).sort({ submittedAt: -1 })

    const topics = ['Algebra', 'Geometry', 'Straight Lines']
    const topicStats = {}

    topics.forEach((topic) => {
      const topicAttempts = attempts.filter((a) => a.topic === topic)
      const count = topicAttempts.length
      const avgScore =
        count > 0
          ? Math.round(
              topicAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / count
            )
          : null
      const latestAttempt = topicAttempts[0] || null

      topicStats[topic] = {
        totalAttempts: count,
        averagePercentage: avgScore,
        latestRecommendation: latestAttempt ? latestAttempt.recommendation : 'No attempts yet. Complete a quiz to get recommendations.',
        latestRecommendationLevel: latestAttempt ? latestAttempt.recommendationLevel : 'neutral',
        lastScore: latestAttempt ? `${latestAttempt.score}/${latestAttempt.total} (${latestAttempt.percentage}%)` : 'N/A'
      }
    })

    res.json({
      totalAttemptsAll: attempts.length,
      topicStats
    })
  } catch (error) {
    console.error('Fetch student stats error:', error)
    res.status(500).json({ message: 'Failed to retrieve student progress statistics.' })
  }
})

// GET /api/attempts/all (Teacher only: monitor all student results)
router.get('/all', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const attempts = await Attempt.find()
      .populate('studentId', 'name email')
      .populate('quizId', 'title topic')
      .sort({ submittedAt: -1 })

    res.json(attempts)
  } catch (error) {
    console.error('Fetch teacher attempts error:', error)
    res.status(500).json({ message: 'Failed to retrieve all student attempts.' })
  }
})

module.exports = router
