import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import AuthView from './components/AuthView'
import StudentDashboard from './components/StudentDashboard'
import LessonsView from './components/LessonsView'
import QuizzesView from './components/QuizzesView'
import StudentProgress from './components/StudentProgress'
import TeacherLessonManager from './components/TeacherLessonManager'
import TeacherQuizManager from './components/TeacherQuizManager'
import TeacherResultsMonitor from './components/TeacherResultsMonitor'
import './App.css'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('maths_lms_token') || null)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('maths_lms_user')
    return saved ? JSON.parse(saved) : null
  })

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('maths_lms_user')
    if (saved) {
      const u = JSON.parse(saved)
      return u.role === 'teacher' ? 'manage-lessons' : 'dashboard'
    }
    return 'dashboard'
  })

  const [selectedTopic, setSelectedTopic] = useState('All')
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    message: 'Checking connection...'
  })

  const API_URL = 'http://localhost:5000/api'

  useEffect(() => {
    checkBackendHealth()
    const timer = setInterval(checkBackendHealth, 30000)
    return () => clearInterval(timer)
  }, [])

  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_URL}/health`)
      if (!res.ok) throw new Error('API server reported error')
      const data = await res.json()
      setBackendStatus({
        connected: data.database === 'connected',
        message: `${data.message} | DB: ${data.database}`
      })
    } catch {
      setBackendStatus({
        connected: false,
        message: 'Unable to reach backend server on http://localhost:5000'
      })
    }
  }

  function handleLoginSuccess(newToken, newUser) {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('maths_lms_token', newToken)
    localStorage.setItem('maths_lms_user', JSON.stringify(newUser))
    setActiveTab(newUser.role === 'teacher' ? 'manage-lessons' : 'dashboard')
  }

  function handleLogout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('maths_lms_token')
    localStorage.removeItem('maths_lms_user')
    setActiveTab('dashboard')
  }

  return (
    <div className="app-wrapper">
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      <main style={{ flex: 1, paddingBottom: 40 }}>
        {!user || !token ? (
          <AuthView onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'student' ? (
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                token={token}
                setActiveTab={setActiveTab}
                setSelectedTopic={setSelectedTopic}
              />
            )}
            {activeTab === 'lessons' && (
              <LessonsView initialTopic={selectedTopic} />
            )}
            {activeTab === 'quizzes' && (
              <QuizzesView
                token={token}
                initialTopic={selectedTopic}
                onQuizCompleted={() => {}}
              />
            )}
            {activeTab === 'progress' && (
              <StudentProgress token={token} setActiveTab={setActiveTab} />
            )}
          </>
        ) : (
          <>
            {activeTab === 'manage-lessons' && (
              <TeacherLessonManager token={token} />
            )}
            {activeTab === 'manage-quizzes' && (
              <TeacherQuizManager token={token} />
            )}
            {activeTab === 'student-results' && (
              <TeacherResultsMonitor token={token} />
            )}
          </>
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#64748b',
          background: '#ffffff'
        }}
      >
        <span>
          Smart Maths LMS • Built with MERN Stack • Rule-Based Revision Recommendations
        </span>
      </footer>
    </div>
  )
}

export default App
