-- Triggers, separated by $$ (see procedures.sql note).
-- audit_logs is written ONLY from these triggers.

DROP TRIGGER IF EXISTS trg_accounts_before_update
$$
-- Safety net below the application layer: no UPDATE can ever push a
-- balance negative, even one that bypasses the API.
CREATE TRIGGER trg_accounts_before_update
BEFORE UPDATE ON accounts
FOR EACH ROW
BEGIN
  IF NEW.balance < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Balance cannot go negative';
  END IF;
END
$$
DROP TRIGGER IF EXISTS trg_accounts_after_update
$$
CREATE TRIGGER trg_accounts_after_update
AFTER UPDATE ON accounts
FOR EACH ROW
BEGIN
  IF OLD.balance <> NEW.balance OR OLD.status <> NEW.status THEN
    INSERT INTO audit_logs (table_name, action, record_id, old_value, new_value)
    VALUES (
      'accounts',
      'UPDATE',
      NEW.id,
      JSON_OBJECT('balance', OLD.balance, 'status', OLD.status),
      JSON_OBJECT('balance', NEW.balance, 'status', NEW.status)
    );
  END IF;
END
$$
DROP TRIGGER IF EXISTS trg_loans_after_update
$$
CREATE TRIGGER trg_loans_after_update
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO audit_logs (table_name, action, record_id, old_value, new_value)
    VALUES (
      'loans',
      'UPDATE',
      NEW.id,
      JSON_OBJECT('status', OLD.status),
      JSON_OBJECT('status', NEW.status)
    );
  END IF;
END
$$
DROP TRIGGER IF EXISTS trg_customers_after_delete
$$
CREATE TRIGGER trg_customers_after_delete
AFTER DELETE ON customers
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (table_name, action, record_id, old_value, new_value)
  VALUES (
    'customers',
    'DELETE',
    OLD.id,
    JSON_OBJECT('name', OLD.name, 'email', OLD.email),
    NULL
  );
END
$$
