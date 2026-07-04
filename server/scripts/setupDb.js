// Drops and recreates the database, then applies schema, procedures,
// triggers and views. Run: npm run db:setup
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', 'db');
const DB_NAME = process.env.DB_NAME || 'bank_db';

const read = (file) => fs.readFileSync(path.join(dbDir, file), 'utf8');

// procedures.sql / triggers.sql use $$ as a statement separator because
// their BEGIN...END bodies contain semicolons.
const splitOnDollar = (sql) =>
  sql
    .split(/^\s*\$\$\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log(`Recreating database ${DB_NAME}...`);
  await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
  await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB_NAME}\``);

  console.log('Applying schema.sql...');
  await conn.query(read('schema.sql'));

  console.log('Applying procedures.sql...');
  for (const stmt of splitOnDollar(read('procedures.sql'))) {
    await conn.query(stmt);
  }

  console.log('Applying triggers.sql...');
  for (const stmt of splitOnDollar(read('triggers.sql'))) {
    await conn.query(stmt);
  }

  console.log('Applying views.sql...');
  await conn.query(read('views.sql'));

  await conn.end();
  console.log('Database setup complete.');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
