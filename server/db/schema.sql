-- Bank Management System schema (3NF)
-- Run via: npm run db:setup

CREATE TABLE branches (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  address     VARCHAR(255),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('EMPLOYEE','ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  address     VARCHAR(255),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  account_no  VARCHAR(12)  NOT NULL UNIQUE,
  customer_id INT          NOT NULL,
  branch_id   INT          NOT NULL,
  type        ENUM('SAVINGS','CURRENT','FD') NOT NULL DEFAULT 'SAVINGS',
  balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status      ENUM('ACTIVE','FROZEN','CLOSED') NOT NULL DEFAULT 'ACTIVE',
  opened_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_balance_non_negative CHECK (balance >= 0),
  CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_account_branch   FOREIGN KEY (branch_id)   REFERENCES branches(id)  ON DELETE RESTRICT
);

CREATE TABLE transactions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  account_id    INT           NOT NULL,
  type          ENUM('DEPOSIT','WITHDRAWAL','TRANSFER_IN','TRANSFER_OUT') NOT NULL,
  amount        DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  reference_id  VARCHAR(36),
  note          VARCHAR(255),
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT fk_txn_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  INDEX idx_txn_account_date (account_id, created_at)
);

CREATE TABLE loans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT           NOT NULL,
  branch_id     INT           NOT NULL,
  type          ENUM('PERSONAL','HOME','AUTO','EDUCATION') NOT NULL,
  principal     DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2)  NOT NULL,
  tenure_months INT           NOT NULL,
  emi           DECIMAL(15,2) NOT NULL,
  status        ENUM('PENDING','APPROVED','REJECTED','CLOSED') NOT NULL DEFAULT 'PENDING',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_principal_positive CHECK (principal > 0),
  CONSTRAINT chk_tenure_positive    CHECK (tenure_months > 0),
  CONSTRAINT fk_loan_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_loan_branch   FOREIGN KEY (branch_id)   REFERENCES branches(id)  ON DELETE RESTRICT
);

CREATE TABLE loan_payments (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  loan_id  INT           NOT NULL,
  amount   DECIMAL(15,2) NOT NULL,
  paid_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_payment_positive CHECK (amount > 0),
  CONSTRAINT fk_payment_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT
);

-- Populated only by triggers (see triggers.sql), never by application code.
CREATE TABLE audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  action     VARCHAR(20) NOT NULL,
  record_id  INT         NOT NULL,
  old_value  JSON,
  new_value  JSON,
  changed_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
