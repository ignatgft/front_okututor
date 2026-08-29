import "../../styles/ui.css";

function initialsOf(name = "") {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, src, alt, size = 40, className = "", fallbackIcon }) {
  if (src) {
    return (
      <img
        className={`avatar ${className}`}
        src={src}
        alt={alt || name || ""}
        width={size}
        height={size}
        loading="lazy"
      />
    );
  }
  const initials = initialsOf(name);
  return (
    <span
      className={`avatar avatar-fallback ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      role="img"
      aria-label={alt || name || ""}
    >
      {initials || fallbackIcon || "?"}
    </span>
  );
}

export default Avatar;
