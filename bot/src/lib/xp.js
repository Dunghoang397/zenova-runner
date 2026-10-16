// ZENOVA SHOP - He thong XP & Level
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'xp.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

let db = { users: {}, config: {} };
try {
  if (existsSync(DB_FILE)) {
    db = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
  }
} catch {}

const cooldowns = new Map();
const COOLDOWN_MS = 60000;

export function xpToLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

export function levelToXp(level) {
  return level * level * 100;
}

export function xpForNextLevel(xp) {
  const curLevel = xpToLevel(xp);
  const nextLevelXp = levelToXp(curLevel + 1);
  const curLevelXp = levelToXp(curLevel);
  return {
    current: xp - curLevelXp,
    needed: nextLevelXp - curLevelXp,
    nextLevel: curLevel + 1
  };
}

function save() {
  try {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Save XP DB fail:', e.message);
  }
}

export function getUser(userId) {
  if (!db.users[userId]) {
    db.users[userId] = { xp: 0, messages: 0, createdAt: new Date().toISOString() };
  }
  return db.users[userId];
}

export function addXp(userId, amount = 1, source = 'message') {
  const user = getUser(userId);
  const oldLevel = xpToLevel(user.xp);
  user.xp += amount;
  user.messages = (user.messages || 0) + (source === 'message' ? 1 : 0);
  user.lastActive = new Date().toISOString();
  const newLevel = xpToLevel(user.xp);
  save();
  return { user, oldLevel, newLevel, leveledUp: newLevel > oldLevel };
}

export function addXpWithCooldown(userId, amount = 1) {
  const now = Date.now();
  const last = cooldowns.get(userId) || 0;
  if (now - last < COOLDOWN_MS) return null;
  cooldowns.set(userId, now);
  return addXp(userId, amount, 'message');
}

export function getTop(limit = 10) {
  return Object.entries(db.users)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

export function resetXp(userId) {
  if (db.users[userId]) {
    db.users[userId].xp = 0;
    save();
    return true;
  }
  return false;
}

export function setXp(userId, xp) {
  const user = getUser(userId);
  user.xp = xp;
  save();
  return user;
}