import React, { useEffect, useState } from 'react'

export default function TeacherQuizManager({ token }) {
  const [quizzes, setQuizzes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('Algebra')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: ''
    }
  ])
  const [saving, setSaving] = useState(false)

  const API_URL = 'http://localhost:5000/api'
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const filteredQuizzes = quizzes.filter((quiz) => {
    const searchableText = [
      quiz.title,
      quiz.topic,
      quiz.description || '',
      ...(quiz.questions || []).map((question) => question.questionText || '')
    ].join(' ').toLocaleLowerCase()
    return searchableText.includes(normalizedSearch)
  })

  useEffect(() => {
    fetchQuizzes()
  }, [])

  async function fetchQuizzes() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/quizzes`)
      if (!res.ok) throw new Error('Failed to load quizzes')
      const data = await res.json()
      setQuizzes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAddQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: ''
      }
    ])
  }

  function handleRemoveQuestion(index) {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.')
      return
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleQuestionChange(index, field, value) {
    setQuestions((prev) => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  function handleOptionChange(qIndex, optIndex, value) {
    setQuestions((prev) => {
      const copy = [...prev]
      const newOpts = [...copy[qIndex].options]
      newOpts[optIndex] = value
      copy[qIndex].options = newOpts
      return copy
    })
  }

  async function handleCreateQuiz(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} is missing the question text.`)
        setSaving(false)
        return
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Question ${i + 1}, Option ${j + 1} cannot be empty.`)
          setSaving(false)
          return
        }
      }
    }

    try {
      const res = await fetch(`${API_URL}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          topic,
          description,
          questions
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create quiz')

      setSuccess('Quiz created successfully!')
      setShowCreateModal(false)
      // Reset form
      setTitle('')
      setDescription('')
      setQuestions([
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: ''
        }
      ])
      fetchQuizzes()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteQuiz(quizId) {
    if (!window.confirm('Are you sure you want to delete this quiz? Associated student attempt records will also be removed.')) {
      return
    }

    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Delete failed')

      setSuccess(data.message)
      fetchQuizzes()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="page-title">Teacher Quiz Management</h2>
          <p className="page-subtitle">Design multi-choice quizzes with automated answer checking and explanations.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError('')
            setSuccess('')
            setShowCreateModal(true)
          }}
        >
          ➕ Create New Quiz
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Maths Quiz</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateQuiz}>
              <div className="form-group">
                <label className="form-label">Quiz Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Circle Theorems Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Topic</label>
                <select
                  className="form-select"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  <option value="Algebra">Algebra</option>
                  <option value="Geometry">Geometry</option>
                  <option value="Straight Lines">Straight Lines</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Evaluate student mastery on tangents and chords..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Quiz Questions ({questions.length})</h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddQuestion}
                >
                  ➕ Add Question
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <strong>Question {qIndex + 1}</strong>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveQuestion(qIndex)}
                      >
                        Remove Question
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. What is the gradient of y = 4x - 9?"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-label" style={{ marginBottom: 6 }}>
                    Options (Select radio button for the correct answer):
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginBottom: 12 }}>
                    {q.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#ffffff',
                          padding: '6px 10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct-option-${qIndex}`}
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIndex)}
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ border: 'none', padding: '4px' }}
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Explanation / Solution Note (Shown after submission)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. In y = mx + c, the coefficient of x represents the gradient."
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating Quiz...' : 'Save & Publish Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quizzes List */}
      {!loading && quizzes.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            className="form-input quiz-search-input"
            aria-label="Search managed quizzes by title, topic, description, or question"
            placeholder="Search quizzes by title, topic, description, or question"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      )}
      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No quizzes found. Click "Create New Quiz" above to publish one.
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No quizzes match “{searchQuery.trim()}”.
        </div>
      ) : (
        <div className="grid-3">
          {filteredQuizzes.map((quiz) => (
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
                {quiz.description || 'Interactive assessment quiz.'}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button
                  className="btn btn-danger btn-sm btn-full"
                  onClick={() => handleDeleteQuiz(quiz._id)}
                >
                  🗑️ Delete Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
