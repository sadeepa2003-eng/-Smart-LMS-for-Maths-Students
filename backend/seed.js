require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Lesson = require('./models/Lesson')
const Quiz = require('./models/Quiz')
const Attempt = require('./models/Attempt')

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_maths_lms'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB for seeding.')

    // Clear existing collections
    await User.deleteMany({})
    await Lesson.deleteMany({})
    await Quiz.deleteMany({})
    await Attempt.deleteMany({})
    console.log('Cleared existing data.')

    // 1. Create Teacher and Student users
    const salt = await bcrypt.genSalt(10)
    const teacherPasswordHash = await bcrypt.hash('Teacher123!', salt)
    const studentPasswordHash = await bcrypt.hash('Student123!', salt)

    const teacher = await User.create({
      name: 'Dr. Sarah Mitchell (Teacher)',
      email: 'teacher@mathslms.com',
      passwordHash: teacherPasswordHash,
      role: 'teacher'
    })

    const student = await User.create({
      name: 'Alex Johnson (Student)',
      email: 'student@mathslms.com',
      passwordHash: studentPasswordHash,
      role: 'student'
    })

    console.log(`Created Teacher: ${teacher.email} and Student: ${student.email}`)

    // 2. Create Starter Lessons
    const lessonsData = [
      {
        title: 'Introduction to Linear Equations and Expressions',
        topic: 'Algebra',
        content: `Algebra uses letters and symbols to represent numbers and quantities in equations.

Key Concepts:
1. An equation is a mathematical statement stating two expressions are equal (e.g. 2x + 5 = 15).
2. To solve for x, isolate the variable using inverse operations.
   - Example: 2x + 5 = 15
   - Subtract 5 from both sides: 2x = 10
   - Divide by 2: x = 5
3. Combining Like Terms: Only terms with identical variables and powers can be added directly (e.g. 3x + 4x = 7x).`,
        resourceUrl: 'https://www.khanacademy.org/math/algebra',
        createdBy: teacher._id
      },
      {
        title: 'Properties of Triangles, Angles and Circles',
        topic: 'Geometry',
        content: `Geometry focuses on the sizes, shapes, positions, angles, and dimensions of objects.

Key Concepts:
1. Interior angles of any triangle always sum to 180°.
2. Pythagoras' Theorem applies to right-angled triangles:
   a² + b² = c² (where c is the hypotenuse).
3. Circle Fundamentals:
   - Circumference = 2πr
   - Area = πr²
   - Diameter = 2r`,
        resourceUrl: 'https://www.khanacademy.org/math/geometry',
        createdBy: teacher._id
      },
      {
        title: 'Gradient, Intercepts, and Equation of a Straight Line',
        topic: 'Straight Lines',
        content: `A straight line graph illustrates a linear relationship between two variables, x and y.

Key Concepts:
1. Standard Slope-Intercept Form:
   y = mx + c
   - m represents the gradient (slope): (y₂ - y₁) / (x₂ - x₁)
   - c represents the y-intercept (the point where the line crosses the y-axis, (0, c)).
2. Parallel lines possess identical gradients: m₁ = m₂.
3. Perpendicular lines have negative reciprocal gradients: m₁ × m₂ = -1.`,
        resourceUrl: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-equations-graphs',
        createdBy: teacher._id
      }
    ]

    const createdLessons = await Lesson.insertMany(lessonsData)
    console.log(`Created ${createdLessons.length} starter lessons.`)

    // 3. Create Starter Quizzes
    const quizzesData = [
      {
        title: 'Algebra Fundamentals Quiz',
        topic: 'Algebra',
        description: 'Test your grasp of basic equations, terms, and solving for unknown variables.',
        createdBy: teacher._id,
        questions: [
          {
            questionText: 'Solve for x: 3x - 7 = 14',
            options: ['x = 5', 'x = 7', 'x = 6', 'x = 8'],
            correctOptionIndex: 1, // x = 7
            explanation: '3x - 7 = 14 -> 3x = 21 -> x = 7'
          },
          {
            questionText: 'Simplify the expression: 4x + 9 - 2x + 3',
            options: ['2x + 12', '6x + 12', '2x + 6', '6x + 6'],
            correctOptionIndex: 0, // 2x + 12
            explanation: 'Combine like terms: (4x - 2x) + (9 + 3) = 2x + 12'
          },
          {
            questionText: 'If 2(y + 4) = 20, what is the value of y?',
            options: ['y = 4', 'y = 8', 'y = 6', 'y = 10'],
            correctOptionIndex: 2, // y = 6
            explanation: 'Divide both sides by 2: y + 4 = 10 -> y = 6'
          },
          {
            questionText: 'What is the value of 5² - 3(4)?',
            options: ['13', '17', '12', '22'],
            correctOptionIndex: 0, // 13
            explanation: '5² = 25; 3(4) = 12; 25 - 12 = 13'
          }
        ]
      },
      {
        title: 'Geometry Essentials Quiz',
        topic: 'Geometry',
        description: 'Assess your knowledge on angles, triangles, and Pythagorean theorem.',
        createdBy: teacher._id,
        questions: [
          {
            questionText: 'What is the sum of the interior angles of any triangle?',
            options: ['90°', '180°', '270°', '360°'],
            correctOptionIndex: 1, // 180°
            explanation: 'The interior angles of any planar triangle always sum to 180°.'
          },
          {
            questionText: 'In a right triangle with legs of length 3 cm and 4 cm, what is the length of the hypotenuse?',
            options: ['5 cm', '6 cm', '7 cm', '8 cm'],
            correctOptionIndex: 0, // 5 cm
            explanation: 'Using a² + b² = c²: 3² + 4² = 9 + 16 = 25 -> c = 5 cm.'
          },
          {
            questionText: 'What is the formula for the area of a circle with radius r?',
            options: ['2πr', 'πr²', 'πd', '4πr²'],
            correctOptionIndex: 1, // πr²
            explanation: 'Area of circle = πr².'
          },
          {
            questionText: 'Two angles are complementary if their sum equals:',
            options: ['45°', '90°', '180°', '360°'],
            correctOptionIndex: 1, // 90°
            explanation: 'Complementary angles add up to 90°, while supplementary add up to 180°.'
          }
        ]
      },
      {
        title: 'Straight Lines & Coordinate Geometry Quiz',
        topic: 'Straight Lines',
        description: 'Challenge your understanding of gradient, intercepts, and linear equations.',
        createdBy: teacher._id,
        questions: [
          {
            questionText: 'In the equation y = mx + c, what does "m" represent?',
            options: ['y-intercept', 'x-intercept', 'Gradient (slope)', 'Area under curve'],
            correctOptionIndex: 2, // Gradient (slope)
            explanation: 'In y = mx + c, m is the gradient (slope) and c is the y-intercept.'
          },
          {
            questionText: 'What is the gradient of a line passing through (1, 2) and (3, 8)?',
            options: ['2', '3', '4', '6'],
            correctOptionIndex: 1, // 3
            explanation: 'Gradient m = (8 - 2) / (3 - 1) = 6 / 2 = 3.'
          },
          {
            questionText: 'What is the relationship between the slopes of two perpendicular lines?',
            options: ['m₁ = m₂', 'm₁ × m₂ = -1', 'm₁ + m₂ = 0', 'm₁ = 1/m₂'],
            correctOptionIndex: 1, // m₁ × m₂ = -1
            explanation: 'Perpendicular lines have negative reciprocal gradients: m₁ × m₂ = -1.'
          },
          {
            questionText: 'Where does the line y = 2x - 5 cross the y-axis?',
            options: ['(0, 2)', '(0, -5)', '(2, 0)', '(-5, 0)'],
            correctOptionIndex: 1, // (0, -5)
            explanation: 'At the y-axis, x = 0. Substituting gives y = 2(0) - 5 = -5, so (0, -5).'
          }
        ]
      }
    ]

    const createdQuizzes = await Quiz.insertMany(quizzesData)
    console.log(`Created ${createdQuizzes.length} starter quizzes.`)

    console.log('\n===============================================')
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY')
    console.log('===============================================')
    console.log('Demo Accounts:')
    console.log('  Teacher: teacher@mathslms.com  / Password: Teacher123!')
    console.log('  Student: student@mathslms.com  / Password: Student123!')
    console.log('===============================================\n')

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seedDatabase()
