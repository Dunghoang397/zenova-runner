// ZENOVA SHOP - Security
export const ROLE_ADMIN_ID = '1552340493441175612';
export const ROLE_MEMBER_ID = '1540663118785675324';

export const OWNER_USER_IDS = [
  '1552648372836376677'
];

export function isWhitelistedUser(interaction) {
  return OWNER_USER_IDS.includes(interaction.user.id);
}

export function isOwner(interaction) {
  return interaction.guild?.ownerId === interaction.user.id;
}

export function hasAdminRole(interaction) {
  if (!interaction.member?.roles) return false;
  const roles = interaction.member.roles.cache
    ? [...interaction.member.roles.cache.keys()]
    : interaction.member.roles;
  if (ROLE_ADMIN_ID && roles.includes(ROLE_ADMIN_ID)) return true;
  return false;
}

export function hasMemberRole(interaction) {
  if (!interaction.member?.roles) return false;
  const roles = interaction.member.roles.cache
    ? [...interaction.member.roles.cache.keys()]
    : interaction.member.roles;
  if (ROLE_MEMBER_ID && roles.includes(ROLE_MEMBER_ID)) return true;
  return false;
}

export function isAdmin(interaction) {
  return isWhitelistedUser(interaction) || isOwner(interaction) || hasAdminRole(interaction);
}

export function isMember(interaction) {
  return isAdmin(interaction) || hasMemberRole(interaction);
}