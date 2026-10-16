// ZENOVA SHOP - Security (Phan quyen theo role)

export const ROLE_ADMIN_NAME = 'AI-STV Admin';
export const ROLE_MEMBER_NAME = 'AI-STV Member';

export function isOwner(interaction) {
  return interaction.guild?.ownerId === interaction.user.id;
}

export function hasAdminRole(interaction) {
  if (!interaction.member?.roles) return false;
  const roles = interaction.member.roles.cache
    ? [...interaction.member.roles.cache.values()]
    : [];
  return roles.some(r => r.name === ROLE_ADMIN_NAME);
}

export function hasMemberRole(interaction) {
  if (!interaction.member?.roles) return false;
  const roles = interaction.member.roles.cache
    ? [...interaction.member.roles.cache.values()]
    : [];
  return roles.some(r => r.name === ROLE_MEMBER_NAME);
}

export function isAdmin(interaction) {
  return isOwner(interaction) || hasAdminRole(interaction);
}

export function isMember(interaction) {
  return isAdmin(interaction) || hasMemberRole(interaction);
}