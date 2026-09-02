import express from 'express';
import cors from 'cors';
import detectionsRouter from './routes/detections';
import whitelistRouter from './routes/whitelist';
import uploadsRouter from './routes/uploads';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3001' }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/detections', detectionsRouter);
app.use('/api/whitelist', whitelistRouter);
app.use('/api/uploads', uploadsRouter);

app.listen(PORT, () => {
  console.log(`API ready at http://localhost:${PORT}`);
});
