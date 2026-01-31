-- Migration: Add user_cvs table for versioned CVs
CREATE TABLE IF NOT EXISTS user_cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cvs_user ON user_cvs(user_id);
