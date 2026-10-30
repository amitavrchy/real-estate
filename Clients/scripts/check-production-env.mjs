const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'invalid');
if (site.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(site.hostname))
  throw new Error('Set NEXT_PUBLIC_SITE_URL to the real HTTPS site origin before building for deployment.');
if (site.origin !== process.env.NEXT_PUBLIC_SITE_URL)
  throw new Error('NEXT_PUBLIC_SITE_URL must be an origin without a trailing slash.');
const api = process.env.NEXT_PUBLIC_API_URL;
if (api !== '/api' && (!api || new URL(api).protocol !== 'https:'))
  throw new Error('NEXT_PUBLIC_API_URL must be /api or an HTTPS API URL.');
