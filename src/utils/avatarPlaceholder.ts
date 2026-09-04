/**
 * Local, privacy-safe avatar placeholders.
 * Replaces external services (via.placeholder.com / ui-avatars.com):
 * no third-party requests, no IP leakage, instant render (data URI).
 */

const PALETTE = ["0D8ABC", "426E5B", "7C5CBF", "C2554F", "B7791F", "2C7A7B"] as const;

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function initialsOf(name = ""): string {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic colored SVG avatar with initials (data URI, zero network). */
export function avatarPlaceholder(name = "", size = 150): string {
  const clean = String(name || "").trim();
  const initials = initialsOf(clean) || "?";
  const bg = PALETTE[hashName(clean || "?") % PALETTE.length];
  const fontSize = Math.round(size * 0.4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#${bg}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#fff" font-weight="600">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Generic grey placeholder (no name available). */
export function genericPlaceholder(size = 150): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#9aa5a0"/><circle cx="${size / 2}" cy="${size * 0.38}" r="${size * 0.16}" fill="#e8edea"/><ellipse cx="${size / 2}" cy="${size * 0.82}" rx="${size * 0.3}" ry="${size * 0.18}" fill="#e8edea"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
