import express from 'express';
import bodyParser from 'body-parser';
import expenseRoutes from './routes/expense.route';
import connectDB from './config/db.config';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/load', (_req, res) => {
  const end = Date.now() + 250;

  while (Date.now() < end) {
    Math.sqrt(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  res.status(200).json({ status: 'loaded' });
});

app.use('/api', expenseRoutes);

connectDB();

export default app;
