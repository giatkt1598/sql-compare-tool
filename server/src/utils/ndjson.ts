import fs from 'node:fs';
import readline from 'node:readline';

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;
const fileCache = new Map<string, { expiresAt: number; value: unknown }>();

function buildCacheKey(filePath: string): string {
  try {
    const stats = fs.statSync(filePath);
    return `${filePath}:${stats.mtimeMs}`;
  } catch {
    return filePath;
  }
}

function getCachedFile<T>(filePath: string): T | null {
  const cacheKey = buildCacheKey(filePath);
  const cached = fileCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  if (Date.now() > cached.expiresAt) {
    fileCache.delete(cacheKey);
    return null;
  }
  return cached.value as T;
}

function setCachedFile<T>(filePath: string, value: T): void {
  const cacheKey = buildCacheKey(filePath);
  fileCache.set(cacheKey, {
    expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
    value,
  });
}

export async function readNdjson<T>(
  filePath: string,
  onItem: (item: T, lineNumber: number) => Promise<void> | void
): Promise<void> {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  for await (const line of rl) {
    if (!line) {
      continue;
    }

    lineNumber += 1;

    try {
      const obj = JSON.parse(line) as T;
      await onItem(obj, lineNumber);
    } catch {
      // Skip invalid lines.
    }
  }
}

export async function readNdjsonToArray<T>(filePath: string): Promise<T[]> {
  const cached = getCachedFile<T[]>(filePath);
  if (cached) {
    return cached;
  }

  const rows: T[] = [];
  await readNdjson<T>(filePath, (obj) => {
    rows.push(obj);
  });
  if (rows.length > 0) {
    setCachedFile(filePath, rows);
  }
  return rows;
}

export function writeNdjson(filePath: string, rows: unknown[]): void {
  if (rows.length === 0) {
    fs.writeFileSync(filePath, '', 'utf8');
    return;
  }

  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
  for (const row of rows) {
    stream.write(`${JSON.stringify(row)}\n`);
  }
  stream.end();
}
