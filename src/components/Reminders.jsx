import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function Reminders() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [reminders, setReminders] = useState([])
  const [text, setText] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadReminders()
    }
  }, [user])

  const loadReminders = () => {
    if (!user) return
    
    try {
      const saved = localStorage.getItem(`reminders_${user.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Filter only upcoming reminders (remindAt > now)
        const now = new Date()
        const upcoming = parsed.filter(r => new Date(r.remindAt) > now)
        upcoming.sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt))
        setReminders(upcoming)
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveReminders = (updated) => {
    if (!user) return
    
    try {
      localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updated))
      setReminders(updated)
    } catch (error) {
      console.error('Error saving reminders:', error)
      alert(t('fillCorrectly'))
    }
  }

  const addReminder = (e) => {
    e.preventDefault()
    
    if (!text.trim() || !remindAt) {
      alert(t('fillAllFields'))
      return
    }

    const remindAtDate = new Date(remindAt)
    if (remindAtDate < new Date()) {
      alert(t('selectFutureDate'))
      return
    }

    // Create reminder object with userId, userEmail, and userLang
    const reminder = {
      id: Date.now().toString(),
      text: text.trim(),
      remindAt: remindAtDate.toISOString(),
      notified: false,
      userId: user.id,
      userEmail: user.email,
      userLang: language
    }

    // Load all reminders (including past ones) to save
    const saved = localStorage.getItem(`reminders_${user.id}`)
    const allReminders = saved ? JSON.parse(saved) : []
    const updated = [...allReminders, reminder]
    
    // Save all reminders
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updated))
    
    // Update displayed reminders (only upcoming)
    const now = new Date()
    const upcoming = updated.filter(r => new Date(r.remindAt) > now)
    upcoming.sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt))
    setReminders(upcoming)
    
    setText('')
    setRemindAt('')
  }

  const deleteReminder = (id) => {
    if (window.confirm(t('deleteReminder'))) {
      // Load all reminders
      const saved = localStorage.getItem(`reminders_${user.id}`)
      const allReminders = saved ? JSON.parse(saved) : []
      
      // Remove the reminder
      const updated = allReminders.filter(r => r.id !== id)
      localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updated))
      
      // Update displayed reminders (only upcoming)
      const now = new Date()
      const upcoming = updated.filter(r => new Date(r.remindAt) > now)
      upcoming.sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt))
      setReminders(upcoming)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading')}</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('reminders')}</h2>

      {/* Info Message */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {t('reminderNote')}
        </p>
      </div>

      {/* Add Reminder Form */}
      <form onSubmit={addReminder} className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('addReminder')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('reminderText')}
            required
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            required
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="mt-3 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
        >
          {t('set')}
        </button>
      </form>

      {/* Reminder List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('upcomingReminders')}</h3>
        {reminders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">{t('noReminders')}</p>
            <p className="text-sm">{t('addFirstReminder')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 mb-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {reminder.text}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {new Date(reminder.remindAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      ⏰ {t('scheduled')}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="ml-3 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Reminders
