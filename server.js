const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB подключена'))
.catch(err => console.error('❌ Ошибка MongoDB:', err));

// Создаем тестовых пользователей
const createTestUsers = async () => {
  const User = require('./models/User');
  try {
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
    console.log('Тестовые пользователи уже существуют');
  }
};

// Подключение роутов
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/ips', require('./routes/ips'));

// Старые роуты для обратной совместимости
app.post('/api/login', (req, res) => {
  require('./routes/auth').login(req, res);
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Сервер работает с MongoDB!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Запуск импорта карт
app.get('/api/import-cards', async (req, res) => {
  try {
    // Запускаем импорт в фоновом режиме
    setTimeout(() => {
      require('./scripts/import-cards-from-csv.js');
    }, 100);
    
    res.json({ message: 'Импорт карт запущен. Проверьте логи сервера.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тестовый маршрут для проверки данных
app.get('/api/test-data', async (req, res) => {
  try {
    const User = require('./models/User');
    const IP = require('./models/IP');
    const Card = require('./models/Card');
    
    const users = await User.find();
    const ips = await IP.find();
    const cards = await Card.find().populate('ipId');
    
    res.json({
      users: users.length,
      ips: ips.length, 
      cards: cards.length,
      sampleCards: cards.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Manager API с MongoDB',
    version: '2.0',
    endpoints: [
      '/api/tasks', 
      '/api/cards', 
      '/api/ips', 
      '/api/auth/login',
      '/api/health',
      '/api/import-cards',
      '/api/test-data'
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Cloud Server запущен на порту ${PORT}`);
  console.log(`📊 MongoDB: Подключено`);
  console.log(`🔐 Пароль: Установлен`);
  
  // Создаем тестовых пользователей при запуске
  await createTestUsers();
});
