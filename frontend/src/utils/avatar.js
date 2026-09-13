// Clean minimalist default user avatar (dark slate circle with crisp user silhouette)
const DEFAULT_USER_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="%231E293B"/><circle cx="24" cy="18" r="7" fill="%2394A3B8"/><path d="M11 39c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="%2394A3B8"/></svg>`;

export const getAvatarSrc = (user) => {
  if (!user) return DEFAULT_USER_AVATAR;
  return (
    user.profilePicture ||
    user.googlePicture ||
    user.avatarUrl ||
    (user.githubUsername ? `https://github.com/${user.githubUsername}.png?size=120` : '') ||
    DEFAULT_USER_AVATAR
  );
};
