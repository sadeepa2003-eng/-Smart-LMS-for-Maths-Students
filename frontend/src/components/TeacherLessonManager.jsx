import React, { useEffect, useState } from 'react'

export default function TeacherLessonManager({ token }) {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('Algebra')
  const [content, setContent] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const API_URL = 'http://localhost:5000/api'

  useEffect(() => {
    fetchLessons()
  }, [])

  async function fetchLessons() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/lessons`)
      if (!res.ok) throw new Error('Failed to load lessons')
      const data = await res.json()
      setLessons(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleStartCreate() {
    setEditingLessonId(null)
    setTitle('')
    setTopic('Algebra')
    setContent('')
    setResourceUrl('')
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function handleStartEdit(lesson) {
    setEditingLessonId(lesson._id)
    setTitle(lesson.title)
    setTopic(lesson.topic)
    setContent(lesson.content)
    setResourceUrl(lesson.resourceUrl || '')
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  async function handleSaveLesson(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const url = editingLessonId
      ? `${API_URL}/lessons/${editingLessonId}`
      : `${API_URL}/lessons`
    const method = editingLessonId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, topic, content, resourceUrl })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Operation failed')

      setSuccess(data.message)
      setShowForm(false)
      fetchLessons()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteLesson(lessonId) {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return

    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_URL}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Delete failed')

      setSuccess(data.message)
      fetchLessons()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="page-title">Teacher Lesson Management</h2>
          <p className="page-subtitle">Publish, modify, and delete curriculum lessons for students.</p>
        </div>
        <button className="btn btn-primary" onClick={handleStartCreate}>
          ➕ Add New Lesson
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingLessonId ? 'Edit Lesson' : 'Create New Lesson'}
              </h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveLesson}>
              <div className="form-group">
                <label className="form-label">Lesson Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Solving Quadratic Equations"
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
                <label className="form-label">Lesson Content / Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Provide step-by-step explanations, formulas, and worked examples..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">External Resource URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.khanacademy.org/..."
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingLessonId ? 'Save Changes' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lessons List */}
      {loading ? (
        <p>Loading lessons...</p>
      ) : lessons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No lessons found. Click "Add New Lesson" above to publish one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lessons.map((lesson) => (
            <div key={lesson._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#1e293b' }}>
                    {lesson.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge badge-topic">{lesson.topic}</span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Created: {new Date(lesson.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleStartEdit(lesson)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteLesson(lesson._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 12,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 140,
                  overflowY: 'auto'
                }}
              >
                {lesson.content}
              </div>

              {lesson.resourceUrl && (
                <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                  <a href={lesson.resourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    🔗 {lesson.resourceUrl}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
