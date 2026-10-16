// ZENOVA SHOP - UI Panels v12 (rut gon)
import { EmbedBuilder } from 'discord.js';
import { COLORS } from './embeds.js';

export function buildZenovaPanel(user, isAdmin = false) {
  const embed = new EmbedBuilder()
    .setTitle('ZENOVA SHOP - CONTROL PANEL')
    .setColor(COLORS.primary)
    .setDescription(
      '```\n' +
      '+----------------------------------------------+\n' +
      '|      ZENOVA SHOP  -  MAY AO  CLOUD           |\n' +
      '+----------------------------------------------+\n' +
      '```\n' +
      '**Chao mung den voi Zenova Shop!**\n\n' +
      'Dung cac lenh sau:\n' +
      '- `/taomay` - Tao may moi\n' +
      '- `/xoamay` - Xoa may cua ban\n' +
      '- `/infomay` - Xem thong tin may'
    )
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: 'Zenova Shop | Yeu cau boi ' + user.username + (isAdmin ? ' | ADMIN' : ''), iconURL: user.displayAvatarURL() })
    .setTimestamp();

  return { embed, components: [] };
}

export function buildCreatePanel() { return { embed: null, components: [] }; }
export function buildDeletePanel() { return { embed: null, components: [] }; }
export function buildInfoPanel() { return { embed: null, components: [] }; }
export function buildHelpPanel() { return { embed: null, components: [] }; }