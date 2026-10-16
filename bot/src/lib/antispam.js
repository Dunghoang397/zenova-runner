// ZENOVA SHOP - Anti-spam
const cache = new Map();
const SPAM_THRESHOLD = 5;
const SPAM_WINDOW_MS = 5000;
const MUTE_DURATION_MS = 10000;

export function checkSpam(userId, content) {
  const now = Date.now();
  if (!cache.has(userId)) {
    cache.set(userId, { messages: [], muted_until: 0 });
  }
  const u = cache.get(userId);

  if (u.muted_until > now) {
    return { spam: true, muted: true, remain: u.muted_until - now };
  }

  u.messages = u.messages.filter(m => now - m.at < SPAM_WINDOW_MS);
  u.messages.push({ content, at: now });

  const duplicates = u.messages.filter(m => m.content === content).length;
  if (duplicates >= SPAM_THRESHOLD || u.messages.length >= SPAM_THRESHOLD * 2) {
    u.muted_until = now + MUTE_DURATION_MS;
    u.messages = [];
    return { spam: true, muted: true, remain: MUTE_DURATION_MS };
  }

  return { spam: false };
}

export function isMuted(userId) {
  const u = cache.get(userId);
  return u && u.muted_until > Date.now();
}