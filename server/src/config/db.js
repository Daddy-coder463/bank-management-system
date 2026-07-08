import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bank_db',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  // Managed MySQL hosts (e.g. Aiven) require TLS; set DB_SSL=true there.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
