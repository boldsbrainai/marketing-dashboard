import path from 'node:path';

// Hermes "state dir" refers to the local JSON workspace files that the dashboard
// syncs into SQLite. For template readiness we must not default to user-specific
// absolute paths.
export function getHermesStateDir(): string {
  const v = process.env.HERMES_STATE_DIR;
  if (typeof v === 'string' && v.trim()) return v.trim();
  return path.join(process.cwd(), 'state');
}

