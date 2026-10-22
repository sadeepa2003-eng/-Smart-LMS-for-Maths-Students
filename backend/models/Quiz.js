const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length >= 2
      },
      message: 'Each question must have at least 2 options'
    },
    required: true
  },
  correctOptionIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0
  },
  explanation: {
    type: String,
    default: ''
  }
})

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      enum: {
        values: ['Algebra', 'Geometry', 'Straight Lines'],
        message: '{VALUE} is not a valid maths topic'
      }
    },
    description: {
      type: String,
      default: ''
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0
        },
        message: 'A quiz must contain at least one question'
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Quiz', quizSchema)
