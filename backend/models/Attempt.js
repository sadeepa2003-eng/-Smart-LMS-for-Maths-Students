const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    default: ''
  },
  selectedOptionIndex: {
    type: Number,
    required: true
  },
  correctOptionIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
})

const attemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  quizTitle: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
    enum: ['Algebra', 'Geometry', 'Straight Lines']
  },
  answers: [answerSchema],
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  recommendation: {
    type: String,
    required: true
  },
  recommendationLevel: {
    type: String,
    enum: ['revise', 'practice', 'advance'],
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Attempt', attemptSchema)
