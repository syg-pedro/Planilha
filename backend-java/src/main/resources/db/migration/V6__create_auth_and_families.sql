CREATE TABLE auth_users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE households (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

INSERT INTO households (id, name, created_at)
SELECT id, 'Família de demonstração', CURRENT_TIMESTAMP FROM household_settings;

CREATE TABLE household_members (
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    household_id VARCHAR(64) NOT NULL REFERENCES households(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, household_id)
);

CREATE INDEX idx_members_household ON household_members(household_id);

CREATE TABLE auth_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    household_id VARCHAR(64) NOT NULL REFERENCES households(id),
    refresh_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE household_invitations (
    id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL REFERENCES households(id),
    email VARCHAR(254) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member')),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_invitations_household ON household_invitations(household_id);

ALTER TABLE household_settings DROP CONSTRAINT household_settings_id_check;
ALTER TABLE accounts DROP CONSTRAINT accounts_household_id_check;
ALTER TABLE categories DROP CONSTRAINT categories_household_id_check;
ALTER TABLE rules DROP CONSTRAINT rules_household_id_check;
ALTER TABLE entries DROP CONSTRAINT entries_household_id_check;
ALTER TABLE wish_items DROP CONSTRAINT wish_items_household_id_check;

ALTER TABLE household_settings ADD CONSTRAINT settings_household_fkey FOREIGN KEY (id) REFERENCES households(id);
ALTER TABLE accounts ADD CONSTRAINT accounts_household_fkey FOREIGN KEY (household_id) REFERENCES households(id);
ALTER TABLE categories ADD CONSTRAINT categories_household_fkey FOREIGN KEY (household_id) REFERENCES households(id);
ALTER TABLE rules ADD CONSTRAINT rules_household_fkey FOREIGN KEY (household_id) REFERENCES households(id);
ALTER TABLE entries ADD CONSTRAINT entries_household_fkey FOREIGN KEY (household_id) REFERENCES households(id);
ALTER TABLE wish_items ADD CONSTRAINT wishes_household_fkey FOREIGN KEY (household_id) REFERENCES households(id);

ALTER TABLE accounts ADD CONSTRAINT accounts_household_id_unique UNIQUE (household_id, id);
ALTER TABLE categories ADD CONSTRAINT categories_household_id_unique UNIQUE (household_id, id);
ALTER TABLE rules ADD CONSTRAINT rules_household_id_unique UNIQUE (household_id, id);

ALTER TABLE rules DROP CONSTRAINT rules_account_id_fkey;
ALTER TABLE rules DROP CONSTRAINT rules_category_id_fkey;
ALTER TABLE entries DROP CONSTRAINT entries_account_id_fkey;
ALTER TABLE entries DROP CONSTRAINT entries_category_id_fkey;
ALTER TABLE entries DROP CONSTRAINT entries_rule_id_fkey;

ALTER TABLE rules ADD CONSTRAINT rules_account_family_fkey FOREIGN KEY (household_id, account_id)
    REFERENCES accounts(household_id, id) ON DELETE SET NULL (account_id);
ALTER TABLE rules ADD CONSTRAINT rules_category_family_fkey FOREIGN KEY (household_id, category_id)
    REFERENCES categories(household_id, id) ON DELETE SET NULL (category_id);
ALTER TABLE entries ADD CONSTRAINT entries_account_family_fkey FOREIGN KEY (household_id, account_id)
    REFERENCES accounts(household_id, id) ON DELETE SET NULL (account_id);
ALTER TABLE entries ADD CONSTRAINT entries_category_family_fkey FOREIGN KEY (household_id, category_id)
    REFERENCES categories(household_id, id) ON DELETE SET NULL (category_id);
ALTER TABLE entries ADD CONSTRAINT entries_rule_family_fkey FOREIGN KEY (household_id, rule_id)
    REFERENCES rules(household_id, id) ON DELETE SET NULL (rule_id);
