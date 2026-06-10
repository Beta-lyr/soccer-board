-- Soccer Board D1 Schema

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  height REAL,
  weight REAL,
  preferredFoot TEXT DEFAULT 'right',
  positions TEXT DEFAULT '[]',       -- JSON array
  avatar TEXT,
  status TEXT DEFAULT 'healthy',
  abilities TEXT DEFAULT '{}',       -- JSON object
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tactics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  formation TEXT NOT NULL,
  players TEXT DEFAULT '[]',         -- JSON array of TacticPlayerPosition
  drawings TEXT DEFAULT '[]',        -- JSON array
  thumbnail TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lineup_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  formation TEXT NOT NULL,
  starters TEXT DEFAULT '[]',        -- JSON array
  substitutes TEXT DEFAULT '[]',     -- JSON array
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  date TEXT DEFAULT '',
  venue TEXT DEFAULT '',
  type TEXT NOT NULL,
  scope TEXT DEFAULT 'external',
  status TEXT DEFAULT 'upcoming',
  homeTeam TEXT DEFAULT '',
  awayTeam TEXT DEFAULT '',
  opponent TEXT DEFAULT '',
  homeLineup TEXT DEFAULT '[]',      -- JSON array
  awayLineup TEXT DEFAULT '[]',      -- JSON array
  lineup TEXT DEFAULT '[]',          -- JSON array (compat)
  score TEXT,                        -- JSON {home, away} or NULL
  events TEXT DEFAULT '[]',          -- JSON array
  ratings TEXT DEFAULT '[]',         -- JSON array
  competitionId TEXT,
  round INTEGER,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  teams TEXT DEFAULT '[]',           -- JSON array
  matchIds TEXT DEFAULT '[]',        -- JSON array
  standings TEXT,                    -- JSON array or NULL
  currentRound INTEGER DEFAULT 1,
  rounds INTEGER,
  groups TEXT,                       -- JSON array or NULL
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shortName TEXT,
  logo TEXT,
  playerIds TEXT DEFAULT '[]',       -- JSON array
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trainings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  attendance TEXT DEFAULT '[]',      -- JSON array
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
