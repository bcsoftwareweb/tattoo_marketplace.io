# BLACKLINE

Frontend-only demo of a New York tattoo artist marketplace. Customers, artists, and administrators share one sign-in page. Bookings, messages, and payments stay in the browser.

## Demo accounts

These are simulated accounts, not real people.

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer@demo.com | Demo123! |
| Artist | artist@demo.com | Demo123! |
| Administrator | admin@demo.com | Demo123! |

The sign-in shortcuts fill the form. The role is chosen from the email, not from a dropdown.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
npm run build
```

## GitHub Pages

The live site is a static export. GitHub Pages is set to **Deploy from a branch**: `main`, folder `/docs`.

```bash
npm run build:pages
```

That command builds with the `/tattoo_marketplace.io` base path and copies the site into `docs/`. Commit `docs/` with the source. GitHub Actions (`.github/workflows/test.yml`) runs lint, unit tests, and a production build. It does not deploy. Pages publishes the `docs` folder on `main`.

## Routes

- `/` public marketplace
- `/artists` and `/artists/[slug]`
- `/login`
- `/customer` bookings, messages, favorites, profile
- `/artist` profile, portfolio, services, calendar, bookings, messages, earnings
- `/admin` artists, customers, bookings, finance, marketplace, settings
- `/checkout` simulated deposit

## Limits

No server, database, real authentication, Stripe, email, or chat provider. Reset demo data from the account menu or profile settings.
