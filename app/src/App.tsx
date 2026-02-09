import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { HabitPage } from './pages/HabitPage'
import { FitnessPage } from './pages/FitnessPage'
import { LifePage } from './pages/LifePage'
import { BedtimeEnforcer } from './components/BedtimeEnforcer'

type TabType = 'sleep' | 'habits' | 'fitness' | 'life'

const navStyles = {
  container: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'center',
    gap: '0.25rem',
    padding: '0.75rem 0.5rem',
    zIndex: 100,
  },
  tab: (active: boolean) => ({
    flex: 1,
    maxWidth: '85px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
    color: active ? '#a78bfa' : '#6b7280',
    transition: 'all 0.2s',
  }),
  tabIcon: {
    fontSize: '1.125rem',
  } as React.CSSProperties,
  tabLabel: {
    fontSize: '0.625rem',
    fontWeight: '500',
  } as React.CSSProperties,
}

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('sleep')
  const [bedtimeWarningDismissed, setBedtimeWarningDismissed] = useState(false)

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #312e81 0%, #581c87 50%, #9d174d 100%)',
        color: '#fff'
      }}>
        <span>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'sleep': return <Dashboard />
      case 'habits': return <HabitPage />
      case 'fitness': return <FitnessPage />
      case 'life': return <LifePage />
    }
  }

  return (
    <>
      {renderPage()}

      {/* Bedtime Enforcer - appears at 10:30 PM and takes over at 11 PM */}
      {!bedtimeWarningDismissed && (
        <BedtimeEnforcer
          targetBedtime="23:00"
          warningMinutes={30}
          onDismiss={() => setBedtimeWarningDismissed(true)}
        />
      )}

      {/* Bottom Navigation */}
      <nav style={navStyles.container}>
        <button
          style={navStyles.tab(activeTab === 'sleep')}
          onClick={() => setActiveTab('sleep')}
        >
          <span style={navStyles.tabIcon}>🌙</span>
          <span style={navStyles.tabLabel}>Sleep</span>
        </button>

        <button
          style={navStyles.tab(activeTab === 'habits')}
          onClick={() => setActiveTab('habits')}
        >
          <span style={navStyles.tabIcon}>🎯</span>
          <span style={navStyles.tabLabel}>Habits</span>
        </button>

        <button
          style={navStyles.tab(activeTab === 'fitness')}
          onClick={() => setActiveTab('fitness')}
        >
          <span style={navStyles.tabIcon}>🏃</span>
          <span style={navStyles.tabLabel}>Fitness</span>
        </button>

        <button
          style={navStyles.tab(activeTab === 'life')}
          onClick={() => setActiveTab('life')}
        >
          <span style={navStyles.tabIcon}>🏠</span>
          <span style={navStyles.tabLabel}>Life</span>
        </button>
      </nav>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
