import { dispatchCreate, getStateJson, deleteMachine } from '../lib/github.js';
import { loadingEmbed, successEmbed, errorEmbed, rdpInfoEmbed, saveStatusEmbed } from '../ui/embeds.js';
import { logger } from '../lib/logger.js';

export async function handleButton(i) {
  try {
    const c = i.customId;
    if (c.startsWith('create_restore_')) await hc(i, c.replace('create_restore_', ''), true);
    else if (c.startsWith('create_fresh_')) await hc(i, c.replace('create_fresh_', ''), false);
    else if (c.startsWith('create_cancel_')) {
      const m = c.replace('create_cancel_', '');
      if (global._ctx) delete global._ctx[m];
      await i.update({ embeds: [errorEmbed('Huỷ', 'Không tạo máy')], components: [] });
    }
    else if (c.startsWith('delete_')) await hd(i, c.replace('delete_', ''));
    else if (c.startsWith('restart_')) await hr(i, c.replace('restart_', ''));
    else if (c.startsWith('save_')) await hs(i, c.replace('save_', ''));
    else if (c.startsWith('rdp_info_')) await hi(i, c.replace('rdp_info_', ''));
  } catch (e) {
    logger.err('Btn: ' + e.message);
    try { await i.reply({ content: '❌ ' + e.message, ephemeral: true }); } catch {}
  }
}

async function hc(i, m, restore) {
  const ctx = global._ctx?.[m];
  if (!ctx) return i.update({ embeds: [errorEmbed('Hết phiên', 'Dùng /create lại')], components: [] });
  if (ctx.userId !== i.user.id) return i.reply({ content: '❌ Không phải phiên của bạn', ephemeral: true });
  if (ctx.exp && Date.now() > ctx.exp) { delete global._ctx[m]; return i.update({ embeds: [errorEmbed('Hết hạn', 'Dùng /create')], components: [] }); }
  
  await i.update({ embeds: [loadingEmbed('🚀 Đang tạo máy', '' + m + ' • Restore: ' + (restore ? '✅' : '❌') + '\n\nĐợi 10-15 phút...')], components: [] });
  
  try {
    await dispatchCreate({ 
      machine_id: m, owner_discord_id: ctx.userId, restore_data: restore, 
      duration: ctx.duration, windows_image: 'windows-2025', 
      fixed_password: 'ABC123@', vhd_size_gb: '1024', choco_packages: ctx.apps 
    });
    await i.editReply({ embeds: [successEmbed('✅ Đã gửi lệnh', 
      'Máy ' + m + ' đang khởi tạo\n\n' +
      '• Restore: ' + (restore ? '✅ Có data cũ' : '❌ Máy mới') + '\n' +
      '• Apps: Discord, Chrome, Edge, TikTok, Spotify\n' +
      '• Thời gian: ~15 phút\n\n' +
      '📋 Kiểm tra /mymachine sau 10-15 phút'
    )] });
  } catch (e) { await i.editReply({ embeds: [errorEmbed('Lỗi dispatch', e.message)] }); }
  delete global._ctx[m];
}

async function hd(i, m) {
  const s = await getStateJson(m);
  if (!s || s.ownerDiscordId !== i.user.id) return i.reply({ content: '❌ Không phải máy của bạn', ephemeral: true });
  await deleteMachine(m, i.user.id, true);
  await i.update({ embeds: [successEmbed('🗑️ Đã xoá', 'Máy ' + m + ' đã xoá vĩnh viễn')], components: [] });
}

async function hr(i, m) {
  const s = await getStateJson(m);
  if (!s || s.ownerDiscordId !== i.user.id) return i.reply({ content: '❌ Không phải chủ máy', ephemeral: true });
  await i.reply({ content: '🔄 Dùng /restart ' + m + ' để restart', ephemeral: true });
}

async function hs(i, m) {
  const s = await getStateJson(m);
  if (!s || s.ownerDiscordId !== i.user.id) return i.reply({ content: '❌ Không phải chủ máy', ephemeral: true });
  if (!s.ready) return i.reply({ content: '⏳ Máy chưa sẵn sàng', ephemeral: true });
  
  await i.update({ embeds: [saveStatusEmbed(m, 'saving', 'Manual via button')], components: [] });
  
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 10000);
    const r = await fetch('http://' + s.tailscaleIp + ':8080/action/save', { method: 'POST', signal: ac.signal });
    if (r.ok) {
      setTimeout(async () => { try { await i.editReply({ embeds: [saveStatusEmbed(m, 'done', 'Đã gửi lệnh save')] }); } catch {} }, 2000);
    } else throw new Error('HTTP ' + r.status);
  } catch (e) {
    await i.editReply({ embeds: [saveStatusEmbed(m, 'error', e.message)] });
  }
}

async function hi(i, m) {
  const s = await getStateJson(m);
  if (!s) return i.reply({ content: '❌ Không tồn tại', ephemeral: true });
  await i.reply({ embeds: [rdpInfoEmbed(m, s)], ephemeral: true });
}
