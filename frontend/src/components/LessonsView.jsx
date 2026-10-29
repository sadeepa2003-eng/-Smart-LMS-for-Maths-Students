import React, { useEffect, useState } from 'react'

export default function LessonsView({ initialTopic = 'All' }) {
  const [lessons, setLessons] = useState([])
  const [topicFilter, setTopicFilter] = useState(initialTopic)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const filteredLessons = lessons.filter((lesson) =>
    `${lesson.title} ${lesson.topic}`.toLocaleLowerCase().includes(normalizedSearch)
  )

  useEffect(() => {
    fetchLessons()
  }, [topicFilter])

  async function fetchLessons() {
    setLoading(true)
    setError('')
    try {
      const url =
        topicFilter === 'All'
          ? `${API_URL}/lessons`
          : `${API_URL}/lessons?topic=${encodeURIComponent(topicFilter)}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load lessons')
      const data = await res.json()
      setLessons(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Maths Lessons</h2>
        <p className="page-subtitle">
          Browse study materials across Algebra, Geometry, and Straight Lines.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="search"
          className="form-input lesson-search-input"
          aria-label="Search lessons by title or topic"
          placeholder="Search lessons by title or topic"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
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
        <p>Loading lessons...</p>
      ) : lessons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No lessons found for this topic filter.
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No lessons match “{searchQuery.trim()}”.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredLessons.map((lesson) => (
            <div key={lesson._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: '#1e293b' }}>
                    {lesson.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge badge-topic">{lesson.topic}</span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      By {lesson.createdBy?.name || 'Teacher'} • {new Date(lesson.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {lesson.resourceUrl && (
                  <a
                    href={lesson.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    🔗 External Resource
                  </a>
                )}
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: 16,
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                  border: '1px solid #e2e8f0'
                }}
              >
                {lesson.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
