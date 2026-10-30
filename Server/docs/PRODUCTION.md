# Production operations

Run these commands from `Server/`. Deployment requires a Linux host with Docker Engine and Compose v2, a domain pointing to that host, and inbound ports 80/443. The included Caddy proxy manages HTTPS certificates. Postgres, the API and the frontend have no public port bindings.

Copy `deploy/production.env.example` to `.env.production`. Set `SITE_HOSTNAME` to the bare hostname, `CERT_EMAIL` to your operational contact, and generate independent random hex values for `DATABASE_PASSWORD` and `JWT_SECRET`:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

The migration service runs `prisma migrate deploy` before the API starts. No demo seeding runs in this stack. Both Node application images run as the unprivileged `node` user with production dependencies/output. Application and database readiness are checked before dependent services start. Next.js public variables are compiled at build time; rebuild the frontend when changing the hostname or public API path.

Only Caddy at `172.30.0.10` is trusted to supply the client IP; the network uses `172.30.0.0/24`. If that subnet conflicts with your host, change the subnet, Caddy IP and API `TRUST_PROXY` together. Do not publish API ports or set proxy trust to `true`. When deploying behind a different load balancer, use only its actual IP/CIDR and configure its forwarded headers according to the hosting provider's documentation. Rate limits are shared through Postgres; concurrent API replicas must use the same JWT signing secret and database.

After startup, check `https://YOUR_HOST/api-health` and `https://YOUR_HOST/api/health`, then create the first real administrator with hidden password input:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml exec api node scripts/create-admin.mjs
```

This command creates a new admin and refuses to overwrite/promote an existing account. Public registration always creates buyers. Provision real agent roles using a controlled database administration process. Add real listings and journal content through the admin workspace. Replace sample contact details, static location text, image references, and demonstration terms/privacy content with verified business content before opening a public brokerage service.

For a managed database or separate Node hosts, build each app in its own directory. Apply migrations from `Server/` using its full build dependencies before starting API replicas. Runtime API variables are `NODE_ENV=production`, `DATABASE_URL`, random `JWT_SECRET` (32+ characters), HTTPS `CLIENT_ORIGIN` without a trailing slash, and optionally `PORT`, `HOST`, `TRUST_PROXY`. The frontend needs `NEXT_PUBLIC_SITE_URL` (HTTPS origin), `NEXT_PUBLIC_API_URL` (`/api` behind the supplied proxy, or an HTTPS API origin) at build time and `API_URL` for private server-to-server API access at runtime. Start the API with `node dist/main.js`; start the frontend with `npm start` or its standalone container. A reverse proxy must route `/api/*` to the API with the `/api` prefix removed.

## Backup, restore and upgrades

Keep encrypted database backups outside the Docker host. In a Linux shell, a backup can be taken without putting the database password on the command line:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres pg_dump -U haven -d haven -Fc > haven-backup.dump
```

Test restores on a separate database before relying on the backup. To restore into a freshly created, empty destination database named `haven_restore`:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres createdb -U haven haven_restore
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres pg_restore -U haven -d haven_restore --no-owner --no-acl < haven-backup.dump
```

For an upgrade, take and verify a backup, pull the reviewed Git commit, build new images, then explicitly run migration before updating services:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 api web
```

Do not use `down -v` on the production stack: named volumes hold database records and certificates. For an application rollback, rebuild the previous compatible Git revision; database migrations are not automatically reversed. Restore a verified backup to a separate database if schema/data recovery is required. Monitor both health URLs and container restarts, protect `.env.production`, and rotate credentials through your hosting secret manager. Database-backed throttle keys contain HMACs and expire after one minute; stale records are cleaned by subsequent public write requests. Set host log retention; the included Compose file rotates container logs.

## Scope and verification limits

This release ships the specified MVP. Inquiry/viewing requests and newsletter signups persist; external mail delivery, calendar sync, saved-search digests, live chat, presence and the development microsite are optional stretch features. Mortgage/valuation and neighborhood scores remain explicitly illustrative.

Read [VALIDATION.md](VALIDATION.md) for the recorded checks and environment limitations. A local test pass does not verify a host's DNS, certificates, firewall, backups or production credentials; validate those on the actual deployment host.
