import React, { useEffect, useState } from 'react'

export default function StudentDashboard({ token, setActiveTab, setSelectedTopic }) {
  const [stats, setStats] = useState(null)
  const [recentAttempts, setRecentAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    setError('')
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/attempts/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/attempts/my-history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!statsRes.ok || !historyRes.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const statsData = await statsRes.json()
      const historyData = await historyRes.json()

      setStats(statsData)
      setRecentAttempts(historyData.slice(0, 5))
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

  function getCardClass(level) {
    if (level === 'revise') return 'rec-revise'
    if (level === 'practice') return 'rec-practice'
    if (level === 'advance') return 'rec-advance'
    return 'rec-neutral'
  }

  function handleTopicAction(topic, targetTab) {
    if (setSelectedTopic) setSelectedTopic(topic)
    setActiveTab(targetTab)
  }

  if (loading) {
    return <div className="container"><p>Loading dashboard...</p></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Student Dashboard</h2>
        <p className="page-subtitle">
          Rule-based revision recommendations dynamically calculated from your quiz results.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Smart Recommendation Cards */}
      <h3 style={{ marginBottom: 12, fontSize: '1.2rem', color: '#1e293b' }}>
        🎯 Topic Mastery & Revision Recommendations
      </h3>

      <div className="grid-3">
        {['Algebra', 'Geometry', 'Straight Lines'].map((topic) => {
          const topicInfo = stats?.topicStats?.[topic]
          const level = topicInfo?.latestRecommendationLevel || 'neutral'
          const count = topicInfo?.totalAttempts || 0
          const avg = topicInfo?.averagePercentage

          return (
            <div key={topic} className={`card rec-card ${getCardClass(level)}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{topic}</h4>
                <span className={`badge ${getBadgeClass(level)}`}>
                  {level === 'revise'
                    ? '⚠️ Revise Topic'
                    : level === 'practice'
                    ? '🔄 More Practice'
                    : level === 'advance'
                    ? '✅ Mastered'
                    : '⚪ Not Attempted'}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 12 }}>
                Attempts: <strong>{count}</strong> {count > 0 && `• Avg Score: ${avg}%`}
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  marginBottom: 16
                }}
              >
                <strong>Recommendation:</strong>
                <p style={{ marginTop: 4, color: '#334155' }}>
                  {topicInfo?.latestRecommendation}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleTopicAction(topic, 'lessons')}
                >
                  📖 Study Lessons
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleTopicAction(topic, 'quizzes')}
                >
                  ✍️ Take Quiz
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rules Explainer */}
      <div
        className="card"
        style={{
          background: '#f8fafc',
          borderLeft: '4px solid #2563eb',
          marginBottom: 28,
          padding: 16
        }}
      >
        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
          ℹ️ How the Smart Recommendation Rule Works:
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: '#475569' }}>
          <li>
            <strong>Score &lt; 50%:</strong> System triggers <em>Revise Topic</em> recommendation with links to review lessons.
          </li>
          <li>
            <strong>Score 50% – 74%:</strong> System triggers <em>More Practice</em> to reinforce solid foundation.
          </li>
          <li>
            <strong>Score ≥ 75%:</strong> System triggers <em>Topic Mastery</em> recommendation advising you to move to the next topic.
          </li>
        </ul>
      </div>

      {/* Recent Quiz Attempts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
          🕒 Recent Quiz Attempts
        </h3>
        {recentAttempts.length > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('progress')}
          >
            View All Progress
          </button>
        )}
      </div>

      {recentAttempts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
          <p>You haven't attempted any quizzes yet.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => setActiveTab('quizzes')}
          >
            Start Your First Quiz
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Topic</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Recommendation</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((attempt) => (
                <tr key={attempt._id}>
                  <td style={{ fontWeight: 600 }}>{attempt.quizTitle}</td>
                  <td>
                    <span className="badge badge-topic">{attempt.topic}</span>
                  </td>
                  <td>{attempt.score} / {attempt.total}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(attempt.recommendationLevel)}`}>
                      {attempt.percentage}%
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', maxWidth: 320 }}>
                    {attempt.recommendation}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {new Date(attempt.submittedAt).toLocaleDateString()} {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
