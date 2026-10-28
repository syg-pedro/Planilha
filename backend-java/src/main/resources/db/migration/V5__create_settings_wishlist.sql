CREATE TABLE household_settings (
    id VARCHAR(64) PRIMARY KEY CHECK (id = 'local-demo'),
    currency VARCHAR(3) NOT NULL CHECK (currency = 'BRL'),
    timezone VARCHAR(60) NOT NULL,
    theme_mode VARCHAR(20) NOT NULL CHECK (theme_mode IN ('light', 'dark', 'custom', 'system')),
    density_mode VARCHAR(20) NOT NULL CHECK (density_mode IN ('compact', 'comfortable')),
    period_mode VARCHAR(20) NOT NULL CHECK (period_mode IN ('due_date', 'competence')),
    horizon_months INTEGER NOT NULL CHECK (horizon_months BETWEEN 1 AND 120),
    notification_days JSONB NOT NULL CHECK (jsonb_typeof(notification_days) = 'array'),
    notification_time VARCHAR(5) NOT NULL CHECK (notification_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    color_tokens JSONB NOT NULL CHECK (jsonb_typeof(color_tokens) = 'object'),
    dashboard_config JSONB NOT NULL CHECK (jsonb_typeof(dashboard_config) = 'object'),
    onboarding_state JSONB NOT NULL CHECK (jsonb_typeof(onboarding_state) = 'object'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

INSERT INTO household_settings (id, currency, timezone, theme_mode, density_mode, period_mode, horizon_months,
    notification_days, notification_time, color_tokens, dashboard_config, onboarding_state, updated_at)
VALUES ('local-demo', 'BRL', 'America/Sao_Paulo', 'system', 'compact', 'due_date', 18,
    '[3,1]'::jsonb, '09:00',
    '{"primary":"#00C16A","accent":"#3b82f6","positive":"#00C16A","negative":"#ef4444","neutral":"#64748b","background":"#ffffff","card":"#ffffff"}'::jsonb,
    '{"visibleWidgets":["kpis","cashflow","projection","category","cards","limits","heatmap","upcoming"],"sortMode":"date_asc","defaultRange":"month","uiTheme":{"version":1,"preset":"default"}}'::jsonb,
    jsonb_build_object('version', 1, 'status', 'new', 'completedSteps', '[]'::jsonb, 'updatedAt', CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP);

CREATE TABLE wish_items (
    id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL CHECK (household_id = 'local-demo'),
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    price NUMERIC(14,2) CHECK (price >= 0),
    url VARCHAR(2048) CHECK (url IS NULL OR url ~* '^https?://[^[:space:]]+$'),
    image_url VARCHAR(2048) CHECK (image_url IS NULL OR image_url ~* '^https?://[^[:space:]]+$'),
    notes TEXT,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('want', 'saving', 'bought')),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
