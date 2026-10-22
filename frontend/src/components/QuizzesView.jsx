import React, { useEffect, useState } from 'react'

export default function QuizzesView({ token, initialTopic = 'All', onQuizCompleted }) {
  const [quizzes, setQuizzes] = useState([])
  const [topicFilter, setTopicFilter] = useState(initialTopic)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Active quiz taking state
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [selectedAnswers, setSelectedAnswers] = useState({}) // { [questionIndex]: optionIndex }
  const [submitting, setSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState(null)

  const API_URL = 'http://localhost:5000/api'

  useEffect(() => {
    fetchQuizzes()
  }, [topicFilter])

  async function fetchQuizzes() {
    setLoading(true)
    setError('')
    try {
      const url =
        topicFilter === 'All'
          ? `${API_URL}/quizzes`
          : `${API_URL}/quizzes?topic=${encodeURIComponent(topicFilter)}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load quizzes')
      const data = await res.json()
      setQuizzes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartQuiz(quizId) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load quiz details')
      const data = await res.json()
      setActiveQuiz(data)
      setSelectedAnswers({})
      setQuizResult(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectOption(qIndex, optIndex) {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: optIndex
    }))
  }

  async function handleSubmitQuiz(e) {
    e.preventDefault()
    if (!activeQuiz) return

    // Verify all questions are answered
    const totalQuestions = activeQuiz.questions.length
    const answeredCount = Object.keys(selectedAnswers).length

    if (answeredCount < totalQuestions) {
      const proceed = window.confirm(
        `You have answered ${answeredCount} of ${totalQuestions} questions. Unanswered questions will be marked incorrect. Submit anyway?`
      )
      if (!proceed) return
    }

    setSubmitting(true)
    setError('')

    const answersPayload = activeQuiz.questions.map((_, index) => ({
      questionIndex: index,
      selectedOptionIndex: selectedAnswers[index] !== undefined ? selectedAnswers[index] : -1
    }))

    try {
      const res = await fetch(`${API_URL}/quizzes/${activeQuiz._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersPayload })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')

      setQuizResult(data.result)
      if (onQuizCompleted) onQuizCompleted()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function getBadgeClass(level) {
    if (level === 'revise') return 'badge-revise'
    if (level === 'practice') return 'badge-practice'
    if (level === 'advance') return 'badge-advance'
    return 'badge-neutral'
  }

  function getResultBannerStyle(level) {
    if (level === 'revise') {
      return { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }
    }
    if (level === 'practice') {
      return { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }
    }
    if (level === 'advance') {
      return { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }
    }
    return { background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }
  }

  // Render Result Screen
  if (quizResult) {
    const bannerStyle = getResultBannerStyle(quizResult.recommendationLevel)

    return (
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="card" style={{ padding: 28 }}>
          <div className="results-banner" style={bannerStyle}>
            <span className={`badge ${getBadgeClass(quizResult.recommendationLevel)}`} style={{ fontSize: '0.9rem' }}>
              {quizResult.recommendationLevel === 'revise'
                ? '⚠️ Action Required: Revise Topic'
                : quizResult.recommendationLevel === 'practice'
                ? '🔄 Suggestion: More Practice Needed'
                : '🏆 Mastery: Ready for Next Topic!'}
            </span>

            <div className="score-display">
              {quizResult.score} / {quizResult.total} ({quizResult.percentage}%)
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 500, margin: '8px 0 0 0' }}>
              {quizResult.recommendation}
            </p>
          </div>

          <h3 style={{ marginBottom: 16, color: '#1e293b' }}>Detailed Question Breakdown</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {quizResult.answers.map((ans, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${ans.isCorrect ? '#86efac' : '#fca5a5'}`,
                  borderRadius: 8,
                  padding: 16,
                  background: ans.isCorrect ? '#f0fdf4' : '#fef2f2'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>Question {idx + 1}: {ans.questionText}</strong>
                  <span
                    style={{
                      fontWeight: 700,
                      color: ans.isCorrect ? '#166534' : '#991b1b'
                    }}
                  >
                    {ans.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                  <div>
                    Your answer:{' '}
                    <strong>
                      {ans.selectedOptionIndex >= 0
                        ? activeQuiz?.questions[idx]?.options[ans.selectedOptionIndex] || `Option ${ans.selectedOptionIndex + 1}`
                        : 'No answer provided'}
                    </strong>
                  </div>
                  {!ans.isCorrect && (
                    <div style={{ color: '#166534', marginTop: 4 }}>
                      Correct answer:{' '}
                      <strong>
                        {activeQuiz?.questions[idx]?.options[ans.correctOptionIndex] || `Option ${ans.correctOptionIndex + 1}`}
                      </strong>
                    </div>
                  )}
                  {activeQuiz?.questions[idx]?.explanation && (
                    <div style={{ marginTop: 6, fontStyle: 'italic', color: '#64748b' }}>
                      💡 {activeQuiz.questions[idx].explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                setActiveQuiz(null)
                setQuizResult(null)
                fetchQuizzes()
              }}
            >
              Back to Quizzes List
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => handleStartQuiz(activeQuiz._id)}
            >
              🔄 Retry This Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Active Quiz Runner
  if (activeQuiz) {
    return (
      <div className="container" style={{ maxWidth: 780 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 className="page-title">{activeQuiz.title}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className="badge badge-topic">{activeQuiz.topic}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {activeQuiz.questions.length} Questions
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveQuiz(null)}
          >
            Cancel Quiz
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmitQuiz}>
          {activeQuiz.questions.map((q, qIndex) => (
            <div key={qIndex} className="quiz-question-box">
              <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 12, color: '#1e293b' }}>
                {qIndex + 1}. {q.questionText}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, optIndex) => {
                  const isSelected = selectedAnswers[qIndex] === optIndex
                  return (
                    <label
                      key={optIndex}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(qIndex, optIndex)}
                      />
                      <span>{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ padding: '14px', fontSize: '1.1rem', marginTop: 12 }}
            disabled={submitting}
          >
            {submitting ? 'Evaluating Submission...' : 'Submit Quiz for Instant Scoring'}
          </button>
        </form>
      </div>
    )
  }

  // Render Quiz Catalog
  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Maths Quizzes</h2>
        <p className="page-subtitle">
          Test your skills to get rule-based revision advice and track topic performance.
        </p>
      </div>

      <div className="filter-bar">
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Filter by Topic:</span>
        {['All', 'Algebra', 'Geometry', 'Straight Lines'].map((topic) => (
          <button
            key={topic}
            className={`filter-btn ${topicFilter === topic ? 'active' : ''}`}
            onClick={() => setTopicFilter(topic)}
          >
            {topic}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No quizzes found for this topic.
        </div>
      ) : (
        <div className="grid-3">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-topic">{quiz.topic}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {quiz.questions?.length || 0} Questions
                </span>
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#1e293b' }}>
                {quiz.title}
              </h3>

              <p style={{ color: '#64748b', fontSize: '0.9rem', flex: 1, marginBottom: 16 }}>
                {quiz.description || 'Test your knowledge on this maths topic.'}
              </p>

              <button
                className="btn btn-primary btn-full"
                onClick={() => handleStartQuiz(quiz._id)}
              >
                ✍️ Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
