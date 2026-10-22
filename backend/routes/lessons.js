const express = require('express')
const router = express.Router()
const Lesson = require('../models/Lesson')
const { authenticateToken, requireRole } = require('../middleware/auth')

// GET /api/lessons (accessible to students and teachers)
router.get('/', async (req, res) => {
  try {
    const { topic } = req.query
    const filter = {}
    if (topic && topic !== 'All') {
      filter.topic = topic
    }

    const lessons = await Lesson.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json(lessons)
  } catch (error) {
    console.error('Fetch lessons error:', error)
    res.status(500).json({ message: 'Failed to retrieve lessons.' })
  }
})

// GET /api/lessons/:id
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('createdBy', 'name email')
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' })
    }
    res.json(lesson)
  } catch (error) {
    console.error('Fetch single lesson error:', error)
    res.status(500).json({ message: 'Failed to retrieve lesson details.' })
  }
})

// POST /api/lessons (Teacher only)
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { title, topic, content, resourceUrl } = req.body

    if (!title || !topic || !content) {
      return res.status(400).json({ message: 'Title, topic, and content are required.' })
    }

    const validTopics = ['Algebra', 'Geometry', 'Straight Lines']
    if (!validTopics.includes(topic)) {
      return res.status(400).json({ message: `Invalid topic. Must be one of: ${validTopics.join(', ')}` })
    }

    const lesson = new Lesson({
      title: title.trim(),
      topic,
      content,
      resourceUrl: resourceUrl ? resourceUrl.trim() : '',
      createdBy: req.user.id
    })

    await lesson.save()
    const populated = await lesson.populate('createdBy', 'name email')
    res.status(201).json({ message: 'Lesson created successfully.', lesson: populated })
  } catch (error) {
    console.error('Create lesson error:', error)
    res.status(500).json({ message: 'Failed to create lesson.' })
  }
})

// PUT /api/lessons/:id (Teacher only)
router.put('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { title, topic, content, resourceUrl } = req.body

    if (!title || !topic || !content) {
      return res.status(400).json({ message: 'Title, topic, and content are required.' })
    }

    const validTopics = ['Algebra', 'Geometry', 'Straight Lines']
    if (!validTopics.includes(topic)) {
      return res.status(400).json({ message: `Invalid topic. Must be one of: ${validTopics.join(', ')}` })
    }

    const lesson = await Lesson.findById(req.params.id)
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' })
    }

    lesson.title = title.trim()
    lesson.topic = topic
    lesson.content = content
    lesson.resourceUrl = resourceUrl ? resourceUrl.trim() : ''

    await lesson.save()
    const populated = await lesson.populate('createdBy', 'name email')
    res.json({ message: 'Lesson updated successfully.', lesson: populated })
  } catch (error) {
    console.error('Update lesson error:', error)
    res.status(500).json({ message: 'Failed to update lesson.' })
  }
})

// DELETE /api/lessons/:id (Teacher only)
router.delete('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id)
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' })
    }
    res.json({ message: 'Lesson deleted successfully.' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    res.status(500).json({ message: 'Failed to delete lesson.' })
  }
})

module.exports = router
