import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase

export async function initializeDatabase() {
  await SQLite.deleteDatabaseAsync("taskhabit.db");
  db = await SQLite.openDatabaseAsync("taskhabit.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      recurrence_pattern TEXT,
      reminders TEXT,
      completed INTEGER DEFAULT 0,
      tags TEXT,
      parent_task_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      frequency_pattern TEXT NOT NULL,
      streak_count INTEGER DEFAULT 0,
      last_completed_date TEXT,
      reminders TEXT,
      tags TEXT,
      completed_today INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      linked_task_id TEXT,
      linked_habit_id TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#007AFF',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getDatabase() {
  return db
}
