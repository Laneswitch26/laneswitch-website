PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS partner_schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  FOREIGN KEY (school_id) REFERENCES partner_schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_access_codes_school ON access_codes(school_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes(status);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_window ON login_attempts(window_start);
