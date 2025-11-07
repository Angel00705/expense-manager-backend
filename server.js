const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB с обработкой ошибок
const connectDB = async () => {
  try {
    console.log('🔄 Подключаемся к MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 секунд таймаут
    });
    
    console.log('✅ MongoDB подключена!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.log('💡 Проверь:');
    console.log('   - IP адрес в белом списке MongoDB Atlas');
    console.log('   - Правильность MONGODB_URI в .env');
    console.log('   - Пароль пользователя базы данных');
    return false;
  }
};

// Создаем тестовых пользователей
const createTestUsers = async () => {
  try {
    const User = require('./models/User');
    
    // Очищаем старых пользователей
    await User.deleteMany({});
    
    const testUsers = [
      { email: 'admin@test.ru', password: '123456', name: 'Администратор', role: 'accountant', region: 'all' },
      { email: 'astrakhan@test.ru', password: '123456', name: 'Управляющий (Астрахань)', role: 'manager', region: 'Астрахань' },
      { email: 'buryatia@test.ru', password: '123456', name: 'Управляющий (Бурятия)', role: 'manager', region: 'Бурятия (УЛАН-УДЭ)' },
      { email: 'kurgan@test.ru', password: '123456', name: 'Управляющий (Курган)', role: 'manager', region: 'Курган' },
      { email: 'kalmykia@test.ru', password: '123456', name: 'Управляющий (Калмыкия)', role: 'manager', region: 'Калмыкия (ЭЛИСТА)' },
      { email: 'mordovia@test.ru', password: '123456', name: 'Управляющий (Мордовия)', role: 'manager', region: 'Мордовия (САРАНСК)' },
      { email: 'udmurtia@test.ru', password: '123456', name: 'Управляющий (Удмуртия)', role: 'manager', region: 'Удмуртия (ИЖЕВСК)' }
    ];

    await User.insertMany(testUsers);
    console.log('✅ Тестовые пользователи созданы');
  } catch (error) {
    console.log('⚠️ Ошибка создания пользователей:', error.message);
  }
};

// Инициализация базы данных
const initializeDB = async () => {
  const isConnected = await connectDB();
  
  if (isConnected) {
    await createTestUsers();
  }
  
  return isConnected;
};

// Простые маршруты, которые работают даже без MongoDB
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Сервер работает!',
    database: 'Проверяем подключение...',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Тестовый endpoint работает!',
    data: ['test1', 'test2', 'test3']
  });
});

// Основные маршруты (только если MongoDB подключена)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/ips', require('./routes/ips'));

// Запуск импорта карт
app.get('/api/import-cards', async (req, res) => {
  try {
    res.json({ message: 'Импорт карт будет запущен при следующем деплое' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Manager API',
    version: '2.0',
    endpoints: [
      '/api/health',
      '/api/test', 
      '/api/tasks', 
      '/api/cards', 
      '/api/ips', 
      '/api/auth/login'
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Cloud Server запущен на порту ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  
  // Инициализируем базу данных
  await initializeDB();
});
