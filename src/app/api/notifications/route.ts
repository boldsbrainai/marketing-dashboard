import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isRealMode } from '@/lib/seed-filter';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  data: unknown;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const db = getDb();
  const excludeSeed = isRealMode(req);

  let sql = 'SELECT * FROM notifications WHERE 1=1';
  const params: unknown[] = [];

  if (searchParams.get('unread') === 'true') { sql += ' AND read = 0'; }
  if (searchParams.get('type')) { sql += ' AND type = ?'; params.push(searchParams.get('type')); }

  if (excludeSeed) {
    sql += ` AND NOT EXISTS (SELECT 1 FROM seed_registry sr WHERE sr.table_name = 'notifications' AND sr.record_id = CAST(id AS TEXT))`;
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(searchParams.get('limit')) || 50);

  const rows = db.prepare(sql).all(...params) as (Omit<Notification, 'data' | 'read'> & { data: string | null; read: number })[];
  const notifications = rows.map(r => ({
    ...r,
    read: r.read === 1,
    data: r.data ? JSON.parse(r.data) : null,
  }));

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  if (body.mark_all_read) {
    db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Provide id or mark_all_read' }, { status: 400 });
}
