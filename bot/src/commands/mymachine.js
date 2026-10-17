import { SlashCommandBuilder } from 'discord.js';
import { listMachines, getStateJson } from '../lib/github.js';
import { machineEmbed, errorEmbed } from '../ui/embeds.js';

export const data = new SlashCommandBuilder().setName('mymachine').setDescription('🖥️ Máy của bạn');

export async function execute(i) {
  try {
    await i.deferReply({ ephemeral: true });
    const uid = i.user.id;
    const ms = await listMachines();
    let um = null;
    for (const m of ms) {
      const s = await getStateJson(m.id);
      if (s && s.ownerDiscordId === uid) { um = { id: m.id, state: s }; break; }
    }
    if (!um) return i.editReply({ embeds: [errorEmbed('Chưa có máy', 'Dùng /create để tạo')] });
    const { embed, row } = machineEmbed(um.id, um.state);
    if (row) await i.editReply({ embeds: [embed], components: [row] });
    else await i.editReply({ embeds: [embed] });
  } catch (e) {
    try { await i.editReply({ embeds: [errorEmbed('Lỗi', e.message)] }); } catch {}
  }
}
