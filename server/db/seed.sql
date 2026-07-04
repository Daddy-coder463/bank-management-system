-- Sample data. Users (with bcrypt hashes) are seeded by scripts/seedDb.js.

INSERT INTO branches (code, name, address) VALUES
  ('BR001', 'MG Road Branch', '12 MG Road, Bengaluru'),
  ('BR002', 'Andheri Branch', '45 Link Road, Mumbai'),
  ('BR003', 'Connaught Place Branch', '8 CP Block A, New Delhi');

INSERT INTO customers (name, email, phone, address) VALUES
  ('Aarav Sharma',  'aarav.sharma@example.com',  '9876543210', 'Bengaluru'),
  ('Diya Patel',    'diya.patel@example.com',    '9876543211', 'Mumbai'),
  ('Rohan Mehta',   'rohan.mehta@example.com',   '9876543212', 'New Delhi'),
  ('Ananya Iyer',   'ananya.iyer@example.com',   '9876543213', 'Bengaluru'),
  ('Kabir Singh',   'kabir.singh@example.com',   '9876543214', 'Mumbai');

INSERT INTO accounts (account_no, customer_id, branch_id, type, balance) VALUES
  ('100000000001', 1, 1, 'SAVINGS', 55000.00),
  ('100000000002', 2, 2, 'CURRENT', 120000.00),
  ('100000000003', 3, 3, 'SAVINGS', 32000.00),
  ('100000000004', 4, 1, 'SAVINGS', 78000.00),
  ('100000000005', 5, 2, 'FD',      200000.00),
  ('100000000006', 1, 1, 'CURRENT', 15000.00);

INSERT INTO transactions (account_id, type, amount, balance_after, note) VALUES
  (1, 'DEPOSIT',    50000.00, 50000.00, 'Initial deposit'),
  (1, 'DEPOSIT',     5000.00, 55000.00, 'Salary credit'),
  (2, 'DEPOSIT',   120000.00, 120000.00, 'Initial deposit'),
  (3, 'DEPOSIT',    40000.00, 40000.00, 'Initial deposit'),
  (3, 'WITHDRAWAL',  8000.00, 32000.00, 'ATM withdrawal'),
  (4, 'DEPOSIT',    78000.00, 78000.00, 'Initial deposit'),
  (5, 'DEPOSIT',   200000.00, 200000.00, 'FD opening'),
  (6, 'DEPOSIT',    15000.00, 15000.00, 'Initial deposit');

INSERT INTO loans (customer_id, branch_id, type, principal, interest_rate, tenure_months, emi, status) VALUES
  (2, 2, 'HOME',      2500000.00, 8.50, 240, 21696.00, 'APPROVED'),
  (3, 3, 'PERSONAL',   200000.00, 12.00, 36,  6643.00, 'PENDING'),
  (4, 1, 'AUTO',       600000.00, 9.25, 60,  12531.00, 'APPROVED'),
  (5, 2, 'EDUCATION',  400000.00, 10.50, 84,  6746.00, 'PENDING');

INSERT INTO loan_payments (loan_id, amount) VALUES
  (1, 21696.00),
  (1, 21696.00),
  (3, 12531.00);
