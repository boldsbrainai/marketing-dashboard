import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  normalizeJobId,
  readCronJobsFile,
  toggleCronJob,
  triggerCronJobNow,
  upsertCronJob,
  writeCronJobsFile,
} from './cron-jobs';

const tempDir = mkdtempSync(path.join(tmpdir(), 'hermes-cron-jobs-test-'));

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

test('normalizeJobId accepts simple ids and rejects traversal/weird ids', () => {
  assert.equal(normalizeJobId('morning-research'), 'morning-research');
  assert.equal(normalizeJobId('A_1'), 'A_1');
  assert.equal(normalizeJobId(''), null);
  assert.equal(normalizeJobId('../x'), null);
  assert.equal(normalizeJobId('x y'), null);
});

test('readCronJobsFile returns empty list when jobs.json is missing', async () => {
  const cronDir = path.join(tempDir, 'cron-missing');
  const file = await readCronJobsFile(cronDir);
  assert.ok(file);
  assert.equal(Array.isArray(file.jobs), true);
  assert.equal(file.jobs.length, 0);
});

test('toggleCronJob flips enabled and triggerCronJobNow sets state.nextRunAtMs', async () => {
  const cronDir = path.join(tempDir, 'cron-basic');
  await fs.mkdir(cronDir, { recursive: true });
  await fs.writeFile(
    path.join(cronDir, 'jobs.json'),
    JSON.stringify({ version: 1, jobs: [{ id: 'a', enabled: true, state: { nextRunAtMs: 123 } }] }, null, 2),
    'utf-8',
  );

  const file = await readCronJobsFile(cronDir);
  const toggled = toggleCronJob(file, 'a');
  assert.ok(toggled);
  assert.equal(toggled.jobs[0].enabled, false);

  const triggered = triggerCronJobNow(toggled, 'a');
  assert.ok(triggered);
  assert.ok(triggered.jobs[0].state && typeof triggered.jobs[0].state === 'object');
  const nextRun = (triggered.jobs[0].state as Record<string, unknown>).nextRunAtMs;
  assert.equal(typeof nextRun, 'number');
  assert.ok((nextRun as number) > 0);
});

test('writeCronJobsFile writes jobs.json and creates backups when overwriting', async () => {
  const cronDir = path.join(tempDir, 'cron-write');
  await fs.mkdir(cronDir, { recursive: true });
  await fs.writeFile(path.join(cronDir, 'jobs.json'), JSON.stringify({ version: 1, jobs: [] }, null, 2), 'utf-8');

  const next = upsertCronJob({ version: 1, jobs: [] }, { id: 'job-1', enabled: true });
  await writeCronJobsFile(cronDir, next);

  const raw = await fs.readFile(path.join(cronDir, 'jobs.json'), 'utf-8');
  assert.match(raw, /"id": "job-1"/);
  const bak = await fs.readFile(path.join(cronDir, 'jobs.json.bak'), 'utf-8');
  assert.ok(bak.includes('"jobs"'));
});
