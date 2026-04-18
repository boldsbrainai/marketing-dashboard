import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { getInstance, resolveOpenClawPaths } from '@/lib/instances';

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const OLLAMA_TAGS = `${OLLAMA_BASE_URL}/api/tags`;
const OLLAMA_PS = `${OLLAMA_BASE_URL}/api/ps`;

type OpenClawModelRouting = {
  primary?: unknown;
  fallbacks?: unknown;
};

type OpenClawConfig = {
  agents?: {
    defaults?: {
      model?: unknown;
    };
    list?: Array<{
      model?: unknown;
    }>;
  };
};

function normalizeRequiredModel(value: string): string | null {
  const model = String(value || '').trim().replace(/^ollama\//, '');
  return model ? model : null;
}

function extractOllamaModels(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    const model = normalizeRequiredModel(value);
    return typeof value === 'string' && value.startsWith('ollama/') && model ? [model] : [];
  }

  if (typeof value !== 'object' || value === null) return [];

  const routing = value as OpenClawModelRouting;
  const items = [routing.primary, ...(Array.isArray(routing.fallbacks) ? routing.fallbacks : [])];
  return items
    .filter((item): item is string => typeof item === 'string' && item.startsWith('ollama/'))
    .map((item) => normalizeRequiredModel(item))
    .filter((item): item is string => Boolean(item));
}

function readOpenClawRequiredModels(): string[] {
  try {
    const instance = getInstance();
    const { openclawConfigPath } = resolveOpenClawPaths(instance);
    if (!fs.existsSync(openclawConfigPath)) return [];

    const parsed = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf-8')) as OpenClawConfig;
    const collected = new Set<string>();

    for (const model of extractOllamaModels(parsed?.agents?.defaults?.model)) {
      collected.add(model);
    }

    for (const agent of parsed?.agents?.list || []) {
      for (const model of extractOllamaModels(agent?.model)) {
        collected.add(model);
      }
    }

    return [...collected];
  } catch {
    return [];
  }
}

function readEnvRequiredModels(): string[] {
  const raw = process.env.HERMES_OLLAMA_REQUIRED_MODELS || process.env.OLLAMA_REQUIRED_MODELS || '';
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((item) => normalizeRequiredModel(item))
    .filter((item): item is string => Boolean(item));
}

function getRequiredModels(): string[] {
  const envModels = readEnvRequiredModels();
  if (envModels.length > 0) return envModels;

  const configuredModels = readOpenClawRequiredModels();
  if (configuredModels.length > 0) return configuredModels;

  return [];
}

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const auth = requireApiUser(request);
  if (auth) return auth;
  try {
    const required = getRequiredModels();
    const [tagsRes, psRes] = await Promise.all([
      fetchWithTimeout(OLLAMA_TAGS, 2000),
      fetchWithTimeout(OLLAMA_PS, 2000),
    ]);

    if (!tagsRes.ok) {
      return NextResponse.json({ ok: false, error: `Ollama HTTP ${tagsRes.status}` }, { status: 200 });
    }

    const tags = await tagsRes.json() as { models?: { name: string }[] };
    const models = (tags.models || []).map((m) => m.name);
    const missing = required.filter((r) => !models.includes(r));

    let running: { name: string; expires_at?: string }[] = [];
    if (psRes.ok) {
      const ps = await psRes.json() as { models?: { name: string; expires_at?: string }[] };
      running = (ps.models || []).map((m) => ({ name: m.name, expires_at: m.expires_at }));
    }

    return NextResponse.json({
      ok: true,
      base_url: OLLAMA_BASE_URL,
      models,
      required,
      missing,
      count: models.length,
      running,
      warm_count: running.length,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 });
  }
}
