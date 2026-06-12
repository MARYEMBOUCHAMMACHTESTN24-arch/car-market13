import { useEffect, useState } from 'react';

const normalizeAvatarSrc = (src) => {
  if (!src) return '';
  const cleanSrc = String(src).trim();
  if (!cleanSrc) return '';
  if (/^(https?:|data:|blob:)/i.test(cleanSrc)) return cleanSrc;
  return cleanSrc.startsWith('/') ? cleanSrc : `/${cleanSrc}`;
};

export const getUserAvatarSrc = (user) => normalizeAvatarSrc(user?.profile_image_url || user?.profile_image);

export const getUserInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const UserAvatar = ({
  user,
  src,
  sizeClass = 'w-9 h-9',
  roundedClass = 'rounded-full',
  className = '',
  textClass = 'text-sm',
  alt,
}) => {
  const imageSrc = normalizeAvatarSrc(src) || getUserAvatarSrc(user);
  const name = user?.name || 'User';
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    if (imageSrc) {
      console.log('[profile avatar] image url', imageSrc);
    }
  }, [imageSrc]);

  if (imageSrc && !imageFailed) {
    return (
      <img
        src={imageSrc}
        alt={alt || name}
        onError={() => {
          console.warn('[profile avatar] failed to load image', imageSrc);
          setImageFailed(true);
        }}
        className={`${sizeClass} ${roundedClass} object-cover bg-slate-800 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={alt || name}
      className={`${sizeClass} ${roundedClass} bg-slate-800 border border-slate-700/70 text-[#5eead4] flex items-center justify-center font-bold uppercase ${textClass} ${className}`}
    >
      {getUserInitials(name)}
    </div>
  );
};

export default UserAvatar;
