// ZENOVA SHOP - Moderation (Dyno/Carl style)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'moderation.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

let db = { warnings: {}, cases: {}, punishments: {} };
try {
  if (existsSync(DB_FILE)) db = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
} catch {}

function save() {
  try { writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8'); } catch (e) { console.error(e.message); }
}

export function addWarning(guildId, userId, modId, reason) {
  const key = `${guildId}:${userId}`;
  if (!db.warnings[key]) db.warnings[key] = [];
  const warn = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    modId,
    reason,
    at: new Date().toISOString()
  };
  db.warnings[key].push(warn);
  save();
  return warn;
}

export function getWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  return db.warnings[key] || [];
}

export function clearWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const count = (db.warnings[key] || []).length;
  db.warnings[key] = [];
  save();
  return count;
}

export function addCase(guildId, caseData) {
  if (!db.cases[guildId]) db.cases[guildId] = [];
  const c = { ...caseData, at: new Date().toISOString() };
  db.cases[guildId].push(c);
  save();
  return c;
}

export function getCases(guildId, limit = 20) {
  return (db.cases[guildId] || []).slice(-limit).reverse();
}