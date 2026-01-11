import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

// Use absolute path for database
const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/archive.db');

// Ensure data directory exists
const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

console.log('Initializing database at:', dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Categories table with hierarchy support
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Work types table
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#6B7280'
    );
  `);

  // Works table
  db.exec(`
    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      author_name TEXT,
      author_email TEXT,
      academic_year TEXT,
      work_type_id INTEGER REFERENCES work_types(id) ON DELETE SET NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      google_file_id TEXT NOT NULL,
      file_url TEXT,
      thumbnail_url TEXT,
      file_size INTEGER,
      page_count INTEGER,
      view_count INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 1,
      share_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_works_category ON works(category_id);
    CREATE INDEX IF NOT EXISTS idx_works_type ON works(work_type_id);
    CREATE INDEX IF NOT EXISTS idx_works_featured ON works(is_featured);
    CREATE INDEX IF NOT EXISTS idx_works_share_token ON works(share_token);
  `);

  // Work tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_tags (
      work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (work_id, tag_id)
    );
  `);

  // Full-text search virtual table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS works_fts USING fts5(
      title,
      description,
      author_name,
      content='works',
      content_rowid='id'
    );

    -- Triggers to keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS works_ai AFTER INSERT ON works BEGIN
      INSERT INTO works_fts(rowid, title, description, author_name)
      VALUES (new.id, new.title, new.description, new.author_name);
    END;

    CREATE TRIGGER IF NOT EXISTS works_ad AFTER DELETE ON works BEGIN
      INSERT INTO works_fts(works_fts, rowid, title, description, author_name)
      VALUES ('delete', old.id, old.title, old.description, old.author_name);
    END;

    CREATE TRIGGER IF NOT EXISTS works_au AFTER UPDATE ON works BEGIN
      INSERT INTO works_fts(works_fts, rowid, title, description, author_name)
      VALUES ('delete', old.id, old.title, old.description, old.author_name);
      INSERT INTO works_fts(rowid, title, description, author_name)
      VALUES (new.id, new.title, new.description, new.author_name);
    END;
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'guest')),
      notify_new_works INTEGER DEFAULT 0,
      notify_comments INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
  `);

  // Votes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stars INTEGER NOT NULL CHECK(stars >= 0 AND stars <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(work_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_votes_work ON votes(work_id);
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_comments_work ON comments(work_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
  `);

  // Favorites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, work_id)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  `);

  // Activity logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL CHECK(action IN ('view', 'download', 'share')),
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_activity_work ON activity_logs(work_id);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
  `);

  // Config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('All tables created successfully!');
};

// Insert default data
const insertDefaults = () => {
  // Default work types
  const workTypes = [
    { name: 'Project', icon: 'folder' },
    { name: 'Report', icon: 'file-text' },
    { name: 'Thesis', icon: 'book' },
    { name: 'Presentation', icon: 'presentation' }
  ];

  const insertWorkType = db.prepare('INSERT OR IGNORE INTO work_types (name, icon) VALUES (?, ?)');
  for (const type of workTypes) {
    insertWorkType.run(type.name, type.icon);
  }

  // Default categories
  const categories = [
    { name: 'Computer Science', description: 'Computer Science and IT projects' },
    { name: 'Engineering', description: 'Engineering projects and reports' },
    { name: 'Research', description: 'Research papers and thesis' },
    { name: 'General', description: 'General student works' }
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  for (const cat of categories) {
    insertCategory.run(cat.name, cat.description);
  }

  // Default tags
  const tags = [
    { name: 'Web Development', color: '#3B82F6' },
    { name: 'Mobile App', color: '#10B981' },
    { name: 'Machine Learning', color: '#8B5CF6' },
    { name: 'Data Science', color: '#F59E0B' },
    { name: 'IoT', color: '#EF4444' },
    { name: 'Database', color: '#06B6D4' }
  ];

  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)');
  for (const tag of tags) {
    insertTag.run(tag.name, tag.color);
  }

  // Default config
  const configs = [
    { key: 'site_name', value: 'Student Work Archive', description: 'Site name displayed in header' },
    { key: 'site_description', value: 'A system for archiving and showcasing student works', description: 'Site description' },
    { key: 'items_per_page', value: '12', description: 'Number of items per page' },
    { key: 'allow_guest_view', value: 'true', description: 'Allow guests to view public works' },
    { key: 'require_approval', value: 'false', description: 'Require admin approval for new works' },
    { key: 'allowed_domain', value: '', description: 'Restrict login to specific domain (e.g., @example.com)' },
    { key: 'google_shared_drive_id', value: '', description: 'Google Shared Drive ID' },
    { key: 'google_shared_drive_url', value: '', description: 'Google Shared Drive URL' }
  ];

  const insertConfig = db.prepare('INSERT OR IGNORE INTO config (key, value, description) VALUES (?, ?, ?)');
  for (const config of configs) {
    insertConfig.run(config.key, config.value, config.description);
  }

  console.log('Default data inserted successfully!');
};

// Run initialization
try {
  createTables();
  insertDefaults();
  console.log('Database initialization complete!');
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
} finally {
  db.close();
}
