CREATE TABLE rules (
    id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL CHECK (household_id = 'local-demo'),
    title VARCHAR(100) NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL,
    account_id VARCHAR(64) REFERENCES accounts(id) ON DELETE SET NULL,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('income', 'expense')),
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'manual')),
    starts_at DATE NOT NULL,
    ends_at DATE,
    auto_generate BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

ALTER TABLE entries ADD CONSTRAINT entries_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_entries_rule_auto_due ON entries(household_id, rule_id, due_date)
    WHERE origin = 'auto' AND rule_id IS NOT NULL;
CREATE INDEX idx_rules_account ON rules(account_id);
CREATE INDEX idx_rules_category ON rules(category_id);
