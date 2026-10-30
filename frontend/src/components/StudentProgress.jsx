import React, { useEffect, useState } from 'react'

export default function StudentProgress({ token, setActiveTab }) {
  const [attempts, setAttempts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [topicFilter, setTopicFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const hasActiveFilters = normalizedSearch !== '' || topicFilter !== 'All' || statusFilter !== 'All'
  const filteredAttempts = attempts.filter((attempt) =>
    (topicFilter === 'All' || attempt.topic === topicFilter) &&
    (statusFilter === 'All' || attempt.recommendationLevel === statusFilter) &&
    `${attempt.quizTitle} ${attempt.topic} ${attempt.recommendation}`
      .toLocaleLowerCase()
      .includes(normalizedSearch)
  )

  function clearFilters() {
    setSearchQuery('')
    setTopicFilter('All')
    setStatusFilter('All')
  }

  function exportFilteredAttempts() {
    const csvCell = (value) => {
      const text = String(value ?? '')
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Date & Time', 'Quiz', 'Topic', 'Score', 'Total Questions', 'Percentage', 'Status', 'Recommendation'],
      ...filteredAttempts.map((attempt) => [
        new Date(attempt.submittedAt).toLocaleString(),
        attempt.quizTitle,
        attempt.topic,
        attempt.score,
        attempt.total,
        `${attempt.percentage}%`,
        attempt.recommendationLevel,
        attempt.recommendation
      ])
    ]
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.download = 'maths-lms-progress.csv'
    downloadLink.click()
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/attempts/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load quiz attempts history')
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
        <h2 className="page-title">My Progress & Attempt History</h2>
        <p className="page-subtitle">
          Review all your completed assessments and the system recommendations.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading attempt history...</p>
      ) : attempts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <p>You have not completed any quizzes yet.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => setActiveTab('quizzes')}
          >
            Take Your First Quiz
          </button>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <input
              type="search"
              className="form-input quiz-search-input"
              aria-label="Search attempt history by quiz, topic, or recommendation"
              placeholder="Search by quiz, topic, or recommendation"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Filter by Topic:</span>
            {['All', 'Algebra', 'Geometry', 'Straight Lines'].map((topic) => (
              <button
                key={topic}
                type="button"
                className={`filter-btn ${topicFilter === topic ? 'active' : ''}`}
                aria-pressed={topicFilter === topic}
                onClick={() => setTopicFilter(topic)}
              >
                {topic}
              </button>
            ))}
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Filter by Status:</span>
            {[
              { value: 'All', label: 'All' },
              { value: 'revise', label: 'Revise' },
              { value: 'practice', label: 'Practice' },
              { value: 'advance', label: 'Mastered' }
            ].map((status) => (
              <button
                key={status.value}
                type="button"
                className={`filter-btn ${statusFilter === status.value ? 'active' : ''}`}
                aria-pressed={statusFilter === status.value}
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={exportFilteredAttempts}
              disabled={filteredAttempts.length === 0}
            >
              Export CSV
            </button>
          </div>
          {filteredAttempts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <p>No attempts match the selected search and filters.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="table-container">
              {hasActiveFilters && (
                <p style={{ margin: 12, color: '#64748b', fontSize: '0.9rem' }}>
                  Showing {filteredAttempts.length} of {attempts.length} attempts
                </p>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Quiz</th>
                    <th>Topic</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Smart Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt) => (
                    <tr key={attempt._id}>
                      <td style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(attempt.submittedAt).toLocaleDateString()} {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{attempt.quizTitle}</td>
                      <td>
                        <span className="badge badge-topic">{attempt.topic}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {attempt.score} / {attempt.total} ({attempt.percentage}%)
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(attempt.recommendationLevel)}`}>
                          {attempt.recommendationLevel === 'revise'
                            ? 'Revise'
                            : attempt.recommendationLevel === 'practice'
                            ? 'Practice'
                            : 'Mastered'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 360 }}>
                        {attempt.recommendation}
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
