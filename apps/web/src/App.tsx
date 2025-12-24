import { Routes, Route, Navigate } from 'react-router-dom'
import SportDashboard from './pages/SportDashboard'
import TeamStatistics from './pages/TeamStatistics'
import PlayerStatistics from './pages/PlayerStatistics'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            {/* Main dashboard - shows first enabled sport or sports selection */}
            <Route path="/" element={<SportDashboard />} />

            {/* Individual sport routes */}
            <Route path="/sports" element={<SportDashboard />} />
            <Route path="/sports/:sportId" element={<SportDashboard />} />

            {/* Statistics pages */}
            <Route path="/team-statistics" element={<TeamStatistics />} />
            <Route path="/player-statistics" element={<PlayerStatistics />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
