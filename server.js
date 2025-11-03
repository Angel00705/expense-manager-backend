const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Настройка базы данных для облака
const dbPath = process.env.DATABASE_URL || './database.db';
const db = new sqlite3.Database(dbPath);

// Создаем таблицы
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT,
    region TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    planned_amount INTEGER,
    actual_amount INTEGER,
    transaction_date TEXT,
    status TEXT DEFAULT 'planned',
    category TEXT,
    responsible TEXT,
    week TEXT,
    ip_name TEXT,
    region TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Добавляем тестовых пользователей
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, region) 
          VALUES ('admin@test.ru', '123456', 'Администратор', 'accountant', 'all')`);
  
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, region) 
          VALUES ('manager@test.ru', '123456', 'Ксения Б.', 'manager', 'Курган')`);

  // Добавляем тестовые задачи
  db.run(`INSERT OR IGNORE INTO tasks (title, planned_amount, category, responsible, week, ip_name, region) 
          VALUES ('Покупка продуктов (кофе, чай, сахар)', 1500, 'Продукты', 'Ксения Б.', '2025-11-03_2025-11-09', 'ИП Бондаренко', 'Курган')`);
  
  db.run(`INSERT OR IGNORE INTO tasks (title, planned_amount, category, responsible, week, ip_name, region) 
          VALUES ('Заправка автомобиля', 1000, 'АЗС', 'Ксения Б.', '2025-11-03_2025-11-09', 'ИП Бобков', 'Курган')`);
  
  db.run(`INSERT OR IGNORE INTO tasks (title, planned_amount, category, responsible, week, ip_name, region) 
          VALUES ('Моющие средства', 2500, 'Хоз. товары', 'Полина М.', '2025-11-03_2025-11-09', 'ИП Федчук', 'Курган')`);
});

// Маршруты API

// Авторизация
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Неверные данные' });
    }
  });
});

// Получить все задачи (для администратора)
app.get('/api/tasks', (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Получить задачи по ответственному
app.get('/api/tasks/responsible/:responsible', (req, res) => {
  const responsible = req.params.responsible;
  db.all("SELECT * FROM tasks WHERE responsible = ? ORDER BY created_at DESC", [responsible], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Получить задачи по региону
app.get('/api/tasks/region/:region', (req, res) => {
  const region = req.params.region;
  db.all("SELECT * FROM tasks WHERE region = ? ORDER BY created_at DESC", [region], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Обновить задачу
app.put('/api/tasks/:id', (req, res) => {
  const { actual_amount, transaction_date, status } = req.body;
  db.run(
    "UPDATE tasks SET actual_amount = ?, transaction_date = ?, status = ? WHERE id = ?",
    [actual_amount, transaction_date, status, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Создать новую задачу
app.post('/api/tasks', (req, res) => {
  const { title, planned_amount, category, responsible, week, ip_name, region } = req.body;
  
  db.run(
    "INSERT INTO tasks (title, planned_amount, category, responsible, week, ip_name, region) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [title, planned_amount, category, responsible, week, ip_name, region],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// Аналитика - сводка
app.get('/api/analytics/summary', (req, res) => {
  db.all(`
    SELECT 
      SUM(planned_amount) as total_plan,
      SUM(actual_amount) as total_fact,
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
    FROM tasks
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows[0]);
    }
  });
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Сервер работает в облаке!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Manager API',
    version: '1.0',
    endpoints: ['/api/tasks', '/api/login', '/api/analytics/summary']
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Cloud Server запущен на порту ${PORT}`);
  console.log(`📊 API доступно`);
  console.log(`🔒 SSL: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Development'}`);
});