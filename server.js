const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Переменная для отслеживания состояния базы
let dbConnected = false;
let dbConnectionInProgress = false;

// Подключение к MongoDB
const connectDB = async () => {
  if (dbConnected) return true;
  if (dbConnectionInProgress) {
    console.log('🔄 Подключение к базе уже в процессе...');
    return false;
  }

  try {
    dbConnectionInProgress = true;
    console.log('🔄 Подключаемся к MongoDB...');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI не найден в переменных окружения');
      dbConnectionInProgress = false;
      return false;
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB успешно подключена!');
    dbConnected = true;
    dbConnectionInProgress = false;
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    dbConnectionInProgress = false;
    return false;
  }
};

// Middleware для проверки подключения к базе
const checkDBConnection = async (req, res, next) => {
  if (!dbConnected) {
    const connected = await connectDB();
    if (!connected) {
      return res.status(503).json({ 
        error: 'База данных не подключена. Попробуйте позже.' 
      });
    }
  }
  next();
};

// Инициализация базы данных
const initializeDB = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Не удалось подключиться к базе при инициализации');
      return;
    }

    // Создаем тестовых пользователей
    const User = require('./models/User');
    
    // Очищаем только если нужно
    const userCount = await User.countDocuments();
    if (userCount === 0) {
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
    } else {
      console.log('✅ Пользователи уже существуют в базе');
    }

    // Автоматически импортируем карты при запуске
    console.log('🔄 Запускаем автоматический импорт карт...');
    const importCards = require('./scripts/import-cards-from-csv.js');
    await importCards();
    
  } catch (error) {
    console.log('⚠️ Ошибка инициализации базы данных:', error.message);
  }
};

// Маршруты которые не требуют базы данных
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

// Маршруты которые требуют подключения к базе - добавляем middleware
app.get('/api/check-data', checkDBConnection, async (req, res) => {
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

// Основные маршруты с проверкой подключения
app.use('/api/auth', checkDBConnection, require('./routes/auth'));
app.use('/api/tasks', checkDBConnection, require('./routes/tasks'));
app.use('/api/cards', checkDBConnection, require('./routes/cards'));
app.use('/api/ips', checkDBConnection, require('./routes/ips'));

// Запуск импорта карт вручную
app.get('/api/import-cards', checkDBConnection, async (req, res) => {
  try {
    const importCards = require('./scripts/import-csv-to-mongodb.js');
    await importCards();
    res.json({ message: 'Импорт карт завершен!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все карты
app.get('/api/cards', checkDBConnection, async (req, res) => {
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Cloud Server запущен на порту ${PORT}`);
  
  // Инициализируем базу данных асинхронно (не блокируем запуск сервера)
  setTimeout(() => {
    initializeDB();
  }, 1000);
});

// Обработка graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Завершение работы...');
  if (dbConnected) {
    await mongoose.connection.close();
  }
  process.exit(0);
});
