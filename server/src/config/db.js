import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'netra.db');

let rawDb = null;
let SQL = null;

export async function initDb() {
  if (rawDb) return rawDb;
  
  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(fileBuffer);
  } else {
    rawDb = new SQL.Database();
    saveDatabase();
  }
  return rawDb;
}

export function saveDatabase() {
  if (!rawDb) return;
  const data = rawDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper wrapper for convenient SQLite queries
export const db = {
  async init() {
    return await initDb();
  },

  exec(sql) {
    if (!rawDb) throw new Error("DB not initialized");
    rawDb.exec(sql);
    saveDatabase();
  },

  all(sql, params = []) {
    if (!rawDb) throw new Error("DB not initialized");
    const stmt = rawDb.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  get(sql, params = []) {
    if (!rawDb) throw new Error("DB not initialized");
    const stmt = rawDb.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },

  run(sql, params = []) {
    if (!rawDb) throw new Error("DB not initialized");
    rawDb.run(sql, params);
    saveDatabase();
    // Get last insert rowid and changes
    const lastIdRes = rawDb.exec("SELECT last_insert_rowid() AS id;");
    const lastInsertRowid = lastIdRes[0]?.values[0]?.[0] ?? null;
    return { lastInsertRowid };
  }
};

export default db;
