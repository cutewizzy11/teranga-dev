# Teranga Dev

**The help network for African developers — in English and French.**

CADEV 2026 project (Africa Cup of Developers) — theme: *"Build the African exchange platform, for devs, by devs."*

## The problem

Africa has hundreds of thousands of developers, but language splits them in two: a developer in Lagos and one in Dakar solve the same problems (mobile payments, slow networks, low-end phones) without ever reading each other's answers. Global platforms are English-only and ignore local realities such as Paystack, M-Pesa, Wave, Orange Money and 2G/3G networks.

## The solution

| Feature | What it does |
|---|---|
| **Bilingual Q&A** | Every question and answer is translated automatically between English and French. Readers see their own language, with "Show original" one click away. **Code is never altered** by translation. |
| **Reputation** | Votes and accepted answers build a public reputation — a verifiable portfolio. |
| **Credit exchange** | An accepted answer earns credits. Credits book a mentoring or pair-programming session with another developer (held in escrow, paid on completion, refunded if declined). |
| **Country leaderboard** | Pan-African and per-country rankings — we code for the flag too. |
| **Built for Africa** | Server-rendered pages with very little JavaScript: works on slow networks and low-end phones. Votes and forms work even without JavaScript. |

## Demo

- Demo account: `demo@teranga.dev` / `Demo2026!`
- Demo data: 12 developers from 7 countries (6 from Nigeria) and 11 real-world questions — Paystack webhooks, Paystack vs Flutterwave, offline-first sync through power cuts, +234 phone numbers, Hausa/Yoruba/Igbo speech recognition, M-Pesa, React, Flutter, Laravel, Go.

## Architecture

```
Browser ──► Next.js 16 (App Router, Server Components, Server Actions)
              │
              ├─ src/lib/auth.ts        Data Access Layer: session → current user
              ├─ src/lib/session.ts     Signed JWT session cookie (HS256), httpOnly, SameSite=Lax
              ├─ src/server/services.ts Transactional business rules (votes, accepted answers, escrow)
              ├─ src/server/rules.ts    Reputation and credit economy (one file, easy to explain)
              ├─ src/server/queries.ts  Reads (lists, question page, profiles, leaderboards)
              └─ src/lib/translate.ts   EN⇄FR translation (Claude API, structured JSON output)
              │
              ▼
         PostgreSQL (Drizzle ORM) — embedded PGlite locally, Systalink managed PostgreSQL in production
```

**Key technical choices**

- **Credit integrity:** every movement runs in a transaction; the debit is a conditional update (`credits >= amount`), so a balance can never go negative, even with simultaneous requests (tested). An append-only `credit_ledger` records every movement. A database `CHECK (credits >= 0)` is the last safety net.
- **Session state machine:** `pending → accepted → completed`, or `declined/cancelled` with a refund. Every transition checks the user's role (mentor or requester).
- **Votes:** one vote per user per post (composite primary key), changeable or removable; score and reputation are updated in the same transaction. You cannot vote on your own posts.
- **Asynchronous translation:** translation runs with `after()`, *after* the HTTP response is sent — posting never depends on the API. Translations are cached in the database (one row per post per language). Without an API key the app still works and shows the original.
- **Security:**
  - bcrypt password hashing (cost 12) and constant-time login (no email enumeration).
  - Rate limits on sign-up, login, posting and voting.
  - Every input validated server-side with Zod.
  - Markdown rendered without raw HTML, then sanitized (`rehype-sanitize`): no XSS; links use `rel="nofollow noopener noreferrer"`.
  - Post-login redirects limited to internal paths (no open redirect).
  - Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
  - Translated content is treated as data, never as instructions (dedicated system prompt).

## Run locally

```bash
npm install
npm run setup     # migrations + demo data (embedded PGlite database in ./.data)
npm run dev       # http://localhost:3000
```

No PostgreSQL or Docker installation is needed locally. To enable automatic translation, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`.

```bash
npm test          # business-rule tests on a real in-memory Postgres
npm run typecheck
npm run lint
```

## Deployment (Systalink Datacloud)

Products used: **Cloud server** (the app, as a Docker image) + managed **PostgreSQL database**.

```bash
# 1. Run migrations against the managed database (from a machine with network access)
DATABASE_URL=postgres://... DATABASE_SSL=no-verify npm run db:migrate
DATABASE_URL=postgres://... npm run db:seed   # optional: demo data

# 2. Docker image on the cloud server
docker build -t teranga-dev .
docker run -d --restart unless-stopped -p 80:3000 \
  -e DATABASE_URL=... -e DATABASE_SSL=no-verify \
  -e SESSION_SECRET=... -e ANTHROPIC_API_KEY=... \
  teranga-dev
```

`GET /api/health` checks the app and the database (used by the Docker `HEALTHCHECK`).

## Declarations (CADEV rules, Article 6)

### Third-party components and licences

Every shipped dependency uses a permissive licence. Main direct dependencies:

| Component | Licence | Role |
|---|---|---|
| next, react, react-dom | MIT | Web framework |
| drizzle-orm | Apache-2.0 | ORM / typed SQL queries |
| pg | MIT | PostgreSQL driver |
| @electric-sql/pglite | Apache-2.0 / PostgreSQL | Embedded Postgres (development and tests) |
| zod | MIT | Validation |
| bcryptjs | MIT | Password hashing |
| jose | MIT | Session cookie signing (JWT) |
| @anthropic-ai/sdk | MIT | Translation API client |
| react-markdown, remark-gfm, rehype-sanitize, rehype-highlight | MIT | Safe Markdown rendering + code highlighting |
| tailwindcss | MIT | Styling |
| Dev tools: typescript (Apache-2.0), vitest (MIT), drizzle-kit (MIT), tsx (MIT), eslint (MIT) | | Not shipped to production |

Full audit of the 221 production packages: MIT, Apache-2.0, ISC, BSD, 0BSD, Unlicense, CC-BY-4.0 (caniuse data). **No GPL/AGPL/LGPL component is shipped:** `sharp`/libvips (LGPL), an *optional* Next.js dependency, is not used (`images.unoptimized`) and is removed from the Docker image.

The Claude API (Anthropic) is a remote service called over HTTPS; no restrictively licensed code is included.

### Pre-existing code

None. The project was created entirely during the competition.

### Use of artificial intelligence

- **Tool:** Claude Code (Anthropic) as a programming assistant.
- **Parts concerned:** initial generation of the project structure, database schema, business services, pages and tests, followed by review and iteration by the team.
- **In the product:** the Claude API translates content between English and French (`src/lib/translate.ts`).
- The team understands and can explain all of the code (see *Architecture*).

## Team

**Telnora** — "Commit and Pray" · representing 🇳🇬 Nigeria

| Member | Role |
|---|---|
| Paul Anyebe | Lead developer |
| John Anyebe | Product & pitch |
| Sophia ([@Eloho1994](https://github.com/Eloho1994)) | Product & pitch |
