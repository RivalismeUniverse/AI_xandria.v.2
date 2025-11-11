import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './hooks/useWallet'
import Header from './components/Header'
import Landing from './components/Landing'
import PersonaGenerator from './components/PersonaGenerator'
import BattleArena from './components/BattleArena'
import Marketplace from './components/Marketplace'
import PersonaGallery from './components/PersonaGallery'

function App() {
  const [currentView, setCurrentView] = useState('landing')

  const renderContent = () => {
    switch (currentView) {
      case 'generate':
        return <PersonaGenerator />
      case 'battle':
        return <BattleArena />
      case 'marketplace':
        return <Marketplace />
      case 'gallery':
        return <PersonaGallery />
      default:
        return <Landing onNavigate={setCurrentView} />
    }
  }

  return (
    <WalletProvider>
      <div className="app">
        <Header currentView={currentView} onNavigate={setCurrentView} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </WalletProvider>
  )
}

export default App
