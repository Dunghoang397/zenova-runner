import { SlashCommandBuilder } from 'discord.js';
import { listActiveRuns, cancelRun, dispatchCreate, getStateJson } from '../lib/github.js';

export const data = new SlashCommandBuilder()
  .setName('restart')
  .setDescription('Khởi động lại máy')
  .addStringOption(opt => opt.setName('machine_id').setDescription('Tên máy').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const machineId = interaction.options.getString('machine_id');
  const state = await getStateJson(machineId);
  if (!state) {
    return interaction.editReply({ content: `❌ Không tìm thấy máy \`${machineId}\`` });
  }
  try {
    const runs = await listActiveRuns();
    for (const r of runs) {
      if ((r.display_title || '').toLowerCase().includes(machineId.toLowerCase())) {
        await cancelRun(r.id);
      }
    }
    await new Promise(r => setTimeout(r, 5000));
    await dispatchCreate({
      machine_id: machineId,
      owner_discord_id: state.ownerDiscordId || interaction.user.id,
      duration: '5h00m',
      windows_image: state.windowsImage || 'windows-2025',
      vhd_size_gb: '1024'
    });
    await interaction.editReply({ content: `🔁 Đã restart máy \`${machineId}\`. Đợi 5-10 phút.` });
  } catch (e) {
    await interaction.editReply({ content: `❌ Lỗi: ${e.message}` });
  }
}
