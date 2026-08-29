/**
 * Mask email for display: "i***@gmail.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 1) return `*${email.slice(1)}@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}@${domain}`;
}