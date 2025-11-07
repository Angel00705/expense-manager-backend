const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Подключаемся к MongoDB...');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI не найден в переменных окружения');
      return false;
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB успешно подключена!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    return false;
  }
};

// Инициализация базы данных
let dbConnected = false;

const initializeDB = async () => {
  dbConnected = await connectDB();
  
  if (dbConnected) {
    try {
      // Создаем тестовых пользователей
      const User = require('./models/User');
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

      // Автоматически импортируем карты при запуске
      console.log('🔄 Запускаем автоматический импорт карт...');
      const importCards = require('./scripts/import-cards-from-csv.js');
      await importCards();
      
    } catch (error) {
      console.log('⚠️ Ошибка инициализации базы данных:', error.message);
    }
  }
};

// Маршруты
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Сервер работает!',
    database: dbConnected ? '✅ MongoDB подключена' : '❌ MongoDB не подключена',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Тестовый endpoint работает!',
    database: dbConnected ? 'подключена' : 'не подключена'
  });
});

// Проверка данных
app.get('/api/check-data', async (req, res) => {
  if (!dbConnected) {
    return res.json({ 
      database: 'не подключена', 
      message: 'Сначала подключи MongoDB'
    });
  }
  
  try {
    const User = require('./models/User');
    const Card = require('./models/Card');
    const IP = require('./models/IP');
    
    const users = await User.find();
    const cards = await Card.find().populate('ipId');
    const ips = await IP.find();
    
    res.json({
      database: 'подключена',
      users: users.length,
      cards: cards.length,
      ips: ips.length,
      sampleCards: cards.slice(0, 2).map(card => ({
        ip: card.ipId?.name,
        card: card.numberMask,
        type: card.type
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Основные маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/ips', require('./routes/ips'));

// Запуск импорта карт вручную
app.get('/api/import-cards', async (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({ error: 'MongoDB не подключена' });
  }
  
  try {
    const importCards = require('./scripts/import-cards-from-csv.js');
    await importCards();
    res.json({ message: 'Импорт карт завершен!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все карты
app.get('/api/cards', async (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({ error: 'MongoDB не подключена' });
  }
  
  try {
    const Card = require('./models/Card');
    const cards = await Card.find().populate('ipId');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Manager API',
    version: '2.0',
    database: dbConnected ? '✅ MongoDB подключена' : '❌ MongoDB не подключена',
    endpoints: [
      '/api/health',
      '/api/test',
      '/api/check-data',
      '/api/import-cards',
      '/api/cards',
      '/api/ips',
      '/api/tasks',
      '/api/auth/login'
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Cloud Server запущен на порту ${PORT}`);
  
  // Инициализируем базу данных
  await initializeDB();
});
