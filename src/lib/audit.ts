import { getDb } from './db';
import type { User } from './auth';

function ensureAuditTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      actor_id INTEGER,
      actor_username TEXT,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log(ts);
    CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_username);
  `);
}

export interface AuditEntry {
  actor: User | null;
  action: string;
  target?: string | null;
  detail?: Record<string, unknown> | null;
}

export function logAudit(entry: AuditEntry): void {
  ensureAuditTable();
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_log (actor_id, actor_username, action, target, detail)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    entry.actor?.id ?? null,
    entry.actor?.username ?? null,
    entry.action,
    entry.target ?? null,
    entry.detail ? JSON.stringify(entry.detail) : null,
  );
}
