import React, { useState } from 'react'

export default function AuthView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const API_URL = 'http://localhost:5000/api'

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    const endpoint = isRegister ? `${API_URL}/auth/register` : `${API_URL}/auth/login`
    const payload = isRegister ? { name, email, password } : { email, password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      setSuccessMsg(data.message)
      if (data.token && data.user) {
        onLoginSuccess(data.token, data.user)
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin(role) {
    setErrorMsg('')
    if (role === 'teacher') {
      setEmail('teacher@mathslms.com')
      setPassword('Teacher123!')
      setIsRegister(false)
    } else {
      setEmail('student@mathslms.com')
      setPassword('Student123!')
      setIsRegister(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div style={{ textAlign: 'center', marginBottom: 24, marginTop: 16 }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 8, color: '#1e293b' }}>
          Smart LMS for Maths Students
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
          Master <strong>Algebra</strong>, <strong>Geometry</strong>, and <strong>Straight Lines</strong>.
          Complete interactive quizzes and receive transparent rule-based revision recommendations.
        </p>
      </div>

      <div className="auth-container">
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn btn-full ${!isRegister ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setIsRegister(false)
              setErrorMsg('')
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn btn-full ${isRegister ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setIsRegister(true)
              setErrorMsg('')
            }}
          >
            Register Student
          </button>
        </div>

        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Jordan Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ padding: '12px', fontSize: '1rem', marginTop: 10 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Create Student Account' : 'Sign In'}
          </button>
        </form>

        <div className="demo-box">
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8, color: '#334155' }}>
            ⚡ Quick Demo Accounts (One-Click Fill):
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('student')}
            >
              👤 Fill Student (Alex)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('teacher')}
            >
              🎓 Fill Teacher (Dr. Sarah)
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 8 }}>
            Click to fill credentials, then click <strong>Sign In</strong>.
          </div>
        </div>
      </div>
    </div>
  )
}
