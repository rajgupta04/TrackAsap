import { describe, it, expect } from 'vitest';
import { getAvatarSrc } from '../avatar';

describe('Avatar Utility (getAvatarSrc)', () => {
  it('should return default user SVG when user object is null or undefined', () => {
    const resultNull = getAvatarSrc(null);
    const resultUndefined = getAvatarSrc(undefined);

    expect(resultNull).toContain('data:image/svg+xml');
    expect(resultUndefined).toContain('data:image/svg+xml');
    // Ensure no Dicebear creepy cartoon URL is returned
    expect(resultNull).not.toContain('dicebear');
  });

  it('should prioritize explicit profilePicture if available', () => {
    const user = {
      profilePicture: 'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
      googlePicture: 'https://lh3.googleusercontent.com/a/photo.jpg',
    };

    expect(getAvatarSrc(user)).toBe('https://res.cloudinary.com/demo/image/upload/v1/profile.jpg');
  });

  it('should fall back to googlePicture if profilePicture is missing', () => {
    const user = {
      googlePicture: 'https://lh3.googleusercontent.com/a/google_avatar.jpg',
    };

    expect(getAvatarSrc(user)).toBe('https://lh3.googleusercontent.com/a/google_avatar.jpg');
  });

  it('should generate GitHub avatar URL when githubUsername is present', () => {
    const user = {
      githubUsername: 'rajgupta04',
    };

    expect(getAvatarSrc(user)).toBe('https://github.com/rajgupta04.png?size=120');
  });

  it('should return clean default SVG when user has no photos or github handle', () => {
    const user = {
      name: 'Raj',
      email: 'raj@example.com',
    };

    const src = getAvatarSrc(user);
    expect(src).toContain('data:image/svg+xml;utf8,<svg');
    expect(src).not.toContain('dicebear');
  });
});
