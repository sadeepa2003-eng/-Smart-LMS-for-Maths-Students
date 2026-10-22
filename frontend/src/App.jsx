import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch('http://localhost:5000/api/health')
        if (!response.ok) {
          throw new Error('Backend is not ready')
        }
        const data = await response.json()
        setStatus(`${data.message}. Database: ${data.database}`)
      } catch {
        setStatus('Connection failed. Check the backend terminal.')
      }
    }

    checkBackend()
  }, [])

  return (
    <main style={{ maxWidth: 800, margin: '60px auto', padding: 24 }}>
      <h1>Smart Maths LMS</h1>
      <p>Learn maths, practise quizzes, and track your progress.</p>
      <h2>System status</h2>
      <p>{status}</p>
      <h2>Learning topics</h2>
      <ul>
        <li>Algebra</li>
        <li>Geometry</li>
        <li>Straight Lines</li>
      </ul>
    </main>
  )
}

export default App
