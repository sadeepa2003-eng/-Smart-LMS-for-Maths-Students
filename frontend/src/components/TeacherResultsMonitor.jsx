import React, { useEffect, useState } from 'react'

export default function TeacherResultsMonitor({ token }) {
  const [attempts, setAttempts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const filteredAttempts = attempts.filter((attempt) =>
    [
      attempt.studentId?.name || '',
      attempt.studentId?.email || '',
      attempt.quizTitle,
      attempt.topic
    ].join(' ').toLocaleLowerCase().includes(normalizedSearch)
  )

  useEffect(() => {
    fetchAllAttempts()
  }, [])

  async function fetchAllAttempts() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/attempts/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load student attempt records')
      const data = await res.json()
      setAttempts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getBadgeClass(level) {
    if (level === 'revise') return 'badge-revise'
    if (level === 'practice') return 'badge-practice'
    if (level === 'advance') return 'badge-advance'
    return 'badge-neutral'
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Student Performance Monitor</h2>
        <p className="page-subtitle">
          Real-time tracking of student quiz submissions and system revision recommendations.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading student results...</p>
      ) : attempts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No student quiz attempts recorded yet.
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <input
              type="search"
              className="form-input quiz-search-input"
              aria-label="Search results by student, email, quiz, or topic"
              placeholder="Search by student, email, quiz, or topic"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          {filteredAttempts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              No results match “{searchQuery.trim()}”.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Quiz</th>
                    <th>Topic</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Rule Recommendation</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt) => (
                    <tr key={attempt._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{attempt.studentId?.name || 'Anonymous Student'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{attempt.studentId?.email || 'N/A'}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{attempt.quizTitle}</td>
                      <td>
                        <span className="badge badge-topic">{attempt.topic}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {attempt.score} / {attempt.total}
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(attempt.recommendationLevel)}`}>
                          {attempt.percentage}%
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 300 }}>
                        {attempt.recommendation}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(attempt.submittedAt).toLocaleDateString()} {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
