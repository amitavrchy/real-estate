export function validateEnvironment(env: Record<string, unknown>) {
  const production = env.NODE_ENV === 'production';
  const secret = String(env.JWT_SECRET ?? '');
  if (secret.length < 32 || /^(replace|change|example)/i.test(secret))
    throw new Error('JWT_SECRET must contain at least 32 random characters.');
  const database = new URL(String(env.DATABASE_URL ?? ''));
  if (!['postgres:', 'postgresql:'].includes(database.protocol))
    throw new Error('DATABASE_URL must use PostgreSQL.');
  const origin = String(
    env.CLIENT_ORIGIN ?? (production ? '' : 'http://localhost:3001'),
  );
  const client = new URL(origin);
  if (
    client.origin !== origin ||
    !['http:', 'https:'].includes(client.protocol)
  )
    throw new Error(
      'CLIENT_ORIGIN must be a single origin without a trailing slash.',
    );
  if (production && client.protocol !== 'https:')
    throw new Error('CLIENT_ORIGIN must use HTTPS in production.');
  const port = Number(env.PORT ?? 4100);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be between 1 and 65535.');
  // Trust only explicitly configured proxy addresses, never all forwarded headers.
  const proxy = String(env.TRUST_PROXY ?? '').trim();
  if (/^(true|\d+)$/i.test(proxy))
    throw new Error(
      'TRUST_PROXY must contain trusted proxy IPs/CIDRs, not true or a hop count.',
    );
  return { ...env, CLIENT_ORIGIN: origin, PORT: port };
}
