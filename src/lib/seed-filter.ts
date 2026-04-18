export function isRealMode(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get('real') === 'true';
}

export function maybeSeedExclude(request: Request, tableName: string, idColumn: string = 'id'): string {
  if (!isRealMode(request)) return '';
  return ` AND NOT EXISTS (SELECT 1 FROM seed_registry sr WHERE sr.table_name = '${tableName}' AND sr.record_id = CAST(${idColumn} AS TEXT))`;
}
