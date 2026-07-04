-- Views used by the reporting endpoints.

CREATE OR REPLACE VIEW account_statements AS
SELECT
  t.id,
  t.created_at,
  a.account_no,
  c.name AS customer_name,
  b.name AS branch_name,
  t.type,
  t.amount,
  t.balance_after,
  t.reference_id,
  t.note
FROM transactions t
JOIN accounts  a ON a.id = t.account_id
JOIN customers c ON c.id = a.customer_id
JOIN branches  b ON b.id = a.branch_id;

CREATE OR REPLACE VIEW branch_summary AS
SELECT
  b.id,
  b.code,
  b.name,
  COUNT(DISTINCT a.id)                                        AS total_accounts,
  COUNT(DISTINCT a.customer_id)                               AS total_customers,
  COALESCE(SUM(CASE WHEN a.status = 'ACTIVE' THEN a.balance END), 0) AS total_deposits,
  (SELECT COUNT(*) FROM loans l WHERE l.branch_id = b.id AND l.status = 'APPROVED') AS active_loans
FROM branches b
LEFT JOIN accounts a ON a.branch_id = b.id
GROUP BY b.id, b.code, b.name;

CREATE OR REPLACE VIEW loan_outstanding AS
SELECT
  l.id,
  l.customer_id,
  c.name AS customer_name,
  l.type,
  l.principal,
  l.interest_rate,
  l.tenure_months,
  l.emi,
  l.status,
  l.created_at,
  ROUND(l.emi * l.tenure_months, 2)                          AS total_payable,
  COALESCE(p.total_paid, 0)                                  AS total_paid,
  GREATEST(ROUND(l.emi * l.tenure_months, 2) - COALESCE(p.total_paid, 0), 0) AS outstanding
FROM loans l
JOIN customers c ON c.id = l.customer_id
LEFT JOIN (
  SELECT loan_id, SUM(amount) AS total_paid
  FROM loan_payments
  GROUP BY loan_id
) p ON p.loan_id = l.id;
