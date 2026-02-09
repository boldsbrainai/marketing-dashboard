import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isRealMode, maybeSeedExclude } from '@/lib/seed-filter';
import { AGENTS, ACTION_TO_AGENT } from '@/lib/agent-config';
import type { AgentStatus, AgentStats, ActivityEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDb();
  const now = Date.now();
  const excludeSeed = isRealMode(req);
  const sf = excludeSeed
    ? ` AND NOT EXISTS (SELECT 1 FROM seed_registry sr WHERE sr.table_name = 'activity_log' AND sr.record_id = CAST(activity_log.id AS TEXT))`
    : '';

  const agents = AGENTS.map(agent => {
    // Get actions attributable to this agent
    const agentActions = Object.entries(ACTION_TO_AGENT)
      .filter(([, v]) => v.agent === agent.id)
      .map(([action]) => action);

    const placeholders = agentActions.map(() => '?').join(',');

    // Stats: today
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = agentActions.length > 0
      ? (db.prepare(
          `SELECT COUNT(*) as c FROM activity_log WHERE action IN (${placeholders}) AND date(ts) = ?${sf}`
        ).get(...agentActions, today) as { c: number })?.c ?? 0
      : 0;

    // Stats: this week
    const weekCount = agentActions.length > 0
      ? (db.prepare(
          `SELECT COUNT(*) as c FROM activity_log WHERE action IN (${placeholders}) AND ts > datetime('now', '-7 days')${sf}`
        ).get(...agentActions) as { c: number })?.c ?? 0
      : 0;

    // Last activity
    const lastActivity = agentActions.length > 0
      ? db.prepare(
          `SELECT action, detail, ts FROM activity_log WHERE action IN (${placeholders})${sf} ORDER BY ts DESC LIMIT 1`
        ).get(...agentActions) as { action: string; detail: string; ts: string } | undefined
      : undefined;

    // Top skills (by action count, last 30 days)
    const skillCounts = agentActions.length > 0
      ? db.prepare(
          `SELECT action, COUNT(*) as c FROM activity_log
           WHERE action IN (${placeholders}) AND ts > datetime('now', '-30 days')${sf}
           GROUP BY action ORDER BY c DESC LIMIT 5`
        ).all(...agentActions) as { action: string; c: number }[]
      : [];

    const topSkills = skillCounts.map(s => ({
      skill: ACTION_TO_AGENT[s.action]?.skill || s.action,
      count: s.c,
    }));

    // Recent activity (last 10)
    const recentActivity = agentActions.length > 0
      ? db.prepare(
          `SELECT id, ts, action, detail, result FROM activity_log
           WHERE action IN (${placeholders})${sf} ORDER BY ts DESC LIMIT 10`
        ).all(...agentActions) as ActivityEntry[]
      : [];

    // Derive status
    let status: AgentStatus = 'planned';
    if (lastActivity?.ts) {
      const elapsed = now - new Date(lastActivity.ts).getTime();
      if (elapsed < 30 * 60 * 1000) status = 'active';
      else if (elapsed < 24 * 60 * 60 * 1000) status = 'idle';
    }

    const stats: AgentStats = {
      actions_today: todayCount,
      actions_week: weekCount,
      last_action: lastActivity?.detail || null,
      last_action_at: lastActivity?.ts || null,
      top_skills: topSkills,
    };

    return {
      ...agent,
      status,
      stats,
      recent_activity: recentActivity,
    };
  });

  return NextResponse.json(agents);
}
