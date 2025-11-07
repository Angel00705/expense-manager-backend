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
    console.log('🔄 Пытаемся подключиться к MongoDB...');
    
    // Используем строку подключения напрямую для теста
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://expense-manager-user:TGEmCBTN3xl3ZtMu@cluster0.ovhridw.mongodb.net/expense-manager?retryWrites=true&w=majority';
    
    console.log('📡 URI:', MONGODB_URI ? 'есть' : 'отсутствует');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB успешно подключена!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.log('💡 Проверь:');
    console.log('   1. IP адрес в белом списке MongoDB Atlas');
    console.log('   2. Правильность пароля в строке подключения');
    console.log('   3. Название базы данных в URI');
    return false;
  }
};

// Инициализация базы данных
let dbConnected = false;

const initializeDB = async () => {
  dbConnected = await connectDB();
  
  if (dbConnected) {
    try {
      // Динамически импортируем модели только если база подключена
      const User = require('./models/User');
      await User.deleteMany({});
      
      const testUsers = [
        { email: 'admin@test.ru', password: '123456', name: 'Администратор', role: 'accountant', region: 'all' },
        { email: 'astrakhan@test.ru', password: '123456', name: 'Управляющий (Астрахань)', role: 'manager', region: 'Астрахань' },
        { email: 'buryatia@test.ru', password: '123456', name: 'Управляющий (Бурятия)', role: 'manager', region: 'Бурятия (УЛАН-УДЭ)' },
        { email: 'kurgan@test.ru', password: '123456', name: 'Управляющий (Курган)', role: 'manager', region: 'Курган' },
      ];

      await User.insertMany(testUsers);
      console.log('✅ Тестовые пользователи созданы');
    } catch (error) {
      console.log('⚠️ Ошибка создания пользователей:', error.message);
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
    database: dbConnected ? 'подключена' : 'не подключена',
    data: ['test1', 'test2', 'test3']
  });
});

// Основные маршруты (только если MongoDB подключена)
if (dbConnected) {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/cards', require('./routes/cards'));
  app.use('/api/ips', require('./routes/ips'));
} else {
  // Заглушки для маршрутов если база не подключена
  app.use('/api/auth', require('./routes/auth'));
  app.post('/api/login', (req, res) => {
    res.json({ 
      success: true, 
      user: {
        id: 1,
        email: 'admin@test.ru',
        name: 'Администратор (тестовый режим)',
        role: 'accountant',
        region: 'all'
      }
    });
  });
}

// Запуск импорта карт
app.get('/api/import-cards', async (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({ error: 'MongoDB не подключена' });
  }
  
  try {
    require('./scripts/import-cards-from-csv.js');
    res.json({ message: 'Импорт карт запущен' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверка данных
app.get('/api/check-data', async (req, res) => {
  if (!dbConnected) {
    return res.json({ 
      database: 'не подключена', 
      users: 0, 
      cards: 0,
      message: 'Сначала подключи MongoDB'
    });
  }
  
  try {
    const User = require('./models/User');
    const Card = require('./models/Card');
    const IP = require('./models/IP');
    
    const users = await User.find();
    const cards = await Card.find();
    const ips = await IP.find();
    
    res.json({
      database: 'подключена',
      users: users.length,
      cards: cards.length,
      ips: ips.length
    });
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
      '/api/login'
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Cloud Server запущен на порту ${PORT}`);
  
  // Инициализируем базу данных
  await initializeDB();
});
