export const getAvatarSrc = (user) => {
  if (!user) return '';
  return (
    user.profilePicture ||
    user.googlePicture ||
    user.avatarUrl ||
    (user.githubUsername ? `https://github.com/${user.githubUsername}.png?size=120` : '') ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'User'}&backgroundColor=transparent`
  );
};
