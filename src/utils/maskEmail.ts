export function maskEmail(email: unknown): string {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  const local = parts[0] as string | undefined;
  const domain = parts[1] as string | undefined;
  if (!domain) return email;
  if (!local || local.length <= 1) return `*@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}@${domain}`;
}
