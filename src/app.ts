import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import eventsRouter from './routes/events.routes';
import configsRouter from './routes/configs.routes';
import auditRouter from './routes/audit.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/events', eventsRouter);
app.use('/api/configs', configsRouter);
app.use('/api/audit', auditRouter);

app.use(errorHandler);

export default app;
