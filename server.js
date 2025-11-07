// Минимальный рабочий сервер для теста
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Базовая middleware
app.use(express.json());

// Простой health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Минимальный сервер работает!',
    timestamp: new Date().toISOString()
  });
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Manager API - Минимальная версия',
    version: '1.0-minimal',
    endpoints: ['/api/health']
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
