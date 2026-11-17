PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 用户以登录来源区分，LINUX DO 用户使用不可变的社区 ID。
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  trust_level INTEGER NOT NULL DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 4),
  source TEXT NOT NULL CHECK (source IN ('demo', 'linuxdo')),
  created_at TEXT NOT NULL
);

-- 仅保存会话令牌的摘要，退出时删除；有效期七天。
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 100),
  description TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
  stake_title TEXT NOT NULL DEFAULT '',
  stake_type TEXT NOT NULL DEFAULT 'other' CHECK (stake_type IN ('vps', 'physical', 'service', 'other')),
  stake_detail TEXT NOT NULL DEFAULT '',
  evidence TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_status_deadline ON goals(status, deadline);
CREATE INDEX IF NOT EXISTS idx_goals_public ON goals(is_public, created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 150),
  date TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 480),
  done_at TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_date ON tasks(goal_id, date, position);
CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done_at);

-- 一个失败契约只能产生一次赠送活动；中奖结果写入后保持不变。
CREATE TABLE IF NOT EXISTS giveaways (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL UNIQUE REFERENCES goals(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vps', 'physical', 'service', 'other')),
  closes_at TEXT NOT NULL,
  drawn_at TEXT,
  winner_id TEXT REFERENCES users(id),
  delivery TEXT NOT NULL DEFAULT 'pending' CHECK (delivery IN ('pending', 'sent', 'received'))
);
CREATE INDEX IF NOT EXISTS idx_giveaways_closes ON giveaways(drawn_at, closes_at);

CREATE TABLE IF NOT EXISTS giveaway_entries (
  giveaway_id TEXT NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (giveaway_id, user_id)
);
