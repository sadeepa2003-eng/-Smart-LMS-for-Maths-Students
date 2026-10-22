require('dotenv').config()
const http = require('http')
const mongoose = require('mongoose')
const app = require('./server')

async function runTests() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_maths_lms'
  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB for tests.')

  const server = http.createServer(app)
  const TEST_PORT = 5005

  await new Promise((resolve) => server.listen(TEST_PORT, resolve))
  console.log(`Test server running on port ${TEST_PORT}`)

  const BASE_URL = `http://localhost:${TEST_PORT}/api`

  let passed = 0
  let failed = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`)
      passed++
    } else {
      console.error(`  ✗ FAIL: ${testName}`)
      failed++
    }
  }

  try {
    // Test 1: Health check
    const healthRes = await fetch(`${BASE_URL}/health`)
    const healthData = await healthRes.json()
    assert(healthRes.status === 200 && healthData.database === 'connected', 'GET /api/health returns 200 and database connected')

    // Test 2: Teacher login
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@mathslms.com', password: 'Teacher123!' })
    })
    const teacherData = await teacherLoginRes.json()
    assert(teacherLoginRes.status === 200 && teacherData.user.role === 'teacher', 'Teacher login returns token with teacher role')
    const teacherToken = teacherData.token

    // Test 3: Student login
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@mathslms.com', password: 'Student123!' })
    })
    const studentData = await studentLoginRes.json()
    assert(studentLoginRes.status === 200 && studentData.user.role === 'student', 'Student login returns token with student role')
    const studentToken = studentData.token

    // Test 4: Public registration enforces student role even if role=teacher submitted
    const randomEmail = `student_${Date.now()}@example.com`
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: randomEmail,
        password: 'Password123!',
        role: 'teacher' // Attempting privilege escalation
      })
    })
    const regData = await registerRes.json()
    assert(registerRes.status === 201 && regData.user.role === 'student', 'Public registration strictly assigns student role')

    // Test 5: Role protection - Student cannot create a lesson
    const studentLessonCreate = await fetch(`${BASE_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Lesson',
        topic: 'Algebra',
        content: 'Should fail'
      })
    })
    assert(studentLessonCreate.status === 403, 'Student blocked from creating lesson (403 Forbidden)')

    // Test 6: Teacher can create a lesson
    const teacherLessonCreate = await fetch(`${BASE_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Test Integration Lesson',
        topic: 'Algebra',
        content: 'Variables and constants explanation.'
      })
    })
    const createdLesson = await teacherLessonCreate.json()
    assert(teacherLessonCreate.status === 201 && createdLesson.lesson.title === 'Test Integration Lesson', 'Teacher can create lesson (201 Created)')

    // Clean up created lesson
    await fetch(`${BASE_URL}/lessons/${createdLesson.lesson._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` }
    })

    // Test 7: Student fetching quiz has correct answers stripped
    const quizzesRes = await fetch(`${BASE_URL}/quizzes`)
    const quizzes = await quizzesRes.json()
    const firstQuiz = quizzes[0]

    const studentQuizRes = await fetch(`${BASE_URL}/quizzes/${firstQuiz._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    })
    const studentQuizData = await studentQuizRes.json()
    const hasExposedAnswer = studentQuizData.questions.some((q) => q.correctOptionIndex !== undefined)
    assert(!hasExposedAnswer, 'Student cannot view correctOptionIndex before submission')

    // Test 8: Quiz submission and rule-based scoring (all wrong answers -> <50% -> revise)
    const failSubmitRes = await fetch(`${BASE_URL}/quizzes/${firstQuiz._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: firstQuiz.questions.map((_, i) => ({ questionIndex: i, selectedOptionIndex: -1 }))
      })
    })
    const failData = await failSubmitRes.json()
    assert(
      failSubmitRes.status === 201 &&
      failData.result.percentage === 0 &&
      failData.result.recommendationLevel === 'revise',
      'Score < 50% correctly yields "revise" rule recommendation'
    )

    // Test 9: Student attempts history contains submitted attempt
    const historyRes = await fetch(`${BASE_URL}/attempts/my-history`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    })
    const historyData = await historyRes.json()
    assert(historyData.length > 0 && historyData[0].quizTitle === firstQuiz.title, 'Attempt is persisted and retrieved in student history')

    console.log(`\nResults: ${passed} passed, ${failed} failed.`)

    server.close()
    await mongoose.connection.close()
    process.exit(failed > 0 ? 1 : 0)
  } catch (err) {
    console.error('Test execution error:', err)
    server.close()
    await mongoose.connection.close()
    process.exit(1)
  }
}

runTests()
