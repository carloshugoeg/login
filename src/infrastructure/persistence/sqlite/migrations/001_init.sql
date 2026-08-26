CREATE TABLE pending_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  age        INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  age        INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  verified_at TEXT NOT NULL
);
