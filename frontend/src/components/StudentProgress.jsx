import React, { useEffect, useState } from 'react'

export default function StudentProgress({ token, setActiveTab }) {
  const [attempts, setAttempts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [topicFilter, setTopicFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const hasInvalidDateRange = startDate !== '' && endDate !== '' && startDate > endDate
  const hasActiveFilters = normalizedSearch !== '' || topicFilter !== 'All' || statusFilter !== 'All' ||
    startDate !== '' || endDate !== ''
  const filteredAttempts = hasInvalidDateRange
    ? []
    : attempts.filter((attempt) => {
        const attemptDate = new Date(attempt.submittedAt).toISOString().slice(0, 10)
        return (
          (topicFilter === 'All' || attempt.topic === topicFilter) &&
          (statusFilter === 'All' || attempt.recommendationLevel === statusFilter) &&
          (!startDate || attemptDate >= startDate) &&
          (!endDate || attemptDate <= endDate) &&
          `${attempt.quizTitle} ${attempt.topic} ${attempt.recommendation}`
            .toLocaleLowerCase()
            .includes(normalizedSearch)
        )
      })
  const sortedAttempts = [...filteredAttempts].sort((first, second) => {
    if (sortOrder === 'oldest') {
      return new Date(first.submittedAt) - new Date(second.submittedAt)
    }
    if (sortOrder === 'highest-score') {
      return second.percentage - first.percentage
    }
    if (sortOrder === 'lowest-score') {
      return first.percentage - second.percentage
    }
    return new Date(second.submittedAt) - new Date(first.submittedAt)
  })

  function clearFilters() {
    setSearchQuery('')
    setTopicFilter('All')
    setStatusFilter('All')
    setStartDate('')
    setEndDate('')
  }

  function exportFilteredAttempts() {
    const csvCell = (value) => {
      const text = String(value ?? '')
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Date & Time', 'Quiz', 'Topic', 'Score', 'Total Questions', 'Percentage', 'Status', 'Recommendation'],
      ...sortedAttempts.map((attempt) => [
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
              Sort by:
              <select
                className="form-input"
                aria-label="Sort attempt history"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest-score">Highest score</option>
                <option value="lowest-score">Lowest score</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
              From:
              <input
                type="date"
                className="form-input"
                aria-label="Filter attempts from date"
                max={endDate || undefined}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
              To:
              <input
                type="date"
                className="form-input"
                aria-label="Filter attempts through date"
                min={startDate || undefined}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
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
              <p>
                {hasInvalidDateRange
                  ? 'The start date must be on or before the end date.'
                  : 'No attempts match the selected search and filters.'}
              </p>
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
                  {sortedAttempts.map((attempt) => (
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
