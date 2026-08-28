// Secure SHA-256 password hashing utility for Online Learning accounts
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hashedPassword?: string): Promise<boolean> {
  if (!hashedPassword) return false;
  // If plain text stored for legacy, fallback comparison
  const computedHash = await hashPassword(password);
  return computedHash === hashedPassword || password === hashedPassword;
}
