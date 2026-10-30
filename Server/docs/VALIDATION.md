# Release validation — 2026-10-30

Verified on the Windows workspace with Node.js 24.18.0 and local PostgreSQL 16. The deployment images target Node.js 22 on Debian; their Docker build/run still needs verification on a Docker host.

| Check | Result |
| --- | --- |
| API and client TypeScript | Passed |
| NestJS production build | Passed |
| Next.js standalone production build/start | Passed |
| Unit tests | 3 passed |
| API integration tests | 12 passed |
| Browser tests | 10 passed |
| Home/Property/Team automated WCAG checks | No axe violations |
| Production dependency audits | 0 known vulnerabilities in either app |
| Compose YAML parsing and internal port isolation | Passed |
| Caddy native configuration validation | Passed |
| Real Docker image build / Compose startup | Not run: Docker is unavailable on this machine |
| Public DNS / HTTPS certificate issuance / live host | Not run: no deployment host/domain credentials supplied |

The production browser suite includes responsive layouts, command search, URL filters, ordering, map/list hover synchronization, authentication, saved-home reload persistence, saved searches, collection notes, gallery keyboard controls, mortgage input, inquiry delivery and agent listing creation/editing. A release smoke test verifies WebP image optimization, a bounded image response and frontend security headers.

The UI follow-up also verifies the styled Home price/bedroom dropdowns with pointer and keyboard selection, Escape/Tab/outside dismissal, mutually exclusive menus, rental-price resets and submitted filter values. Dropdowns and the expanded advisor page fit 360px, 390px, 768px and desktop widths. Advisor links and keyboard-operated FAQ disclosures work. Team-only styles load with the advisor directory route; shared buttons, forms, cards and panels use consistent radius tokens.

API tests cover role escalation, invalid and oversized input, Unicode password byte limits, token/ownership boundaries, private listing visibility (including previously saved homes and collections), persistence, inquiry isolation, journals/reviews, shared atomic rate limits across guard instances and normalized route casing. The final API rerun also passed a concurrent media-deletion regression: an active listing keeps at least one image. Publishing and media removal lock the same listing row inside a transaction.

Mobile Lighthouse measurements against the standalone build:

| Page | Performance | Accessibility | Best practices | SEO | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 93 | 100 | 100 | 100 | 0 |
| Property | 88 | 100 | 100 | 100 | 0 |
| Search | 80 | 100 | 100 | 100 | 0 |

These meet the enforced budgets: Home performance >=90, Property/Search >=70, accessibility >=90. Lighthouse varies with CPU/network load; measurements describe this run, not a universal performance guarantee. Raw reports and service logs are intentionally ignored under `Clients/test-results/` and `Server/test-results/`.

Run `npm --prefix Server run verify` from the repository root to reproduce the local checks after setup and Chromium installation. It requires the development demo seed and refuses an environment labeled production. Only the services started by the runner are stopped during cleanup; a pre-existing database is left running.

Source organization is `Clients/` and `Server/`, with only shared Git ignore rules at the root. Production secrets, database files, generated output, reports and caches are excluded from version control and Docker contexts. See [PRODUCTION.md](PRODUCTION.md) for deployment and operational requirements, including replacing demonstration business content and testing backups on the real host.
