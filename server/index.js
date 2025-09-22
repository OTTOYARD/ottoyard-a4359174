import express from 'express';
import cors from 'cors';
import { scheduleRoutes } from './routes/schedule.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', scheduleRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`OttoCommand API server running on port ${port}`);
});