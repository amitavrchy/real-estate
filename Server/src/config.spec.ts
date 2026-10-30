import { validateEnvironment } from './config.js';

const valid = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a'.repeat(48),
  DATABASE_URL: 'postgresql://haven:password@db:5432/haven',
  CLIENT_ORIGIN: 'https://homes.example.com',
};
describe('production configuration', () => {
  it('rejects missing/placeholder secrets, insecure origins, invalid ports and unsafe proxy trust', () => {
    for (const overrides of [
      { JWT_SECRET: '' },
      { JWT_SECRET: 'replace-with-at-least-32-random-characters' },
      { CLIENT_ORIGIN: '' },
      { CLIENT_ORIGIN: 'http://homes.example.com' },
      { CLIENT_ORIGIN: 'https://homes.example.com/' },
      { DATABASE_URL: 'https://db.example.com' },
      { PORT: '0' },
      { PORT: 'abc' },
      { TRUST_PROXY: 'true' },
      { TRUST_PROXY: '1' },
    ])
      expect(() => validateEnvironment({ ...valid, ...overrides })).toThrow();
  });
  it('allows an explicit trusted proxy and supplies the API port', () => {
    expect(
      validateEnvironment({ ...valid, TRUST_PROXY: '172.30.0.10' }),
    ).toMatchObject({ PORT: 4100 });
  });
});
