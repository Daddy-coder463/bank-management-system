// Concurrency proof: fires 10 simultaneous 1000.00 transfers out of the
// same account that only holds 5000.00. With row locking inside the
// transfer_money procedure, exactly 5 succeed and 5 fail with
// "Insufficient balance" — the balance never goes negative and no
// update is lost. Run: npm run test:concurrency
import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bank_db',
  decimalNumbers: true,
};

async function main() {
  const setup = await mysql.createConnection(config);

  // Fresh pair of test accounts, source funded with exactly 5000.
  await setup.query(`DELETE FROM transactions WHERE account_id IN
    (SELECT id FROM (SELECT id FROM accounts WHERE account_no IN ('999000000001','999000000002')) x)`);
  await setup.query(`DELETE FROM accounts WHERE account_no IN ('999000000001','999000000002')`);
  await setup.query(`INSERT INTO accounts (account_no, customer_id, branch_id, type, balance)
    VALUES ('999000000001', 1, 1, 'SAVINGS', 5000.00), ('999000000002', 2, 1, 'SAVINGS', 0.00)`);

  console.log('Source account funded with 5000.00');
  console.log('Firing 10 concurrent transfers of 1000.00 each...\n');

  const attempts = Array.from({ length: 10 }, async (_, i) => {
    const conn = await mysql.createConnection(config);
    try {
      await conn.query(`CALL transfer_money('999000000001', '999000000002', 1000.00, 'concurrency test #${i + 1}')`);
      return 'ok';
    } catch (err) {
      return err.sqlMessage || err.message;
    } finally {
      await conn.end();
    }
  });

  const results = await Promise.all(attempts);
  const succeeded = results.filter((r) => r === 'ok').length;
  const failed = results.length - succeeded;

  const [[src]] = await setup.query(`SELECT balance FROM accounts WHERE account_no = '999000000001'`);
  const [[dst]] = await setup.query(`SELECT balance FROM accounts WHERE account_no = '999000000002'`);

  console.log(`Succeeded: ${succeeded}, Failed: ${failed}`);
  console.log(`Failure reasons: ${[...new Set(results.filter((r) => r !== 'ok'))].join(', ')}`);
  console.log(`Source balance:      ${src.balance.toFixed(2)} (expected 0.00)`);
  console.log(`Destination balance: ${dst.balance.toFixed(2)} (expected 5000.00)`);

  const pass = succeeded === 5 && src.balance === 0 && dst.balance === 5000;
  console.log(pass ? '\nPASS: no lost updates, no negative balance.' : '\nFAIL: money was lost or created!');

  await setup.end();
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
