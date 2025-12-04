import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { db } from '../firebase/config'
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    updateDoc
} from 'firebase/firestore'

function Subscriptions() {
    const { user } = useAuth()
    const { t, language } = useLanguage()
    const [subscriptions, setSubscriptions] = useState([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [isAdding, setIsAdding] = useState(false)
    const [name, setName] = useState('')
    const [cost, setCost] = useState('')
    const [cycle, setCycle] = useState('monthly')
    const [startDate, setStartDate] = useState('')
    const [category, setCategory] = useState('Entertainment')
    const [icon, setIcon] = useState('')

    // Filter state
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('All')
    const [filterStatus, setFilterStatus] = useState('All')
    const [filterBilling, setFilterBilling] = useState('All')

    const categories = ['Entertainment', 'Utilities', 'Work', 'Personal', 'Software', 'Other']

    useEffect(() => {
        if (!user) return

        const q = query(
            collection(db, 'users', user.uid || user.id, 'subscriptions'),
            orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newSubs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setSubscriptions(newSubs)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching subscriptions: ", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    const addSubscription = async (e) => {
        e.preventDefault()

        if (!name.trim() || !cost || !startDate) {
            alert(t('fillAllFields'))
            return
        }

        try {
            await addDoc(collection(db, 'users', user.uid || user.id, 'subscriptions'), {
                name: name.trim(),
                cost: parseFloat(cost),
                cycle,
                startDate,
                category,
                icon: icon.trim(),
                status: 'active',
                createdAt: new Date().toISOString()
            })

            setName('')
            setCost('')
            setStartDate('')
            setIcon('')
            setCategory('Entertainment')
            setIsAdding(false)
        } catch (error) {
            console.error("Error adding subscription: ", error)
            alert('Error adding subscription')
        }
    }

    const deleteSubscription = async (id) => {
        if (window.confirm(t('deleteSubscription'))) {
            try {
                await deleteDoc(doc(db, 'users', user.uid || user.id, 'subscriptions', id))
            } catch (error) {
                console.error("Error deleting subscription: ", error)
                alert('Error deleting subscription')
            }
        }
    }

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            await updateDoc(doc(db, 'users', user.uid || user.id, 'subscriptions', id), {
                status: newStatus
            })
        } catch (error) {
            console.error("Error updating status: ", error)
        }
    }

    const exportToCSV = () => {
        const headers = ['Service', 'Cost', 'Cycle', 'Category', 'Start Date', 'Status']
        const csvContent = [
            headers.join(','),
            ...subscriptions.map(sub => [
                `"${sub.name}"`,
                sub.cost,
                sub.cycle,
                `"${sub.category || ''}"`,
                sub.startDate,
                sub.status
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', 'subscriptions.csv')
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const calculateNextBilling = (start, cycle) => {
        const startDate = new Date(start)
        const today = new Date()
        let nextDate = new Date(startDate)

        while (nextDate <= today) {
            if (cycle === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1)
            } else {
                nextDate.setFullYear(nextDate.getFullYear() + 1)
            }
        }

        return nextDate
    }

    const getDaysUntil = (date) => {
        const today = new Date()
        const diffTime = date - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Filter Logic
    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = filterCategory === 'All' || sub.category === filterCategory
        const matchesStatus = filterStatus === 'All' || sub.status === filterStatus.toLowerCase()
        const matchesBilling = filterBilling === 'All' || sub.cycle === filterBilling.toLowerCase()
        return matchesSearch && matchesCategory && matchesStatus && matchesBilling
    })

    // Calculations
    const monthlySpend = subscriptions.reduce((acc, sub) => {
        if (sub.status !== 'active') return acc
        return acc + (sub.cycle === 'monthly' ? sub.cost : sub.cost / 12)
    }, 0)

    const activeCount = subscriptions.filter(s => s.status === 'active').length

    if (loading) {
        return <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading')}</div>
    }

    return (
        <div className="p-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('subscriptions')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your recurring payments</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    >
                        <span>⬇️</span> {t('export') || 'Export'}
                    </button>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <span>➕</span> {isAdding ? t('cancel') : t('addSubscription')}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('monthlySpend')}</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">${monthlySpend.toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('activeSubscriptions')}</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeCount}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('annualProjection')}</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">${(monthlySpend * 12).toFixed(2)}</div>
                </div>
            </div>

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={addSubscription} className="mb-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('addSubscription')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('serviceName')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cost')}</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category') || 'Category'}</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('billingCycle')}</label>
                            <select
                                value={cycle}
                                onChange={(e) => setCycle(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="monthly">{t('monthly')}</option>
                                <option value="yearly">{t('yearly')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('firstPaymentDate')}</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon URL (optional)</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="https://example.com/icon.png"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
                        >
                            {t('add')}
                        </button>
                    </div>
                </form>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search subscriptions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('service')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('category') || 'Category'}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cost')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nextBilling')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredSubscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {t('noSubscriptions')}
                                    </td>
                                </tr>
                            ) : (
                                filteredSubscriptions.map((sub) => {
                                    const nextDate = calculateNextBilling(sub.startDate, sub.cycle)
                                    const daysUntil = getDaysUntil(nextDate)
                                    const isOverdue = daysUntil < 0

                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {sub.icon ? (
                                                        <img src={sub.icon} alt={sub.name} className="h-10 w-10 rounded-full object-cover bg-gray-100" onError={(e) => { e.target.onerror = null; e.target.src = '' }} />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                            {sub.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{sub.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                    {sub.category || 'Other'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">${sub.cost.toFixed(2)}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t(sub.cycle)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {isOverdue ? 'Overdue' : `in ${daysUntil} days`}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {nextDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleStatus(sub.id, sub.status)}
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition ${sub.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                                                        }`}
                                                >
                                                    {sub.status === 'active' ? t('active') : t('inactive')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => deleteSubscription(sub.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                                    title={t('delete')}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Subscriptions
