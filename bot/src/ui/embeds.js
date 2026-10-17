import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

export const COLORS = {
  primary: 0x5865F2, success: 0x10b981, warning: 0xf59e0b, danger: 0xef4444,
  info: 0x38bdf8, purple: 0x8b5cf6, gold: 0xfbbf24, dark: 0x1e1e2e
};

export const ICONS = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', loading: '⏳',
  rocket: '🚀', machine: '🖥️', lock: '🔐', user: '👤', ip: '🌐',
  apps: '📦', time: '⏱️', save: '💾', delete: '🗑️', restart: '🔄',
  grant: '👑', chart: '📊', cpu: '⚙️', ram: '💾', disk: '💽',
  network: '🌐', health: '❤️', speed: '⚡', shield: '🛡️', crown: '👑'
};

// ═══ EMBED CƠ BẢN ═══
export function createEmbed(type, title, description, fields = [], footer = null) {
  const e = new EmbedBuilder().setTitle(title).setColor(COLORS[type] || COLORS.primary).setTimestamp();
  if (description) e.setDescription(description);
  if (fields.length) e.addFields(fields);
  e.setFooter({ text: footer || 'Zenova v33 • by ALB Script' });
  return e;
}

export function successEmbed(t, d, f = []) { return createEmbed('success', ICONS.success + ' ' + t, d, f); }
export function errorEmbed(t, d) { return createEmbed('danger', ICONS.error + ' ' + t, d); }
export function warningEmbed(t, d) { return createEmbed('warning', ICONS.warning + ' ' + t, d); }
export function loadingEmbed(t, d) { return createEmbed('info', ICONS.loading + ' ' + t, d); }

// ═══ MACHINE EMBED NÂNG CAO ═══
export function machineEmbed(machineId, state) {
  const isReady = state?.ready === true;
  const statusText = isReady ? '✅ Sẵn sàng' : (state?.status === 'installing' ? '⏳ Đang cài apps' : '⏳ Đang khởi tạo');
  const statusColor = isReady ? COLORS.success : COLORS.warning;
  const uptime = state?.durationMinutes ? Math.floor(state.durationMinutes / 60) + 'h' : '?';
  
  const e = new EmbedBuilder()
    .setTitle(ICONS.machine + ' Máy: ' + machineId)
    .setColor(statusColor)
    .setDescription('`\n' + (isReady ? '🟢 ONLINE' : '🟡 STARTING') + ' | Uptime: ' + uptime + '\n`')
    .addFields(
      { name: ICONS.health + ' Trạng thái', value: statusText, inline: true },
      { name: ICONS.user + ' User', value: '' + (state?.user || 'runneradmin') + '', inline: true },
      { name: ICONS.lock + ' Pass', value: 'ABC123@', inline: true },
      { name: ICONS.ip + ' Tailscale IP', value: '' + (state?.tailscaleIp || 'N/A') + '', inline: true },
      { name: ICONS.time + ' Còn lại', value: state?.durationMinutes ? state.durationMinutes + ' phút' : 'N/A', inline: true },
      { name: ICONS.apps + ' Apps', value: state?.installedApps || 'Đang cài...', inline: false }
    )
    .setFooter({ text: 'RDP: ' + (state?.tailscaleIp || '?') + ':3389' })
    .setTimestamp();

  let row = null;
  if (isReady) {
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rdp_info_' + machineId).setLabel('Info RDP').setEmoji('🖥️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('save_' + machineId).setLabel('Save').setEmoji('💾').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('restart_' + machineId).setLabel('Restart').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('delete_' + machineId).setLabel('Xoá').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );
  }
  return { embed: e, row };
}

// ═══ SMART CREATE CONFIRM ═══
export function createConfirmEmbed(machineId, hasOldData, duration, apps) {
  if (!hasOldData) {
    const e = createEmbed('info', '🚀 Tạo máy mới', 
      'Máy ' + machineId + ' sẽ tạo từ đầu\n\n' +
      '**📦 Apps sẽ cài:**\n' +
      '> Discord, Chrome, Edge, TikTok, Spotify\n\n' +
      '**⏱️ Thời gian:** ~15 phút\n' +
      '**💾 Dữ liệu:** Máy mới, không có data cũ',
      [{ name: '⚙️ Cấu hình', value: 'CPU: 2 core | RAM: 7GB | Disk: 1TB', inline: false }]
    );
    return { embed: e, row: null };
  }
  
  const e = createEmbed('warning', '🎯 Chọn cách tạo máy',
    'Máy ' + machineId + ' đã có data từ phiên trước\n\n' +
    '**Chọn cách tạo:**',
    [
      { name: '💾 Restore data cũ', value: 'Apps + file + cài đặt\nTất cả giữ nguyên', inline: true },
      { name: '🆕 Máy mới tinh', value: 'Xoá toàn bộ data cũ\nTạo từ đầu', inline: true }
    ]
  );
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('create_restore_' + machineId).setLabel('Restore').setEmoji('💾').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('create_fresh_' + machineId).setLabel('Mới').setEmoji('🆕').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('create_cancel_' + machineId).setLabel('Huỷ').setEmoji('❌').setStyle(ButtonStyle.Danger)
  );
  return { embed: e, row };
}

