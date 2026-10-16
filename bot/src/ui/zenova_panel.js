// ZENOVA SHOP - Main Panel
import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
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
      'Chon chuc nang ben duoi:\n\n' +
      '> **Tao may** - Tao may ao Windows moi\n' +
      '> **Xoa may** - Xoa may hien co cua ban\n' +
      '> **Thong tin may** - Xem thong tin may\n\n' +
      '**Luat choi:**\n' +
      '- 1 nguoi 1 may\n' +
      '- Thoi gian mac dinh: **6 gio**\n' +
      '- Windows: **2022** hoac **2025**'
    )
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: `Zenova Shop | Yeu cau boi ${user.username}${isAdmin ? ' | ADMIN' : ''}`,
      iconURL: user.displayAvatarURL()
    })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('zenova:create')
      .setLabel('Tao may')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('zenova:delete')
      .setLabel('Xoa may')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('zenova:info')
      .setLabel('Thong tin may')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('zenova:help')
      .setLabel('Tro giup')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('zenova:refresh')
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel('GitHub')
      .setEmoji('🌐')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://github.com/${process.env.GH_OWNER}/${process.env.GH_REPO}`)
  );

  return { embed, components: [row1, row2] };
}

export function buildCreatePanel() {
  const embed = new EmbedBuilder()
    .setTitle('ZENOVA - TAO MAY MOI')
    .setColor(COLORS.success)
    .setDescription(
      '```\n' +
      '+----------------------------------------------+\n' +
      '|       TAO MAY AO WINDOWS MOI                 |\n' +
      '+----------------------------------------------+\n' +
      '```\n' +
      '**Buoc 1:** Chon phien ban Windows\n' +
      '**Buoc 2:** Dat ten may\n' +
      '**Buoc 3:** Chon thoi gian\n' +
      '**Buoc 4:** Xac nhan\n\n' +
      '**Luu y:** Ban chi co the co **1 may** tai 1 thoi diem.'
    )
    .setFooter({ text: 'Zenova Shop | Tao may' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('zenova:create:win2022')
      .setLabel('Windows 2022')
      .setEmoji('🪟')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('zenova:create:win2025')
      .setLabel('Windows 2025')
      .setEmoji('🪟')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('zenova:back')
      .setLabel('Quay lai')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row1, row2] };
}

export function buildDeletePanel(machineId = null) {
  const embed = new EmbedBuilder()
    .setTitle('ZENOVA - XOA MAY')
    .setColor(COLORS.danger)
    .setDescription(
      machineId
        ? '```\n' +
          '+----------------------------------------------+\n' +
          '|          XAC NHAN XOA MAY                    |\n' +
          '+----------------------------------------------+\n' +
          '```\n' +
          `Ban co chac muon xoa may **\`${machineId}\`**?\n\n` +
          '**Hanh dong nay se:**\n' +
          '- Xoa toan bo backup\n' +
          '- May ao se dung ngay\n' +
          '- **Khong the hoan tac**'
        : 'Ban chua co may nao de xoa.\n\nHay dung **Tao may** de bat dau!'
    )
    .setFooter({ text: 'Zenova Shop | Xoa may' })
    .setTimestamp();

  const components = [];
  if (machineId) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`zenova:delete:confirm:${machineId}`)
          .setLabel('XOA VINH VIEN')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('zenova:back')
          .setLabel('Quay lai')
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  } else {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('zenova:create')
          .setLabel('Tao may')
          .setEmoji('🚀')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('zenova:back')
          .setLabel('Quay lai')
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  return { embed, components };
}

export function buildInfoPanel(machine, remainText = '?') {
  const embed = new EmbedBuilder()
    .setTitle('ZENOVA - THONG TIN MAY')
    .setColor(COLORS.info)
    .setDescription(
      '```\n' +
      '+----------------------------------------------+\n' +
      '|        THONG TIN MAY AO                      |\n' +
      '+----------------------------------------------+\n' +
      '```'
    )
    .addFields(
      { name: 'Ten may', value: `\`${machine.id}\``, inline: true },
      { name: 'Windows', value: `\`${machine.manifest?.windowsImage || machine.manifest?.osBuild || '?'}\``, inline: true },
      { name: 'Con lai', value: `\`${remainText}\``, inline: true },
      { name: 'User', value: `\`${machine.manifest?.user || '?'}\``, inline: true },
      { name: 'IP Tailscale', value: `\`${machine.manifest?.tailscaleIp || '?'}\``, inline: true },
      { name: 'Backup', value: `\`${machine.chunks} chunks\``, inline: true },
      { name: 'Tao luc', value: `<t:${Math.floor(new Date(machine.created).getTime() / 1000)}:R>`, inline: true },
      { name: 'Update cuoi', value: machine.updated ? `<t:${Math.floor(new Date(machine.updated).getTime() / 1000)}:R>` : '?', inline: true }
    )
    .setFooter({ text: 'Zenova Shop | Thong tin may' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`zenova:delete:ask:${machine.id}`)
      .setLabel('Xoa may nay')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('zenova:refresh')
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('zenova:back')
      .setLabel('Quay lai')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row] };
}

export function buildHelpPanel() {
  const embed = new EmbedBuilder()
    .setTitle('ZENOVA SHOP - TRO GIUP')
    .setColor(COLORS.gold)
    .setDescription(
      '```\n' +
      '+----------------------------------------------+\n' +
      '|          HUONG DAN SU DUNG                   |\n' +
      '+----------------------------------------------+\n' +
      '```'
    )
    .addFields(
      {
        name: 'Tao may',
        value: 'Nhan nut **Tao may** -> chon Windows -> dat ten -> xac nhan',
        inline: false
      },
      {
        name: 'Xoa may',
        value: 'Nhan nut **Xoa may** -> xac nhan (chi xoa may cua ban)',
        inline: false
      },
      {
        name: 'Thong tin may',
        value: 'Nhan nut **Thong tin may** de xem chi tiet may dang co',
        inline: false
      },
      {
        name: 'Ket noi',
        value: [
          '1. Cai **Tailscale**: https://tailscale.com/download',
          '2. Dang nhap cung tai khoan',
          '3. Mo RDP: `mstsc` (Windows) hoac **Microsoft Remote Desktop** (Mac)',
          '4. Nhap IP Tailscale + user/pass'
        ].join('\n'),
        inline: false
      },
      {
        name: 'Luat choi',
        value: [
          '- **1 nguoi 1 may** - xoa truoc khi tao moi',
          '- **Thoi gian mac dinh: 6 gio**',
          '- **Windows:** 2022 hoac 2025',
          '- **Member:** chi xoa duoc may cua minh'
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({ text: 'Zenova Shop | Tro giup' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('zenova:back')
      .setLabel('Quay lai')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel('GitHub')
      .setEmoji('📖')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://github.com/${process.env.GH_OWNER}/${process.env.GH_REPO}`)
  );

  return { embed, components: [row] };
}