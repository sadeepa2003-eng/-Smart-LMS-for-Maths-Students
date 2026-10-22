const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      enum: {
        values: ['Algebra', 'Geometry', 'Straight Lines'],
        message: '{VALUE} is not a supported maths topic'
      }
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required']
    },
    resourceUrl: {
      type: String,
      trim: true,
      default: ''
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

module.exports = mongoose.model('Lesson', lessonSchema)
