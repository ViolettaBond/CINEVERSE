import express from 'express';
import cors from 'cors';
import { pool } from './database/pool.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Приложение вынесено отдельно от запуска сервера, чтобы его можно было тестировать (Supertest)
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
