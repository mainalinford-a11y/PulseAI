-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  is_paused BOOLEAN DEFAULT false,
  pause_reason VARCHAR(50),
  auto_resume_date TIMESTAMP,
  
  primary_location VARCHAR(100),
  search_scope VARCHAR(20) DEFAULT 'local',
  timezone VARCHAR(50) DEFAULT 'Africa/Kigali',
  
  cv_url TEXT,
  cv_text TEXT,
  cv_uploaded_at TIMESTAMP,
  
  total_searches_run INTEGER DEFAULT 0,
  total_matches_found INTEGER DEFAULT 0,
  last_search_date TIMESTAMP,
  
  stripe_customer_id VARCHAR(255),
  
  CONSTRAINT valid_tier CHECK (subscription_tier IN ('free', 'starter', 'pro', 'premium')),
  CONSTRAINT valid_status CHECK (subscription_status IN ('active', 'paused', 'canceled'))
);

-- Job searches table
CREATE TABLE job_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  job_title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  keywords TEXT[],
  
  is_automated BOOLEAN DEFAULT false,
  frequency VARCHAR(20) DEFAULT 'daily',
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job matches table
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  search_id UUID REFERENCES job_searches(id) ON DELETE CASCADE,
  
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_url TEXT NOT NULL UNIQUE,
  location VARCHAR(255),
  description TEXT,
  posted_date TIMESTAMP,
  
  match_score INTEGER NOT NULL,
  qualification_status BOOLEAN NOT NULL,
  match_reason TEXT,
  
  user_status VARCHAR(20) DEFAULT 'new',
  applied_at TIMESTAMP,
  notes TEXT,
  
  found_at TIMESTAMP DEFAULT NOW(),
  notified_at TIMESTAMP,
  
  CONSTRAINT valid_score CHECK (match_score >= 0 AND match_score <= 100),
  CONSTRAINT valid_user_status CHECK (user_status IN ('new', 'saved', 'applied', 'interviewing', 'rejected', 'offer', 'not_interested'))
);

-- Cover letters generated
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES job_matches(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Email logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  matches_included INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(subscription_tier);
CREATE INDEX idx_job_searches_user ON job_searches(user_id);
CREATE INDEX idx_job_matches_user ON job_matches(user_id);
CREATE INDEX idx_job_matches_score ON job_matches(match_score);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_searches_updated_at BEFORE UPDATE ON job_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();