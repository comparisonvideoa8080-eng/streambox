# StreamBox

A small video portal with:
- A public page that asks for location permission, then plays the video.
- The site logs each visit's **IP address** (always) and **location** (only if the visitor clicks Allow) to `data/visits.json`.
- An **admin panel** at `/admin` (login required) to view those logs.

The consent popup on the site tells visitors their IP and location may be recorded — update the wording in `public/index.html` if you need different language for your audience/jurisdiction.

## Run locally

```bash
npm install
node server.js
```

Then open:
- Site: http://localhost:3000
- Admin: http://localhost:3000/admin

Default admin login: `admin` / `changeme123` — **change this before deploying** (see below).

## Configuration (environment variables)

| Variable | Purpose | Default |
|---|---|---|
| `ADMIN_USER` | Admin panel username | `admin` |
| `ADMIN_PASS` | Admin panel password | `changeme123` |
| `SESSION_SECRET` | Random string used to sign the login session | insecure default — change it |
| `PORT` | Port the server listens on | `3000` |

Set them before starting, e.g.:

```bash
ADMIN_USER=you ADMIN_PASS=your-strong-password SESSION_SECRET=some-random-string node server.js
```

## Deploying

This is a plain Node/Express app, so it runs on Render, Railway, Fly.io, a VPS, etc.

1. Upload this whole folder.
2. Set the environment variables above (especially `ADMIN_PASS` and `SESSION_SECRET`).
3. Start command: `node server.js`.
4. If you put it behind a reverse proxy/load balancer (common on most hosts), the app already reads `x-forwarded-for` for the visitor's real IP.

## Data storage

Visits are stored in `data/visits.json` (capped at the most recent 5000 entries). This is fine for small/personal use. For heavier traffic, swap `loadVisits`/`saveVisits` in `server.js` for a real database (e.g. SQLite or Postgres).

## Legal note

Collecting IP addresses and precise location data is regulated in many places (e.g. GDPR, CCPA). This app discloses the collection in the consent popup, but you are responsible for making sure your actual use (what you store, how long, who sees it, what you do with it) complies with the laws that apply to your visitors.
