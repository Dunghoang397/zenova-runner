// ZENOVA SHOP - Economy System (OwO style)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'economy.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

let db = { users: {} };
try {
  if (existsSync(DB_FILE)) db = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
} catch {}

function save() {
  try { writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8'); } catch (e) { console.error(e.message); }
}

export function getUser(userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      balance: 100,
      bank: 0,
      daily: 0,
      lastWork: 0,
      lastDaily: 0,
      streak: 0,
      totalEarned: 100,
      createdAt: new Date().toISOString()
    };
  }
  return db.users[userId];
}

export function getBalance(userId) {
  const u = getUser(userId);
  return u.balance + u.bank;
}

export function addBalance(userId, amount) {
  const u = getUser(userId);
  u.balance += amount;
  if (amount > 0) u.totalEarned += amount;
  save();
  return u;
}

export function removeBalance(userId, amount) {
  const u = getUser(userId);
  if (u.balance < amount) return false;
  u.balance -= amount;
  save();
  return true;
}

export function claimDaily(userId) {
  const u = getUser(userId);
  const now = Date.now();
  const DAY = 86400000;
  if (now - u.lastDaily < DAY) {
    const remain = DAY - (now - u.lastDaily);
    return { success: false, remain };
  }
  if (now - u.lastDaily < DAY * 2) {
    u.streak = (u.streak || 0) + 1;
  } else {
    u.streak = 1;
  }
  const bonus = Math.min(u.streak * 50, 500);
  const amount = 200 + bonus;
  u.balance += amount;
  u.lastDaily = now;
  u.totalEarned += amount;
  save();
  return { success: true, amount, streak: u.streak };
}

export function work(userId) {
  const u = getUser(userId);
  const now = Date.now();
  const COOLDOWN = 3600000;
  if (now - u.lastWork < COOLDOWN) {
    const remain = COOLDOWN - (now - u.lastWork);
    return { success: false, remain };
  }
  const jobs = ['lap trinh', 'design', 'ban hang', 'day hoc', 'stream', 'viet blog', 'chay shipper', 'phuc vu'];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const amount = 50 + Math.floor(Math.random() * 150);
  u.balance += amount;
  u.lastWork = now;
  u.totalEarned += amount;
  save();
  return { success: true, amount, job };
}

export function transfer(fromId, toId, amount) {
  if (amount <= 0) return { success: false, error: 'So tien phai lon hon 0' };
  const from = getUser(fromId);
  if (from.balance < amount) return { success: false, error: 'Khong du tien' };
  const to = getUser(toId);
  from.balance -= amount;
  to.balance += amount;
  save();
  return { success: true };
}

export function gamble(userId, amount) {
  if (amount <= 0) return { success: false, error: 'So tien phai lon hon 0' };
  const u = getUser(userId);
  if (u.balance < amount) return { success: false, error: 'Khong du tien' };
  const roll = Math.random();
  let win = 0;
  let multiplier = 0;
  if (roll < 0.45) { multiplier = 0; win = -amount; }
  else if (roll < 0.75) { multiplier = 2; win = amount; }
  else if (roll < 0.95) { multiplier = 3; win = amount * 2; }
  else { multiplier = 5; win = amount * 4; }
  u.balance += win;
  if (win > 0) u.totalEarned += win;
  save();
  return { success: true, amount, win, multiplier, newBalance: u.balance };
}

export function getTop(limit = 10) {
  return Object.entries(db.users)
    .map(([userId, data]) => ({ userId, ...data, total: data.balance + data.bank }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}