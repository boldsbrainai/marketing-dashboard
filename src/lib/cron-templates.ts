import { randomBytes } from 'node:crypto';
import { getDb } from '@/lib/db';

export type CronTemplate = {
  id: string;
  name: string;
  description: string | null;
  job_json: string;
  created_at_ms: number;
  updated_at_ms: number;
};

export type CronTemplateRow = Pick<CronTemplate, 'id' | 'name' | 'description' | 'job_json' | 'updated_at_ms'>;

const MAX_NAME = 80;
const MAX_DESC = 240;
const MAX_JOB_JSON_BYTES = 128 * 1024;

function ensureCronTemplatesTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS cron_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      job_json TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cron_templates_updated ON cron_templates(updated_at_ms);
  `);
}

function normalizeName(value: unknown): string | null {
  const name = String(value ?? '').trim();
  if (!name) return null;
  if (name.length > MAX_NAME) return null;
  return name;
}

function normalizeDescription(value: unknown): string | null {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (v.length > MAX_DESC) return null;
  return v;
}

function normalizeId(value: unknown): string | null {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (v.length > 128) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(v)) return null;
  return v;
}

function validateJobJson(job: unknown): string {
  // Store the exact JSON the user provides, but enforce it's valid and bounded.
  const json = JSON.stringify(job, null, 2);
  const bytes = Buffer.byteLength(json, 'utf-8');
  if (bytes > MAX_JOB_JSON_BYTES) {
    throw new Error('Template job JSON too large');
  }
  if (!job || typeof job !== 'object') {
    throw new Error('Template job must be an object');
  }
  return json;
}

function newTemplateId(): string {
  return `tmpl_${randomBytes(6).toString('hex')}`;
}

export function listCronTemplates(limit = 50): CronTemplateRow[] {
  ensureCronTemplatesTable();
  const db = getDb();
  const n = Math.max(1, Math.min(200, Math.floor(limit)));
  return db.prepare(
    `SELECT id, name, description, job_json, updated_at_ms
     FROM cron_templates
     ORDER BY updated_at_ms DESC
     LIMIT ?`,
  ).all(n) as CronTemplateRow[];
}

export function createCronTemplate(input: { name: unknown; description?: unknown; job: unknown }): CronTemplate {
  ensureCronTemplatesTable();
  const name = normalizeName(input.name);
  if (!name) throw new Error(`Invalid name (max ${MAX_NAME} chars)`);
  const description = normalizeDescription(input.description);
  const job_json = validateJobJson(input.job);

  const now = Date.now();
  const db = getDb();
  const id = newTemplateId();
  try {
    db.prepare(
      `INSERT INTO cron_templates (id, name, description, job_json, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, name, description, job_json, now, now);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      throw new Error('Template name already exists');
    }
    throw e;
  }

  return {
    id,
    name,
    description,
    job_json,
    created_at_ms: now,
    updated_at_ms: now,
  };
}

export function updateCronTemplate(input: { id: unknown; name?: unknown; description?: unknown; job?: unknown }): CronTemplate {
  ensureCronTemplatesTable();
  const id = normalizeId(input.id);
  if (!id) throw new Error('Invalid id');

  const db = getDb();
  const existing = db.prepare(
    'SELECT id, name, description, job_json, created_at_ms, updated_at_ms FROM cron_templates WHERE id = ?',
  ).get(id) as CronTemplate | undefined;
  if (!existing) throw new Error('Not found');

  const name = input.name === undefined ? existing.name : normalizeName(input.name);
  if (!name) throw new Error(`Invalid name (max ${MAX_NAME} chars)`);
  const description = input.description === undefined ? existing.description : normalizeDescription(input.description);
  const job_json = input.job === undefined ? existing.job_json : validateJobJson(input.job);
  const now = Date.now();

  try {
    db.prepare(
      `UPDATE cron_templates
       SET name = ?, description = ?, job_json = ?, updated_at_ms = ?
       WHERE id = ?`,
    ).run(name, description, job_json, now, id);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      throw new Error('Template name already exists');
    }
    throw e;
  }

  return {
    ...existing,
    name,
    description,
    job_json,
    updated_at_ms: now,
  };
}

export function deleteCronTemplate(idInput: unknown): void {
  ensureCronTemplatesTable();
  const id = normalizeId(idInput);
  if (!id) throw new Error('Invalid id');
  const db = getDb();
  const info = db.prepare('DELETE FROM cron_templates WHERE id = ?').run(id);
  if (info.changes === 0) throw new Error('Not found');
}

