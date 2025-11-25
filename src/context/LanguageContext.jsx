import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

const translations = {
  en: {
    // Common
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    welcome: 'Welcome',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    set: 'Set',
    
    // Tasks
    tasks: 'Tasks',
    myTasks: 'My Tasks',
    addTask: 'Add Task',
    enterTask: 'Enter task...',
    noTasks: 'No tasks',
    addFirstTask: 'Add your first task above',
    deleteTask: 'Delete this task?',
    
    // Budget
    budget: 'Budget',
    overview: 'Overview',
    settings: 'Settings',
    monthlySummary: 'Monthly Summary',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    balance: 'Balance',
    categories: 'Categories',
    noCategories: 'No categories yet. Go to Settings to create categories.',
    addTransaction: 'Add Transaction',
    expense: 'Expense',
    income: 'Income',
    amount: 'Amount',
    description: 'Description',
    selectCategory: 'Select category',
    recentTransactions: 'Recent Transactions',
    noTransactions: 'No transactions',
    addFirstTransaction: 'Add your first transaction above',
    createCategory: 'Create New Category',
    editCategory: 'Edit Category',
    categoryName: 'Category name (e.g., Food)',
    plannedAmount: 'Planned amount per month',
    create: 'Create',
    update: 'Update',
    existingCategories: 'Existing Categories',
    noCategoriesYet: 'No categories',
    createFirstCategory: 'Create your first category above',
    deleteCategory: 'Delete this category? All transactions in this category will be uncategorized.',
    overBudget: 'Over budget by',
    scheduled: 'Scheduled',
    
    // Reminders
    reminders: 'Reminders',
    addReminder: 'Add Reminder',
    reminderText: 'Reminder text...',
    upcomingReminders: 'Upcoming Reminders',
    noReminders: 'No upcoming reminders',
    addFirstReminder: 'Add your first reminder above',
    deleteReminder: 'Delete this reminder?',
    reminderNote: 'Note: Reminders will be sent via email when the scheduled time arrives. Make sure your email notifications are enabled in your account settings.',
    
    // Auth
    loginToAccount: 'Login to your account',
    createAccount: 'Create a new account',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    yourName: 'Your name',
    yourEmail: 'your@email.com',
    minimumChars: 'Minimum 6 characters',
    repeatPassword: 'Repeat password',
    loggingIn: 'Logging in...',
    registering: 'Registering...',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    invalidCredentials: 'Invalid email or password',
    userExists: 'User with this email already exists',
    passwordsDontMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    fillAllFields: 'Please fill all fields',
    fillCorrectly: 'Please fill all fields correctly',
    selectFutureDate: 'Please select a future date and time',
    selectCategoryForExpense: 'Please select a category for expenses',
    thisTransaction: 'this transaction',
  },
  ru: {
    // Common
    login: 'Войти',
    register: 'Регистрация',
    logout: 'Выйти',
    welcome: 'Добро пожаловать',
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    set: 'Установить',
    
    // Tasks
    tasks: 'Задачи',
    myTasks: 'Мои Задачи',
    addTask: 'Добавить задачу',
    enterTask: 'Введите задачу...',
    noTasks: 'Нет задач',
    addFirstTask: 'Добавьте свою первую задачу выше',
    deleteTask: 'Удалить эту задачу?',
    
    // Budget
    budget: 'Бюджет',
    overview: 'Обзор',
    settings: 'Настройки',
    monthlySummary: 'Сводка за месяц',
    totalIncome: 'Общий доход',
    totalExpense: 'Общий расход',
    balance: 'Остаток',
    categories: 'Категории',
    noCategories: 'Пока нет категорий. Перейдите в Настройки, чтобы создать категории.',
    addTransaction: 'Добавить транзакцию',
    expense: 'Расход',
    income: 'Доход',
    amount: 'Сумма',
    description: 'Описание',
    selectCategory: 'Выберите категорию',
    recentTransactions: 'Последние операции',
    noTransactions: 'Нет транзакций',
    addFirstTransaction: 'Добавьте свою первую транзакцию выше',
    createCategory: 'Создать новую категорию',
    editCategory: 'Редактировать категорию',
    categoryName: 'Название категории (например, Еда)',
    plannedAmount: 'Планируемая сумма в месяц',
    create: 'Создать',
    update: 'Обновить',
    existingCategories: 'Существующие категории',
    noCategoriesYet: 'Нет категорий',
    createFirstCategory: 'Создайте свою первую категорию выше',
    deleteCategory: 'Удалить эту категорию? Все транзакции в этой категории станут без категории.',
    overBudget: 'Превышение бюджета на',
    scheduled: 'Запланировано',
    
    // Reminders
    reminders: 'Напоминания',
    addReminder: 'Добавить напоминание',
    reminderText: 'Текст напоминания...',
    upcomingReminders: 'Предстоящие напоминания',
    noReminders: 'Нет предстоящих напоминаний',
    addFirstReminder: 'Добавьте свое первое напоминание выше',
    deleteReminder: 'Удалить это напоминание?',
    reminderNote: 'Примечание: Напоминания будут отправлены по электронной почте, когда наступит запланированное время. Убедитесь, что уведомления по электронной почте включены в настройках вашего аккаунта.',
    
    // Auth
    loginToAccount: 'Войдите в свой аккаунт',
    createAccount: 'Создайте новый аккаунт',
    email: 'Email',
    password: 'Пароль',
    name: 'Имя',
    confirmPassword: 'Подтвердите пароль',
    yourName: 'Ваше имя',
    yourEmail: 'your@email.com',
    minimumChars: 'Минимум 6 символов',
    repeatPassword: 'Повторите пароль',
    loggingIn: 'Вход...',
    registering: 'Регистрация...',
    dontHaveAccount: 'Нет аккаунта?',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    invalidCredentials: 'Неверный email или пароль',
    userExists: 'Пользователь с таким email уже существует',
    passwordsDontMatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен содержать минимум 6 символов',
    fillAllFields: 'Заполните все поля',
    fillCorrectly: 'Заполните все поля корректно',
    selectFutureDate: 'Выберите будущую дату и время',
    selectCategoryForExpense: 'Пожалуйста, выберите категорию для расходов',
    thisTransaction: 'эту транзакцию',
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('language')
    if (saved && (saved === 'en' || saved === 'ru')) {
      setLanguage(saved)
    }
  }, [])

  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'ru') {
      setLanguage(lang)
      localStorage.setItem('language', lang)
    }
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    changeLanguage,
    t
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

