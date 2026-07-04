// Seeds sample data (seed.sql) plus staff users with bcrypt-hashed
// passwords. Run after db:setup: npm run db:seed
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bank_db',
    multipleStatements: true,
  });

  console.log('Seeding sample data...');
  const seedSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
  await conn.query(seedSql);

  console.log('Seeding staff users...');
  const users = [
    { name: 'Admin User', email: 'admin@bank.com', password: 'admin123', role: 'ADMIN' },
    { name: 'Teller User', email: 'teller@bank.com', password: 'teller123', role: 'EMPLOYEE' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await conn.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [u.name, u.email, hash, u.role]
    );
  }

  await conn.end();
  console.log('Seed complete. Logins: admin@bank.com/admin123, teller@bank.com/teller123');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