// ═══ DASHBOARD ADMIN ═══
export function dashboardEmbed(machines, activeRuns) {
  const total = machines.length;
  const running = machines.filter(m => m.state?.ready).length;
  const installing = machines.filter(m => m.state?.status === 'installing').length;
  
  return createEmbed('purple', '📊 ZENOVA DASHBOARD', 'Hệ thống quản lý máy ảo',
    [
      { name: '🖥️ Tổng máy', value: '' + total + '', inline: true },
      { name: '🟢 Đang chạy', value: '' + running + '', inline: true },
      { name: '🟡 Đang cài', value: '' + installing + '', inline: true },
      { name: '⚡ Active runs', value: '' + activeRuns.length + '', inline: true },
      { name: '⏱️ Uptime bot', value: '' + Math.floor(process.uptime()/60) + 'p', inline: true },
      { name: '💾 RAM', value: '' + Math.floor(process.memoryUsage().heapUsed/1024/1024) + 'MB', inline: true }
    ],
    'Zenova v33 • Dashboard'
  );
}

// ═══ RDP INFO EMBED ═══
export function rdpInfoEmbed(machineId, state) {
  return createEmbed('success', '🖥️ THÔNG TIN RDP',
    'Máy ' + machineId + ' sẵn sàng kết nối',
    [
      { name: '🌐 IP', value: '' + state.tailscaleIp + '', inline: true },
      { name: '🔌 Port', value: '3389', inline: true },
      { name: '👤 User', value: '' + state.user + '', inline: true },
      { name: '🔐 Pass', value: 'ABC123@', inline: true },
      { name: '📱 Web Panel', value: 'http://' + state.tailscaleIp + ':8080/', inline: false },
      { name: '🎯 Cách kết nối', value: '`\n1. Mở mstsc (Remote Desktop)\n2. Nhập: ' + state.tailscaleIp + ':3389\n3. User: ' + state.user + '\n4. Pass: ABC123@\n`', inline: false }
    ]
  );
}

// ═══ SAVE STATUS EMBED ═══
export function saveStatusEmbed(machineId, status, reason) {
  const map = {
    saving: { emoji: '⏳', color: 'info', text: 'Đang lưu dữ liệu...' },
    done: { emoji: '✅', color: 'success', text: 'Đã lưu thành công!' },
    error: { emoji: '❌', color: 'danger', text: 'Lỗi lưu dữ liệu' }
  };
  const s = map[status] || map.saving;
  return createEmbed(s.color, s.emoji + ' SAVE: ' + machineId, s.text, 
    reason ? [{ name: '📋 Lý do', value: reason, inline: false }] : []
  );
}

// ═══ HELP EMBED NÂNG CAO ═══
export function helpEmbed() {
  return createEmbed('info', '📖 ZENOVA COMMANDS', 'Danh sách lệnh v33',
    [
      { name: '🚀 /create <id> [duration] [apps]', value: 'Tạo máy mới với chọn data cũ/mới', inline: false },
      { name: '💾 /save <id>', value: 'Lưu dữ liệu ngay', inline: false },
      { name: '🗑️ /delete <id> <confirm>', value: 'Xoá máy (phải gõ đúng tên)', inline: false },
      { name: '🔄 /restart <id>', value: 'Restart máy (giữ data)', inline: false },
      { name: '🖥️ /mymachine', value: 'Xem máy của bạn', inline: false },
      { name: '📋 /machines', value: 'Tất cả máy', inline: false },
      { name: '📊 /dashboard', value: 'Dashboard admin', inline: false },
      { name: 'ℹ️ /info', value: 'Thông tin bot', inline: false },
      { name: '👑 /grant <user> <role>', value: 'Cấp quyền (owner only)', inline: false }
    ],
    'Password mặc định: ABC123@'
  );
}
