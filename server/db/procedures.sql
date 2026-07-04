-- Stored procedures. Statements are separated by $$ so the setup script
-- can execute each CREATE PROCEDURE as a single statement (BEGIN...END
-- bodies contain semicolons, so they can't go through multi-statement mode).

DROP PROCEDURE IF EXISTS transfer_money
$$
-- ACID-safe transfer between two accounts.
-- Locks both rows with SELECT ... FOR UPDATE in a deterministic order
-- (lower account id first) so two concurrent opposite transfers
-- cannot deadlock.
CREATE PROCEDURE transfer_money(
  IN p_from_account_no VARCHAR(12),
  IN p_to_account_no   VARCHAR(12),
  IN p_amount          DECIMAL(15,2),
  IN p_note            VARCHAR(255)
)
BEGIN
  DECLARE v_from_id INT;
  DECLARE v_to_id INT;
  DECLARE v_from_balance DECIMAL(15,2);
  DECLARE v_to_balance DECIMAL(15,2);
  DECLARE v_from_status VARCHAR(10);
  DECLARE v_to_status VARCHAR(10);
  DECLARE v_ref VARCHAR(36);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_amount <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transfer amount must be positive';
  END IF;
  IF p_from_account_no = p_to_account_no THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot transfer to the same account';
  END IF;

  SELECT id INTO v_from_id FROM accounts WHERE account_no = p_from_account_no;
  SELECT id INTO v_to_id   FROM accounts WHERE account_no = p_to_account_no;

  IF v_from_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Source account not found';
  END IF;
  IF v_to_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Destination account not found';
  END IF;

  SET v_ref = UUID();

  START TRANSACTION;

  -- Deterministic lock order: always lock the lower id first.
  IF v_from_id < v_to_id THEN
    SELECT balance, status INTO v_from_balance, v_from_status FROM accounts WHERE id = v_from_id FOR UPDATE;
    SELECT balance, status INTO v_to_balance,   v_to_status   FROM accounts WHERE id = v_to_id   FOR UPDATE;
  ELSE
    SELECT balance, status INTO v_to_balance,   v_to_status   FROM accounts WHERE id = v_to_id   FOR UPDATE;
    SELECT balance, status INTO v_from_balance, v_from_status FROM accounts WHERE id = v_from_id FOR UPDATE;
  END IF;

  IF v_from_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Source account is not active';
  END IF;
  IF v_to_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Destination account is not active';
  END IF;
  IF v_from_balance < p_amount THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
  END IF;

  UPDATE accounts SET balance = balance - p_amount WHERE id = v_from_id;
  UPDATE accounts SET balance = balance + p_amount WHERE id = v_to_id;

  INSERT INTO transactions (account_id, type, amount, balance_after, reference_id, note)
  VALUES (v_from_id, 'TRANSFER_OUT', p_amount, v_from_balance - p_amount, v_ref, p_note);

  INSERT INTO transactions (account_id, type, amount, balance_after, reference_id, note)
  VALUES (v_to_id, 'TRANSFER_IN', p_amount, v_to_balance + p_amount, v_ref, p_note);

  COMMIT;

  SELECT v_ref AS reference_id;
END
$$
DROP PROCEDURE IF EXISTS process_loan_payment
$$
-- Records an EMI payment and closes the loan once total payments
-- cover principal + total interest (flat-rate model for simplicity).
CREATE PROCEDURE process_loan_payment(
  IN p_loan_id INT,
  IN p_amount  DECIMAL(15,2)
)
BEGIN
  DECLARE v_status VARCHAR(10);
  DECLARE v_total_due DECIMAL(15,2);
  DECLARE v_paid DECIMAL(15,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_amount <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount must be positive';
  END IF;

  START TRANSACTION;

  SELECT status, emi * tenure_months
    INTO v_status, v_total_due
    FROM loans WHERE id = p_loan_id FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loan not found';
  END IF;
  IF v_status <> 'APPROVED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payments are only allowed on approved loans';
  END IF;

  INSERT INTO loan_payments (loan_id, amount) VALUES (p_loan_id, p_amount);

  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM loan_payments WHERE loan_id = p_loan_id;

  IF v_paid >= v_total_due THEN
    UPDATE loans SET status = 'CLOSED' WHERE id = p_loan_id;
  END IF;

  COMMIT;
END
$$
DROP PROCEDURE IF EXISTS apply_monthly_interest
$$
-- Credits monthly interest to every active savings account.
CREATE PROCEDURE apply_monthly_interest(
  IN p_annual_rate DECIMAL(5,2)
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_balance DECIMAL(15,2);
  DECLARE v_interest DECIMAL(15,2);
  DECLARE cur CURSOR FOR
    SELECT id, balance FROM accounts WHERE type = 'SAVINGS' AND status = 'ACTIVE';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_id, v_balance;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET v_interest = ROUND(v_balance * p_annual_rate / 100 / 12, 2);
    IF v_interest > 0 THEN
      UPDATE accounts SET balance = balance + v_interest WHERE id = v_id;
      INSERT INTO transactions (account_id, type, amount, balance_after, note)
      VALUES (v_id, 'DEPOSIT', v_interest, v_balance + v_interest, 'Monthly interest credit');
    END IF;
  END LOOP;
  CLOSE cur;

  COMMIT;
END
$$
