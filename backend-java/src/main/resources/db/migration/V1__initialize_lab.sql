CREATE TABLE lab_metadata (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(100) NOT NULL
);

INSERT INTO lab_metadata (key, value) VALUES ('environment', 'local-demo');
