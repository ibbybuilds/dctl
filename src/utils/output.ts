export function resolveFormat(explicit: string): string {
  if (explicit !== 'auto') return explicit;
  return process.stdout.isTTY ? 'table' : 'json';
}

export function printResult(data: unknown, format: string): void {
  const fmt = resolveFormat(format);
  if (fmt === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log('  (none)');
      return;
    }
    if (typeof data[0] === 'object') {
      printTable(data as Record<string, unknown>[]);
    } else {
      data.forEach((item) => console.log(`  ${item}`));
    }
    return;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const maxKey = Math.max(...Object.keys(obj).map((k) => k.length));
    for (const [k, v] of Object.entries(obj)) {
      console.log(`  ${k.padEnd(maxKey)}  ${v}`);
    }
    return;
  }

  console.log(String(data));
}

export function printTable(rows: Record<string, unknown>[], columns?: string[]): void {
  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }

  const cols = columns ?? Object.keys(rows[0]);
  const widths: Record<string, number> = {};
  for (const col of cols) {
    widths[col] = col.length;
  }
  for (const row of rows) {
    for (const col of cols) {
      widths[col] = Math.max(widths[col], String(row[col] ?? '').length);
    }
  }

  const header = cols.map((c) => c.toUpperCase().padEnd(widths[c])).join('  ');
  const sep = cols.map((c) => '─'.repeat(widths[c])).join('  ');
  console.log(`  ${header}`);
  console.log(`  ${sep}`);

  for (const row of rows) {
    const line = cols.map((c) => String(row[c] ?? '').padEnd(widths[c])).join('  ');
    console.log(`  ${line}`);
  }
}
