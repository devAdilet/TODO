import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function Budget() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState('overview') // 'overview' or 'settings'
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Transaction form
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  
  // Category form
  const [categoryName, setCategoryName] = useState('')
  const [categoryAmount, setCategoryAmount] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = () => {
    if (!user) return
    
    try {
      // Load categories
      const savedCategories = localStorage.getItem(`budget_categories_${user.id}`)
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories)
        setCategories(parsed)
        if (parsed.length > 0 && !categoryId) {
          setCategoryId(parsed[0].id)
        }
      }
      
      // Load transactions
      const savedTransactions = localStorage.getItem(`transactions_${user.id}`)
      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions)
        parsed.sort((a, b) => new Date(b.date) - new Date(a.date))
        setTransactions(parsed)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCategories = (updated) => {
    if (!user) return
    try {
      localStorage.setItem(`budget_categories_${user.id}`, JSON.stringify(updated))
      setCategories(updated)
    } catch (error) {
      console.error('Error saving categories:', error)
      alert('Failed to save category')
    }
  }

  const saveTransactions = (updated) => {
    if (!user) return
    try {
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updated))
      setTransactions(updated)
    } catch (error) {
      console.error('Error saving transactions:', error)
      alert('Failed to save transaction')
    }
  }

  // Category management
  const addCategory = (e) => {
    e.preventDefault()
    const amountNum = parseFloat(categoryAmount)
    
    if (!categoryName.trim() || !amountNum || amountNum <= 0) {
      alert(t('fillCorrectly'))
      return
    }

    if (editingCategory) {
      // Update existing
      const updated = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: categoryName.trim(), plannedAmount: amountNum }
          : cat
      )
      saveCategories(updated)
      setEditingCategory(null)
    } else {
      // Create new
      const category = {
        id: Date.now().toString(),
        name: categoryName.trim(),
        plannedAmount: amountNum,
        createdAt: new Date().toISOString()
      }
      saveCategories([...categories, category])
    }
    
    setCategoryName('')
    setCategoryAmount('')
  }

  const deleteCategory = (id) => {
    if (window.confirm(t('deleteCategory'))) {
      const updated = categories.filter(cat => cat.id !== id)
      saveCategories(updated)
      
      // Remove category from transactions
      const updatedTransactions = transactions.map(tx =>
        tx.categoryId === id ? { ...tx, categoryId: null } : tx
      )
      saveTransactions(updatedTransactions)
    }
  }

  const startEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryAmount(category.plannedAmount.toString())
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryAmount('')
  }

  // Transaction management
  const addTransaction = (e) => {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    
    if (!amountNum || amountNum <= 0 || !description.trim()) {
      alert(t('fillCorrectly'))
      return
    }

    if (type === 'expense' && !categoryId) {
      alert(t('selectCategoryForExpense'))
      return
    }

    const transaction = {
      id: Date.now().toString(),
      type,
      amount: amountNum,
      description: description.trim(),
      categoryId: type === 'expense' ? categoryId : null,
      date: new Date().toISOString()
    }

    const updated = [transaction, ...transactions]
    saveTransactions(updated)
    
    setAmount('')
    setDescription('')
  }

  const deleteTransaction = (id) => {
    if (window.confirm(t('delete') + ' ' + t('thisTransaction') + '?')) {
      const updated = transactions.filter(t => t.id !== id)
      saveTransactions(updated)
    }
  }

  // Calculate budget
  const calculateBudget = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Filter transactions for current month
    const monthlyTransactions = transactions.filter(tx => 
      new Date(tx.date) >= startOfMonth
    )

    // Calculate totals
    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    // Calculate per category
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.id] = {
        name: cat.name,
        planned: cat.plannedAmount,
        spent: 0
      }
    })

    monthlyTransactions
      .filter(t => t.type === 'expense' && t.categoryId)
      .forEach(tx => {
        if (categoryMap[tx.categoryId]) {
          categoryMap[tx.categoryId].spent += tx.amount
        }
      })

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryMap
    }
  }

  const { totalIncome, totalExpense, balance, categoryMap } = calculateBudget()
  
  // Get recent transactions
  const recentTransactions = transactions.slice(0, 10)

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading')}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('budget')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('overview')}
          </button>
          <button
            onClick={() => setMode('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('settings')}
          </button>
        </div>
      </div>

      {mode === 'overview' ? (
        <>
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('monthlySummary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('totalIncome')}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('totalExpense')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">${totalExpense.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('balance')}</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Categories with Progress Bars */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('categories')}</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p>{t('noCategories')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => {
                  const data = categoryMap[cat.id] || { name: cat.name, planned: cat.plannedAmount, spent: 0 }
                  const percentage = Math.min((data.spent / data.planned) * 100, 100)
                  const isOver = data.spent > data.planned
                  
                  return (
                    <div key={cat.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{data.name}</span>
                        <span className={`font-bold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          ${data.spent.toFixed(2)} / ${data.planned.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOver ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      {isOver && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {t('overBudget')} ${(data.spent - data.planned).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Transaction Form */}
          <form onSubmit={addTransaction} className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('addTransaction')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value)
                  if (e.target.value === 'income') setCategoryId('')
                }}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="expense">{t('expense')}</option>
                <option value="income">{t('income')}</option>
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('amount')}
                step="0.01"
                min="0.01"
                required
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description')}
                required
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {type === 'expense' && (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required={type === 'expense'}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              type="submit"
              className="mt-3 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
            >
              {t('add')}
            </button>
          </form>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('recentTransactions')}</h3>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-lg mb-2">{t('noTransactions')}</p>
                <p className="text-sm">{t('addFirstTransaction')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentTransactions.map((transaction) => {
                  const category = transaction.categoryId 
                    ? categories.find(c => c.id === transaction.categoryId)
                    : null
                  
                  return (
                    <li
                      key={transaction.id}
                      className={`flex justify-between items-center p-4 rounded-lg shadow-sm border mb-2 ${
                        transaction.type === 'income'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{transaction.description}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(transaction.date).toLocaleString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {category && ` • ${category.name}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold text-lg ${
                            transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Category Settings */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {editingCategory ? t('editCategory') : t('createCategory')}
            </h3>
            <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('categoryName')}
                required
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                value={categoryAmount}
                onChange={(e) => setCategoryAmount(e.target.value)}
                placeholder={t('plannedAmount')}
                step="0.01"
                min="0.01"
                required
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
                >
                  {editingCategory ? t('update') : t('create')}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('existingCategories')}</h3>
            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-lg mb-2">{t('noCategoriesYet')}</p>
                <p className="text-sm">{t('createFirstCategory')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{category.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">${category.plannedAmount.toFixed(2)} per month</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Budget
