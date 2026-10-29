import React, { useState } from 'react'

export default function AuthView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [teacherInviteCode, setTeacherInviteCode] = useState('')
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
    const payload = isRegister
      ? {
          name,
          email,
          password,
          roles: [role],
          ...(role === 'teacher' ? { teacherInviteCode } : {})
        }
      : { email, password }

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

  return (
    <div className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-intro-title">
        <div className="auth-brand-mark" aria-hidden="true">∑</div>
        <p className="auth-eyebrow">SMART MATHS LEARNING</p>
        <h1 id="auth-intro-title">Make maths make sense.</h1>
        <p className="auth-intro-copy">
          A brighter way to learn, practise, and see your progress — all in one place.
        </p>
        <div className="auth-topic-list" aria-label="Available maths topics">
          <span>Algebra</span>
          <span>Geometry</span>
          <span>Straight Lines</span>
        </div>
        <div className="auth-promise">
          <span className="auth-promise-icon" aria-hidden="true">✓</span>
          <span>Learn at your pace. Grow with every question.</span>
        </div>
        <span className="auth-decoration auth-decoration-one" aria-hidden="true" />
        <span className="auth-decoration auth-decoration-two" aria-hidden="true" />
      </section>

      <section className="auth-card" aria-label={isRegister ? 'Create your account' : 'Sign in'}>
        <div className="auth-card-heading">
          <p className="auth-card-kicker">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h2>{isRegister ? 'Create your account' : 'Sign in to continue'}</h2>
          <p>
            {isRegister
              ? 'It only takes a minute to get started.'
              : 'Your next maths win is just around the corner.'}
          </p>
        </div>

        <div className="auth-tabs" role="group" aria-label="Account access">
          <button
            type="button"
            aria-pressed={!isRegister}
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false)
              setErrorMsg('')
              setSuccessMsg('')
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={isRegister}
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true)
              setErrorMsg('')
              setSuccessMsg('')
            }}
          >
            Register
          </button>
        </div>

        {errorMsg && <div className="alert alert-danger" role="alert">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success" role="status">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="e.g. Jordan Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          {isRegister && (
            <fieldset className="form-group auth-role-fieldset">
              <legend className="form-label">I am joining as a</legend>
              <div className="auth-role-options">
                {[
                  { value: 'student', label: 'Student' },
                  { value: 'teacher', label: 'Teacher' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`auth-role-option ${role === option.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => {
                        setRole(option.value)
                        setErrorMsg('')
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <small className="auth-help-text">
                Choose one account type. Teacher access requires an invite code.
              </small>
            </fieldset>
          )}

          {isRegister && role === 'teacher' && (
            <div className="form-group">
              <label className="form-label" htmlFor="teacher-invite-code">Teacher invite code</label>
              <input
                id="teacher-invite-code"
                type="password"
                className="form-input"
                value={teacherInviteCode}
                onChange={(e) => setTeacherInviteCode(e.target.value)}
                autoComplete="off"
                required
              />
              <small className="auth-help-text">Ask your LMS administrator for an invite code.</small>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full auth-submit"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer-note">
          {isRegister
            ? 'By creating an account, you’re ready to start learning.'
            : 'A smarter study session starts here.'}
        </p>
      </section>
    </div>
  )
}
