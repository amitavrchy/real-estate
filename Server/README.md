# Haven

A residential marketplace using Next.js 16, NestJS 12, Prisma 6 and PostgreSQL 16. All application source, assets, tests, tooling and documentation live in `Clients/` and `Server/`. Only Git metadata and the shared ignore rules remain at the repository root.

From the repository root, with Node.js 22+ and npm installed:

```sh
npm --prefix Server run setup
npm --prefix Server run dev
```

Open http://localhost:3001; the API runs at http://127.0.0.1:4100. Setup installs both apps, generates a local JWT secret, applies migrations and seeds development data. Existing environment files are preserved. A persistent, development-only Postgres is bundled for machines without Docker. Stop the application before running setup.

All demo accounts use `HavenDemo2026!`: `buyer@haven.example`, `alexandra@haven.example`, `james@haven.example`, `sophia@haven.example`, and `admin@haven.example`. Demo seeding and embedded Postgres are blocked when `NODE_ENV=production`.

The marketplace includes public buy/rent discovery with synchronized map/list filters, galleries, floor plans and tours, mortgage estimates, inquiries and viewing requests, buyer accounts, saved homes/searches, collections with notes, reviews, advisor profiles, journal, seller leads, and agent/admin workspaces. [Feature details](docs/PROJECT_OVERVIEW.md) and the [original specification](docs/PROJECT_SPEC.md) describe the retained MVP scope.

To verify the complete release locally, prepare the seed, install Chromium, stop the app, and run:

```sh
npm --prefix Clients exec playwright install chromium
npm --prefix Server run verify
```

Verification starts its own database/API/frontend, builds both applications, checks TypeScript, runs unit/API/browser tests, checks WCAG with axe, enforces mobile Lighthouse budgets, and audits production dependencies. It stops the services it started. Tests require development seed data and must never target a real production database. Browser tests use demo accounts and can leave an inquiry if interrupted. Performance budgets are Home >=90, Property/Search >=70, accessibility >=90.

For deployment, follow [the production runbook](docs/PRODUCTION.md). It includes HTTPS, non-root application containers, database migration, first-admin provisioning, backup/restore and upgrade commands. No hosting account, production domain or real customer credentials are embedded in this repository.

The API exposes `/health`, `/auth`, `/properties`, `/agents`, `/neighborhoods`, `/journal`, `/market`, `/favorites`, `/collections`, `/saved-searches`, `/inquiries`, `/valuation`, `/newsletter` and `/dashboard`. Private routes enforce JWT roles and ownership. Media URLs require HTTPS; supported tour hosts are Matterport, YouTube and Vimeo. Bearer sessions last eight hours. Public forms share atomic database-backed rate limits across API instances; forwarded client IPs are trusted only from explicitly configured proxy addresses. API responses use `no-store`, security headers and request IDs; request logs omit bodies, tokens and query strings.

Email delivery, calendar synchronization, saved-search digests, live chat, collaborative presence and a WebGL development microsite remain optional stretch integrations from the specification. The core MVP records inquiries and subscriptions in the database. Valuation uses the specified illustrative formula. Demo identities, contact details, images, location copy and legal pages must be replaced with the operator's verified content before public brokerage operation.
