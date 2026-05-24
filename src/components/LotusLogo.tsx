interface LotusLogoProps {
  size?: number;
  className?: string;
  variant?: "full" | "icon";
  id?: string;
}

/** Lotus çiçeği — pembe yapraklar, altın merkez, yeşil yaprak */
export function LotusLogo({
  size = 48,
  className = "",
  variant = "full",
  id = "lotus-logo",
}: LotusLogoProps) {

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={variant === "icon"}
    >
      <defs>
        <linearGradient id={`${id}-petal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE4EC" />
          <stop offset="40%" stopColor="#F4A4BC" />
          <stop offset="100%" stopColor="#D97B9A" />
        </linearGradient>
        <linearGradient id={`${id}-petal-deep`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8A0B4" />
          <stop offset="100%" stopColor="#B85C7A" />
        </linearGradient>
        <radialGradient id={`${id}-center`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="50%" stopColor="#F5D76E" />
          <stop offset="100%" stopColor="#D4A84A" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A8C9B4" />
          <stop offset="100%" stopColor="#7BA388" />
        </linearGradient>
      </defs>

      {/* Yapraklar (arka) */}
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(0 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(45 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(90 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(135 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(180 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(225 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(270 32 32)" />
      <ellipse cx="32" cy="18" rx="10" ry="22" fill={`url(#${id}-petal-deep)`} opacity="0.85" transform="rotate(315 32 32)" />

      {/* Orta yapraklar */}
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(22 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(67 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(112 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(157 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(202 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(247 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(292 32 32)" />
      <ellipse cx="32" cy="22" rx="8" ry="16" fill={`url(#${id}-petal)`} transform="rotate(337 32 32)" />

      {/* İç yapraklar */}
      <ellipse cx="32" cy="26" rx="5" ry="10" fill="#FFE4EC" transform="rotate(0 32 32)" />
      <ellipse cx="32" cy="26" rx="5" ry="10" fill="#FFD6E4" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="26" rx="5" ry="10" fill="#FFE4EC" transform="rotate(120 32 32)" />
      <ellipse cx="32" cy="26" rx="5" ry="10" fill="#FFD6E4" transform="rotate(180 32 32)" />
      <ellipse cx="32" cy="26" rx="5" ry="10" fill="#FFE4EC" transform="rotate(240 32 32)" />
      <ellipse cx="32" cy="26" rx="5" ry="10" fill="#FFD6E4" transform="rotate(300 32 32)" />

      {/* Merkez */}
      <circle cx="32" cy="32" r="9" fill={`url(#${id}-center)`} />
      <circle cx="32" cy="32" r="5" fill="#FFF8E7" opacity="0.9" />

      {/* Nilüfer yaprağı */}
      <ellipse cx="32" cy="54" rx="14" ry="5" fill={`url(#${id}-leaf)`} opacity="0.9" />
      <path
        d="M32 38 Q28 48 20 52 Q32 50 32 54 Q32 50 44 52 Q36 48 32 38"
        fill={`url(#${id}-leaf)`}
        opacity="0.75"
      />
    </svg>
  );
}
