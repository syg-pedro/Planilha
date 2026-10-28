CREATE TABLE categories (
    id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL CHECK (household_id = 'local-demo'),
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('income', 'expense')),
    color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);

CREATE TABLE entries (
    id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL CHECK (household_id = 'local-demo'),
    rule_id VARCHAR(64),
    account_id VARCHAR(64) REFERENCES accounts(id) ON DELETE SET NULL,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('income', 'expense')),
    due_date DATE NOT NULL,
    competence_date DATE NOT NULL,
    installment_index INTEGER,
    installment_total INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'review')),
    origin VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (origin IN ('auto', 'manual', 'imported')),
    exclude_from_calc BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CHECK (
        (installment_index IS NULL AND installment_total IS NULL)
        OR (installment_index IS NOT NULL AND installment_total IS NOT NULL
            AND installment_index >= 1 AND installment_total >= 1 AND installment_index <= installment_total)
    )
);

CREATE INDEX idx_entries_household_due ON entries(household_id, due_date, id);
CREATE INDEX idx_entries_account ON entries(account_id);
CREATE INDEX idx_entries_category ON entries(category_id);
