/**
 * Generate a URL-safe invite code for family group sharing.
 * Uses crypto.getRandomValues for security.
 */
export function generateInviteCode(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}
