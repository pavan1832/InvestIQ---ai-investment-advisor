-- AI Investment Advisor Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500),
    total_value DECIMAL(15, 2) DEFAULT 0,
    risk_score DECIMAL(5, 2) DEFAULT 0,
    diversification_score DECIMAL(5, 2) DEFAULT 0,
    holdings JSONB,
    sector_distribution JSONB,
    asset_allocation JSONB,
    ai_insights TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE portfolio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_value DECIMAL(15, 2),
    risk_score DECIMAL(5, 2),
    diversification_score DECIMAL(5, 2),
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_history_user_id ON portfolio_history(user_id);
CREATE INDEX idx_portfolio_history_date ON portfolio_history(snapshot_date);
