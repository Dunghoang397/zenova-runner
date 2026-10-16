// ZENOVA SHOP - UI Embeds & Helpers
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const COLORS = {
  primary: 0x8b5cf6,
  success: 0x10b981,
  warning: 0xf59e0b,
  danger: 0xef4444,
  info: 0x6366f1,
  dark: 0x1e293b,
  gold: 0xfacc15,
  pink: 0xec4899
};

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vua xong';
  if (m < 60) return `${m} phut truoc`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} gio truoc`;
  return `${Math.floor(h / 24)} ngay truoc`;
}

export function machineStatusEmoji(status) {
  return {
    in_progress: 'RUN',
    queued: 'QUEUE',
    waiting: 'WAIT',
    completed: 'DONE',
    success: 'DONE',
    failure: 'FAIL',
    cancelled: 'CANCEL'
  }[status] || 'IDLE';
}

export function formatDuration(remainMs) {
  if (remainMs <= 0) return 'Da het';
  const h = Math.floor(remainMs / 3600000);
  const m = Math.floor((remainMs % 3600000) / 60000);
  return `${h}h ${m}m`;
}