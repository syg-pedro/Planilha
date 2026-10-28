CREATE TABLE accounts (
    id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL CHECK (household_id = 'local-demo'),
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    owner VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'credit_card', 'benefit', 'external')),
    limit_total NUMERIC(14,2) CHECK (limit_total >= 0),
    closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (type = 'credit_card' OR (limit_total IS NULL AND closing_day IS NULL AND due_day IS NULL))
);
