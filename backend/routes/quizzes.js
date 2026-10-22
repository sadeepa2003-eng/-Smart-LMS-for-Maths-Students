const express = require('express')
const router = express.Router()
const Quiz = require('../models/Quiz')
const Attempt = require('../models/Attempt')
const { authenticateToken, requireRole } = require('../middleware/auth')

// Helper for rule-based revision recommendations
function computeRecommendation(percentage, topic) {
  if (percentage < 50) {
    return {
      recommendationLevel: 'revise',
      recommendation: `Score is below 50% (${percentage}%). We strongly recommend revising the ${topic} lessons and reviewing fundamental concepts before retrying.`
    }
  } else if (percentage < 75) {
    return {
      recommendationLevel: 'practice',
      recommendation: `Score is in the moderate range (${percentage}%). Good foundation! We recommend completing more practice exercises in ${topic} to solidify your mastery.`
    }
  } else {
    return {
      recommendationLevel: 'advance',
      recommendation: `Outstanding performance (${percentage}%)! You have demonstrated strong mastery of ${topic}. You are ready to advance to the next maths topic!`
    }
  }
}

// GET /api/quizzes (List quizzes, can filter by topic)
router.get('/', async (req, res) => {
  try {
    const { topic } = req.query
    const filter = {}
    if (topic && topic !== 'All') {
      filter.topic = topic
    }

    // Exclude correct answers from questions list for public/overview
    const quizzes = await Quiz.find(filter)
      .select('-questions.correctOptionIndex')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json(quizzes)
  } catch (error) {
    console.error('Fetch quizzes error:', error)
    res.status(500).json({ message: 'Failed to retrieve quizzes.' })
  }
})

// GET /api/quizzes/:id
// Rule: Exclude correct answers from quiz data sent before submission for students
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name email')
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' })
    }

    // If teacher, can view answers; if student, exclude correctOptionIndex
    if (req.user.role === 'teacher') {
      return res.json(quiz)
    }

    // Safe quiz object for student taking the quiz
    const safeQuiz = quiz.toObject()
    safeQuiz.questions = safeQuiz.questions.map((q) => {
      const { correctOptionIndex, ...rest } = q
      return rest
    })

    res.json(safeQuiz)
  } catch (error) {
    console.error('Fetch quiz by ID error:', error)
    res.status(500).json({ message: 'Failed to retrieve quiz details.' })
  }
})

// POST /api/quizzes (Teacher only)
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { title, topic, description, questions } = req.body

    if (!title || !topic || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title, topic, and at least one question are required.' })
    }

    const validTopics = ['Algebra', 'Geometry', 'Straight Lines']
    if (!validTopics.includes(topic)) {
      return res.status(400).json({ message: `Invalid topic. Must be one of: ${validTopics.join(', ')}` })
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          message: `Question ${i + 1} must have question text and at least 2 options.`
        })
      }
      if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        return res.status(400).json({
          message: `Question ${i + 1} has an invalid correct option index.`
        })
      }
    }

    const quiz = new Quiz({
      title: title.trim(),
      topic,
      description: description ? description.trim() : '',
      questions,
      createdBy: req.user.id
    })

    await quiz.save()
    res.status(201).json({ message: 'Quiz created successfully.', quiz })
  } catch (error) {
    console.error('Create quiz error:', error)
    res.status(500).json({ message: 'Failed to create quiz.' })
  }
})

// DELETE /api/quizzes/:id (Teacher only)
router.delete('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id)
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' })
    }
    // Also remove any attempts associated with this quiz
    await Attempt.deleteMany({ quizId: req.params.id })
    res.json({ message: 'Quiz and associated attempts deleted successfully.' })
  } catch (error) {
    console.error('Delete quiz error:', error)
    res.status(500).json({ message: 'Failed to delete quiz.' })
  }
})

// POST /api/quizzes/:id/submit (Student or authenticated user)
// Rules:
// 1. Calculate quiz scores on the backend
// 2. Derive student ID from authenticated session, not submitted form field
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required.' })
    }

    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' })
    }

    const total = quiz.questions.length
    let score = 0
    const processedAnswers = []

    quiz.questions.forEach((q, index) => {
      const studentAns = answers.find((a) => a.questionIndex === index)
      const selectedIndex = studentAns !== undefined && studentAns !== null ? Number(studentAns.selectedOptionIndex) : -1
      const isCorrect = selectedIndex === q.correctOptionIndex

      if (isCorrect) {
        score += 1
      }

      processedAnswers.push({
        questionIndex: index,
        questionText: q.questionText,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect
      })
    })

    const percentage = Math.round((score / total) * 100)
    const { recommendation, recommendationLevel } = computeRecommendation(percentage, quiz.topic)

    // Save attempt using req.user.id
    const attempt = new Attempt({
      studentId: req.user.id,
      quizId: quiz._id,
      quizTitle: quiz.title,
      topic: quiz.topic,
      answers: processedAnswers,
      score,
      total,
      percentage,
      recommendation,
      recommendationLevel,
      submittedAt: new Date()
    })

    await attempt.save()

    res.status(201).json({
      message: 'Quiz submitted and evaluated successfully.',
      result: {
        attemptId: attempt._id,
        quizTitle: quiz.title,
        topic: quiz.topic,
        score,
        total,
        percentage,
        recommendation,
        recommendationLevel,
        answers: processedAnswers,
        submittedAt: attempt.submittedAt
      }
    })
  } catch (error) {
    console.error('Quiz submission error:', error)
    res.status(500).json({ message: 'Server error processing quiz submission.' })
  }
})

module.exports = router
