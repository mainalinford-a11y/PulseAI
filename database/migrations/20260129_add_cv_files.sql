-- Create cv_files table to store uploaded CV files as binary data
CREATE TABLE IF NOT EXISTS cv_files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) DEFAULT 'application/octet-stream',
  file_content BYTEA NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, filename)
);

-- Index on user_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_cv_files_user_id ON cv_files(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_files_user_is_current ON cv_files(user_id, is_current);

-- Update users table to reference cv_files instead of cv_url (optional, but helps)
-- Note: if you want to keep cv_url as a denormalized field pointing to the endpoint, you can skip this
-- ALTER TABLE users ADD COLUMN current_cv_file_id INTEGER REFERENCES cv_files(id) ON DELETE SET NULL;
