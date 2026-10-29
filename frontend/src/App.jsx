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

function userHasRole(currentUser, role) {
  return currentUser?.roles?.includes(role) || currentUser?.role === role
}

function initialTabForUser(currentUser) {
  return userHasRole(currentUser, 'student') ? 'dashboard' : 'manage-lessons'
}

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
      return initialTabForUser(u)
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
    setActiveTab(initialTabForUser(newUser))
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
        ) : (
          <>
            {userHasRole(user, 'student') && activeTab === 'dashboard' && (
              <StudentDashboard
                token={token}
                setActiveTab={setActiveTab}
                setSelectedTopic={setSelectedTopic}
              />
            )}
            {userHasRole(user, 'student') && activeTab === 'lessons' && (
              <LessonsView initialTopic={selectedTopic} />
            )}
            {userHasRole(user, 'student') && activeTab === 'quizzes' && (
              <QuizzesView
                token={token}
                initialTopic={selectedTopic}
                onQuizCompleted={() => {}}
              />
            )}
            {userHasRole(user, 'student') && activeTab === 'progress' && (
              <StudentProgress token={token} setActiveTab={setActiveTab} />
            )}
            {userHasRole(user, 'teacher') && activeTab === 'manage-lessons' && (
              <TeacherLessonManager token={token} />
            )}
            {userHasRole(user, 'teacher') && activeTab === 'manage-quizzes' && (
              <TeacherQuizManager token={token} />
            )}
            {userHasRole(user, 'teacher') && activeTab === 'student-results' && (
              <TeacherResultsMonitor token={token} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>
          Smart Maths LMS • Rule-Based Revision Recommendations
        </span>
      </footer>
    </div>
  )
}

export default App
