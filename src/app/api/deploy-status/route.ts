import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { requireApiUser } from '@/lib/api-auth';
import { getInstance, resolveOpenClawPaths } from '@/lib/instances';

export const dynamic = 'force-dynamic';

function safeExec(cmd: string[], fallback = ''): string {
  try {
    return execFileSync(cmd[0], cmd.slice(1), { encoding: 'utf-8' }).trim();
  } catch {
    return fallback;
  }
}

function getInstanceId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    return url.searchParams.get('instance') || url.searchParams.get('namespace');
  } catch {
    return null;
  }
}

function latestLog(logDir: string) {
  if (!fs.existsSync(logDir)) return null;
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.includes('deploy') && f.endsWith('.log'))
    .map((f) => path.join(logDir, f));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const as = fs.statSync(a).mtimeMs;
    const bs = fs.statSync(b).mtimeMs;
    return bs - as;
  });
  const file = files[0];
  const raw = fs.readFileSync(file, 'utf-8');
  const lines = raw.trim().split('\n').slice(-80);
  return {
    path: file,
    mtime: new Date(fs.statSync(file).mtimeMs).toISOString(),
    tail: lines,
  };
}

export async function GET(request: Request) {
  const auth = requireApiUser(request as Request);
  if (auth) return auth;

  const instance = getInstance(getInstanceId(request));
  const { logsDir } = resolveOpenClawPaths(instance);

  const lockFile =
    process.env.HERMES_DEPLOY_LOCK_FILE?.trim() || '/tmp/hermes-dashboard-deploy.lock';
  const logDir =
    process.env.HERMES_DEPLOY_LOG_DIR?.trim() || path.join(logsDir, 'deploy');
  const scriptPath = process.env.HERMES_DEPLOY_SCRIPT_PATH?.trim() || '';
  const serviceName = process.env.HERMES_SERVICE_NAME?.trim() || 'hermes-dashboard.service';

  try {
    const running = scriptPath
      ? safeExec(['pgrep', '-af', path.basename(scriptPath)], '')
      : safeExec(['pgrep', '-af', 'deploy'], '');
    const isActive = safeExec(['systemctl', 'is-active', serviceName], 'unknown');
    const log = latestLog(logDir);
    const lockExists = fs.existsSync(lockFile);

    return NextResponse.json({
      instance: instance.id,
      service: {
        name: serviceName,
        state: isActive,
      },
      deploy: {
        script_path: scriptPath || null,
        lock_file: lockFile,
        lock_exists: lockExists,
        running_pids: running ? running.split('\n').filter(Boolean) : [],
      },
      latest_log: log,
    });
  } catch (error) {
    console.error('GET /api/deploy-status error:', error);
    return NextResponse.json({ error: 'Failed to read deploy status' }, { status: 500 });
  }
}

