import { pool } from '../config/db.js';

// Standard reducing-balance EMI formula.
export function calculateEmi(principal, annualRate, tenureMonths) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

export async function listLoans(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM loan_outstanding ORDER BY created_at DESC`
    );
    res.json({ loans: rows });
  } catch (err) {
    next(err);
  }
}

export async function applyLoan(req, res, next) {
  try {
    const { customer_id, branch_id, type, principal, interest_rate, tenure_months } = req.body;
    const p = Number(principal);
    const rate = Number(interest_rate);
    const tenure = Number(tenure_months);

    if (!customer_id || !branch_id || !type || !p || !rate || !tenure) {
      return res.status(400).json({ error: 'All loan fields are required' });
    }
    if (p <= 0 || rate <= 0 || tenure <= 0) {
      return res.status(400).json({ error: 'Principal, rate and tenure must be positive' });
    }

    const emi = Math.round(calculateEmi(p, rate, tenure) * 100) / 100;

    const [result] = await pool.query(
      `INSERT INTO loans (customer_id, branch_id, type, principal, interest_rate, tenure_months, emi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, branch_id, type, p, rate, tenure, emi]
    );
    res.status(201).json({ id: result.insertId, emi });
  } catch (err) {
    next(err);
  }
}

export async function payEmi(req, res, next) {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive payment amount is required' });
    }
    // Delegates to the process_loan_payment stored procedure, which
    // records the payment and auto-closes fully repaid loans.
    await pool.query('CALL process_loan_payment(?, ?)', [req.params.id, amount]);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
