import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { db } from '../firebase/config'
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'

function Todos() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'users', user.uid || user.id, 'todos'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(newTasks)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching tasks: ", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      await addDoc(collection(db, 'users', user.uid || user.id, 'todos'), {
        text: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      })
      setNewTask('')
    } catch (error) {
      console.error("Error adding task: ", error)
      alert('Error adding task')
    }
  }

  const toggleComplete = async (id, currentStatus) => {
    try {
      const taskRef = doc(db, 'users', user.uid || user.id, 'todos', id)
      await updateDoc(taskRef, {
        completed: !currentStatus
      })
    } catch (error) {
      console.error("Error updating task: ", error)
    }
  }

  const deleteTask = async (id) => {
    if (window.confirm(t('deleteTask'))) {
      try {
        await deleteDoc(doc(db, 'users', user.uid || user.id, 'todos', id))
      } catch (error) {
        console.error("Error deleting task: ", error)
      }
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading')}</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('myTasks')}</h2>

      {/* Add Form */}
      <form onSubmit={addTask} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={t('enterTask')}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
          >
            {t('add')}
          </button>
        </div>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">{t('noTasks')}</p>
          <p className="text-sm">{t('addFirstTask')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition"
            >
              <input
                type="checkbox"
                checked={task.completed || false}
                onChange={() => toggleComplete(task.id, task.completed)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <span
                className={`flex-1 ${task.completed
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-800 dark:text-gray-200 font-medium'
                  }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
              >
                {t('delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Todos
