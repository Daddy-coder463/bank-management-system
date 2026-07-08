import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import customerRoutes from './routes/customers.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import loanRoutes from './routes/loans.js';
import adminRoutes from './routes/admin.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/accounts', requireAuth, accountRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/loans', requireAuth, loanRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

// In production the API also serves the built React app (client/dist),
// so the whole project deploys as a single web service.
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Central error handler: SQL SIGNAL messages (45000) and constraint
// violations become readable API errors instead of 500s.
app.use((err, req, res, next) => {
  if (err.sqlState === '45000') {
    return res.status(400).json({ error: err.sqlMessage || err.message });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Cannot delete: other records reference this one' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
