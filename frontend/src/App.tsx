import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

// Components
import Layout from './components/Layout/Layout'

import Dashboard from './pages/Dashboard'
import DiaryList from './pages/DiaryList'
import DiaryEntry from './pages/DiaryEntry'
import NewEntry from './pages/NewEntry'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Memories from './pages/Memories'
import TestPage from './pages/TestPage'
import TailwindTest from './pages/TailwindTest'

// Context
import { ThemeProvider } from './contexts/ThemeContext'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika (garbage collection time)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Global types imported from vite-env.d.ts

function App() {
  // Development mode check
  const isDev = window.electronDev?.isDev || false

  // Health check on startup
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        if (window.electronAPI?.db?.healthCheck) {
          const health = await window.electronAPI.db.healthCheck()
          console.log('🏥 Database health check:', health)
        }
      } catch (error) {
        console.error('❌ Database health check failed:', error)
      }
    }

    checkHealth()
  }, [])

  // Electron notification navigation listener
  React.useEffect(() => {
    if (window.electronAPI?.on?.navigateToNewEntry) {
      const removeListener = window.electronAPI.on.navigateToNewEntry(() => {
        // Navigate to new entry page when notification is clicked
        window.location.hash = '#/new-entry'
        console.log('📝 Notification clicked - navigating to new entry')
      })

      return removeListener
    }
  }, [])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+N or Cmd+N - New entry
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault()
        // Navigate to new entry page
        window.location.hash = '#/new-entry'
      }
      
      // Ctrl+S or Cmd+S - Save entry (handled by individual components)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        // This will be handled by the entry editing component
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/diary-list" element={<DiaryList />} />
              <Route path="/entry/:id" element={<DiaryEntry />} />
              <Route path="/diary/:id" element={<DiaryEntry />} />
              <Route path="/new-entry" element={<NewEntry />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/anılar" element={<Memories />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/tailwind-test" element={<TailwindTest />} />
            </Routes>
          </Layout>
          
          {/* Development Info */}
          {isDev && (
            <div className="fixed bottom-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs z-50">
              🔧 Dev Mode | Electron {window.electronDev?.electronVersion}
            </div>
          )}
          

        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
