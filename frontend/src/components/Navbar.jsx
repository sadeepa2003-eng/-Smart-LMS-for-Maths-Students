import React from 'react'

export default function Navbar({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  backendStatus
}) {
  const roles = user?.roles?.length ? user.roles : user ? [user.role] : []

  return (
    <header className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">📐</span>
        <span>Smart Maths LMS</span>
      </div>

      {user && (
        <nav className="nav-center">
          {roles.includes('student') && (
            <>
              <button
                className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
              <button
                className={`nav-btn ${activeTab === 'lessons' ? 'active' : ''}`}
                onClick={() => setActiveTab('lessons')}
              >
                📚 Lessons
              </button>
              <button
                className={`nav-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                onClick={() => setActiveTab('quizzes')}
              >
                📝 Quizzes
              </button>
              <button
                className={`nav-btn ${activeTab === 'progress' ? 'active' : ''}`}
                onClick={() => setActiveTab('progress')}
              >
                📈 My Progress
              </button>
            </>
          )}
          {roles.includes('teacher') && (
            <>
              <button
                className={`nav-btn ${activeTab === 'manage-lessons' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage-lessons')}
              >
                📖 Manage Lessons
              </button>
              <button
                className={`nav-btn ${activeTab === 'manage-quizzes' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage-quizzes')}
              >
                ✍️ Manage Quizzes
              </button>
              <button
                className={`nav-btn ${activeTab === 'student-results' ? 'active' : ''}`}
                onClick={() => setActiveTab('student-results')}
              >
                👥 Student Results
              </button>
            </>
          )}
        </nav>
      )}

      <div className="nav-right">
        <div
          className={`status-pill ${
            backendStatus.connected ? 'status-connected' : 'status-disconnected'
          }`}
          title={backendStatus.message}
        >
          <span className="status-dot"></span>
          <span>{backendStatus.connected ? 'API Online' : 'API Offline'}</span>
        </div>

        {user ? (
          <div className="user-badge">
            <span>{user.name}</span>
            <span className={`role-pill ${roles.includes('teacher') ? 'role-teacher' : 'role-student'}`}>
              {roles.join(' + ')}
            </span>
            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 6 }}
            >
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
