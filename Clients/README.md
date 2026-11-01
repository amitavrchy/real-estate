# Haven Client

**Frontend:** [https://haven-residence.netlify.app](https://haven-residence.netlify.app)

**Backend API:** [https://haven-api-17km.onrender.com](https://haven-api-17km.onrender.com)

See the [project README](../README.md) for setup, demo accounts, and deployment. From the repository root, `npm --prefix Server run setup` prepares both apps and `npm --prefix Server run dev` starts them. The client reads `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`.

Next.js App Router and TypeScript, with Redux Toolkit for session/UI/favorites, React Query for server data, axios for HTTP, React Hook Form and Zod for forms, Framer Motion for animation, Embla for carousels, and lazy-loaded React Leaflet maps.

- `src/app`: routes, server metadata, structured data, sitemap, and robots.
- `src/components`: reusable product experiences, dialogs, layout, and the image fallback.
- `src/store`: Redux auth, favorites, UI, and search-map state.
- `src/lib`: typed API contracts, HTTP client, formatters, and server fetching.
- `e2e`: browser journeys, typography/mobile checks, and axe accessibility tests.

```sh
npm run dev
npm run build
npm run typecheck
npm run test:e2e
npm run test:performance
```

The browser tests require the seeded API to be running. `npm start` serves the standalone production build and copies its public/static assets first. Lighthouse measures that production client and writes ignored reports under `test-results/`. It fails when the documented performance or accessibility budgets are missed. See the [production runbook](../Server/docs/PRODUCTION.md) for the non-root frontend image, same-origin API proxy and required build variables.
