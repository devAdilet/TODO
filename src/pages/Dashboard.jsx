import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import Todos from '../components/Todos'
import Budget from '../components/Budget'
import Reminders from '../components/Reminders'

function Dashboard() {
  const { user, logout } = useAuth()
  const { t, language, changeLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('todos')

  const tabs = [
    { id: 'todos', name: t('tasks'), icon: '✓' },
    { id: 'budget', name: t('budget'), icon: '$' },
    { id: 'reminders', name: t('reminders'), icon: '⏰' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Assistant</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome')}, {user?.name || user?.email}!</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('ru')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    language === 'ru'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  RU
                </button>
              </div>
              
              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {activeTab === 'todos' && <Todos />}
          {activeTab === 'budget' && <Budget />}
          {activeTab === 'reminders' && <Reminders />}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
