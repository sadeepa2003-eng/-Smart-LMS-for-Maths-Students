import React, { useEffect, useState } from 'react'

export default function TeacherResultsMonitor({ token }) {
  const [attempts, setAttempts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [topicFilter, setTopicFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const hasInvalidDateRange = startDate !== '' && endDate !== '' && startDate > endDate
  const filteredAttempts = hasInvalidDateRange
    ? []
    : attempts.filter((attempt) => {
        const attemptDate = new Date(attempt.submittedAt).toISOString().slice(0, 10)
        return (
          (topicFilter === 'All' || attempt.topic === topicFilter) &&
          (statusFilter === 'All' || attempt.recommendationLevel === statusFilter) &&
          (!startDate || attemptDate >= startDate) &&
          (!endDate || attemptDate <= endDate) &&
          [
            attempt.studentId?.name || '',
            attempt.studentId?.email || '',
            attempt.quizTitle,
            attempt.topic
          ].join(' ').toLocaleLowerCase().includes(normalizedSearch)
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
  const studentKeys = new Set(filteredAttempts.map((attempt) =>
    attempt.studentId?._id ||
    attempt.studentId?.email ||
    attempt.studentId?.name ||
    attempt._id
  ))
  const averagePercentage = filteredAttempts.length
    ? Math.round(filteredAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / filteredAttempts.length)
    : null
  const needsRevisionCount = filteredAttempts.filter((attempt) => attempt.recommendationLevel === 'revise').length

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

  function exportFilteredAttempts() {
    const csvCell = (value) => {
      const text = String(value ?? '')
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Student', 'Email', 'Quiz', 'Topic', 'Score', 'Total Questions', 'Percentage', 'Status', 'Recommendation', 'Submitted At'],
      ...sortedAttempts.map((attempt) => [
        attempt.studentId?.name || 'Anonymous Student',
        attempt.studentId?.email || 'N/A',
        attempt.quizTitle,
        attempt.topic,
        attempt.score,
        attempt.total,
        `${attempt.percentage}%`,
        attempt.recommendationLevel,
        attempt.recommendation,
        new Date(attempt.submittedAt).toLocaleString()
      ])
    ]
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.download = 'maths-lms-student-results.csv'
    downloadLink.click()
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
  }

  function clearFilters() {
    setSearchQuery('')
    setTopicFilter('All')
    setStatusFilter('All')
    setStartDate('')
    setEndDate('')
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
              Sort by:
              <select
                className="form-input"
                aria-label="Sort teacher results"
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
                aria-label="Filter results from date"
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
                aria-label="Filter results through date"
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
            {(searchQuery !== '' || topicFilter !== 'All' || statusFilter !== 'All' || startDate !== '' || endDate !== '') && (
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
          <div className="grid-3">
            <div className="card">
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Matching attempts</p>
              <p style={{ margin: '8px 0 0', color: '#1e293b', fontSize: '1.8rem', fontWeight: 700 }}>
                {filteredAttempts.length}
              </p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Students represented</p>
              <p style={{ margin: '8px 0 0', color: '#1e293b', fontSize: '1.8rem', fontWeight: 700 }}>
                {studentKeys.size}
              </p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Average score</p>
              <p style={{ margin: '8px 0 0', color: '#1e293b', fontSize: '1.8rem', fontWeight: 700 }}>
                {averagePercentage === null ? '—' : `${averagePercentage}%`}
              </p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Needs revision</p>
              <p style={{ margin: '8px 0 0', color: '#1e293b', fontSize: '1.8rem', fontWeight: 700 }}>
                {needsRevisionCount}
              </p>
            </div>
          </div>
          {filteredAttempts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              {hasInvalidDateRange
                ? 'The start date must be on or before the end date.'
                : 'No results match the selected search, topic, status, and date range.'}
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
                  {sortedAttempts.map((attempt) => (
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
