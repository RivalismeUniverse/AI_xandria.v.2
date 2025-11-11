-- AI_XANDRIA Database Schema
-- PostgreSQL 15+ with UUID support

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB indexing for better performance
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Users table (wallet-based authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    profile JSONB DEFAULT '{
        "bio": "",
        "avatar": "",
        "socialLinks": {}
    }'::jsonb,
    stats JSONB DEFAULT '{
        "totalBattles": 0,
        "battlesWon": 0,
        "personasCreated": 0,
        "totalSpent": 0,
        "totalEarned": 0
    }'::jsonb,
    preferences JSONB DEFAULT '{
        "notifications": true,
        "theme": "dark"
    }'::jsonb,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personas table (AI Personas as NFTs)
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    tagline TEXT,
    description TEXT,
    
    -- Core attributes
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'academic', 'content_creator', 'philosopher', 'technologist', 
        'artist', 'mystical', 'motivation', 'tech', 'wellness', 
        'creative', 'education', 'science', 'psychology', 'arts',
        'fitness', 'therapy', 'business', 'literature', 'lifecoach',
        'futurism', 'relationships'
    )),
    specialization TEXT NOT NULL,
    traits JSONB DEFAULT '[]'::jsonb,
    
    -- Visual & Media
    avatar_url TEXT,
    video_url TEXT,
    visual_prompt TEXT,
    
    -- Intelligence Profile (AI-generated stats)
    intelligence_profile JSONB DEFAULT '{
        "analytical": 50,
        "creativity": 50,
        "persuasion": 50,
        "adaptability": 50,
        "technical": 50,
        "emotional": 50
    }'::jsonb,
    
    -- Blockchain Data
    owner_wallet VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    nft_token_id BIGINT UNIQUE,
    nft_contract_address VARCHAR(42),
    nft_token_uri TEXT,
    
    -- Stats & Metrics
    battle_wins INTEGER DEFAULT 0,
    battle_losses INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 1000,
    chat_price DECIMAL(10,2) DEFAULT 5.00,
    total_chat_revenue DECIMAL(10,2) DEFAULT 0.00,
    users_count INTEGER DEFAULT 0,
    
    -- Marketplace
    is_listed BOOLEAN DEFAULT false,
    listing_price DECIMAL(18,8),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona1_id UUID NOT NULL REFERENCES personas(id),
    persona2_id UUID NOT NULL REFERENCES personas(id),
    topic TEXT NOT NULL,
    
    -- AI-generated arguments
    arguments JSONB DEFAULT '{
        "persona1": null,
        "persona2": null
    }'::jsonb,
    
    -- Voting data
    votes JSONB DEFAULT '{
        "persona1": [],
        "persona2": []
    }'::jsonb,
    
    -- Battle status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    winner_id UUID REFERENCES personas(id),
    
    -- Timestamps
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure different personas
    CHECK (persona1_id != persona2_id)
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id UUID NOT NULL REFERENCES personas(id),
    user_wallet VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    
    -- Payment & access
    unlock_transaction_hash VARCHAR(66),
    amount_paid DECIMAL(18,8),
    
    -- Session data
    messages JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT transactions table (marketplace history)
CREATE TABLE IF NOT EXISTS nft_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id UUID NOT NULL REFERENCES personas(id),
    
    -- Transaction parties
    from_wallet VARCHAR(42) NOT NULL,
    to_wallet VARCHAR(42) NOT NULL,
    
    -- Transaction details
    price DECIMAL(18,8) NOT NULL,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('mint', 'sale', 'transfer')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persona history table (for analytics)
CREATE TABLE IF NOT EXISTS persona_history (
    id BIGSERIAL PRIMARY KEY,
    persona_id UUID NOT NULL REFERENCES personas(id),
    
    -- Historical data points
    timestamp TIMESTAMPTZ NOT NULL,
    price NUMERIC,
    win_rate NUMERIC,
    votes BIGINT,
    owner TEXT,
    
    -- Raw payload for flexibility
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

CREATE INDEX IF NOT EXISTS idx_personas_owner ON personas(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_personas_category ON personas(category);
CREATE INDEX IF NOT EXISTS idx_personas_rating ON personas(rating);
CREATE INDEX IF NOT EXISTS idx_personas_nft_token ON personas(nft_token_id);
CREATE INDEX IF NOT EXISTS idx_personas_listed ON personas(is_listed) WHERE is_listed = true;
CREATE INDEX IF NOT EXISTS idx_personas_traits ON personas USING GIN(traits);
CREATE INDEX IF NOT EXISTS idx_personas_intelligence ON personas USING GIN(intelligence_profile);

CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_battles_personas ON battles(persona1_id, persona2_id);
CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at);
CREATE INDEX IF NOT EXISTS idx_battles_winner ON battles(winner_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_persona ON chat_sessions(persona_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_expires ON chat_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_nft_transactions_wallets ON nft_transactions(from_wallet, to_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_transactions_hash ON nft_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_nft_transactions_created ON nft_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_persona_history_persona_ts ON persona_history (persona_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_persona_history_timestamp ON persona_history (timestamp);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_battles_updated_at BEFORE UPDATE ON battles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
