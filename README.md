<div align="center">

# 🇩🇿 الجزائر خضراء · Algeria Green

**نغرس اليوم، نبني غدًا. — Plant Today. Build Tomorrow.**

A community digital platform for contributing to tree-planting initiatives across Algeria
and tracking their verified impact.

</div>

---

> **Independent initiative.** Algeria Green is not a government body, does not represent any
> ministry or official institution, and is not a certified environmental register. It handles
> no monetary donations.

## Overview

Citizens can join organised planting campaigns *or* record a tree they planted on their own,
with no campaign involved. Every submission is reviewed before it counts, so the public
figures describe verified reality rather than intent.

```
Discover  →  Join or Plant  →  Submit  →  Verification  →  Impact
```

### No demo data

The database ships empty apart from reference tables (Algeria's 58 wilayas and a list of
tree species). There are no seeded users, campaigns, trees, participants or notifications,
and no hardcoded statistics anywhere in the UI. An empty database renders `0` and a polished
empty state — never an invented number or a fabricated chart.

## Features

**For citizens**
- Register, sign in, manage a profile and its public visibility
- Browse campaigns with server-side search, wilaya/status/date filters, sorting and pagination
- Join a campaign (a unique constraint makes double-joining impossible) and check in by QR code
- Record a tree individually or against a campaign, with optional photo and approximate location
- Personal dashboard: my trees, my campaigns, attendance, notifications
- Public page and QR code for every verified tree, at `/tree/DZG-TREE-XXXXXXXX`

**For administrators**
- Real-time overview: users, campaigns, trees, pending reviews, verified/rejected, wilaya coverage
- Create, edit, publish, cancel, complete and archive campaigns; per-campaign attendance QR
- Review queue: approve, reject or request a correction, with a recorded reason
- User management with suspension, reactivation and role assignment
- Append-only audit log of every sensitive operation

**Everywhere**
- Arabic (RTL, default), French and English, from one set of pages
- Installable PWA with a real service worker, offline fallback and cached public content
- Map of verified trees and campaigns with grid clustering and deliberately coarse coordinates
- Impact charts computed from the database, never fabricated

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Components, Server Actions) |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4 with CSS-variable design tokens, light/dark, RTL-aware |
| Components | shadcn/ui-style primitives on Radix UI, Lucide icons |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Validation | Zod |
| Auth | First-party sessions: scrypt password hashing, DB-backed sessions, HttpOnly cookies |
| Maps | Leaflet + OpenStreetMap (no API key required) |
| Charts | Recharts |
| Storage | Vercel Blob (local disk fallback in development) |
| Testing | Vitest (unit + integration), Playwright (end-to-end) |
| Hosting | Vercel |

## Architecture

```
src/
├── app/
│   ├── [locale]/            # every page; the locale segment is the root layout
│   │   ├── campaigns/       # list + detail
│   │   ├── plant/           # individual and campaign tree submission
│   │   ├── impact/  map/  wilayas/  tree/  profile/  attendance/
│   │   ├── dashboard/       # signed-in area (guarded server-side)
│   │   └── admin/           # moderation + administration (guarded server-side)
│   ├── api/health/          # liveness + database connectivity
│   ├── manifest.ts  robots.ts  sitemap.ts  global-error.tsx
│
├── components/
│   ├── ui/                  # design-system primitives
│   ├── shell/               # header, footer, mobile tab bar, language + theme switches
│   ├── campaigns/  trees/  admin/  dashboard/  map/  impact/  auth/  pwa/  shared/
│
├── lib/
│   ├── auth/                # password hashing, sessions, current user, mail
│   ├── db/                  # Prisma client singleton
│   ├── permissions/         # role ranks, permission checks, escalation guards
│   ├── security/            # tokens, public IDs, coordinate coarsening, rate limit, storage
│   ├── validation/          # Zod schemas
│   └── reference/           # the 58 wilayas and the species list
│
├── services/                # campaign, tree, user, notification, analytics, audit, auth
├── server/actions/          # "use server" entry points; every one re-checks authorisation
├── i18n/                    # locales, catalogues, formatting, client translator hook
└── generated/prisma/        # generated client (git-ignored)

prisma/schema.prisma         # 11 models, indexed and constrained
```

**Layering rule.** Pages and server actions never query the database directly for domain
logic; they call a service. Services own transactions and are the only place that writes.

## Installation

Requirements: Node.js 20+ (24 recommended), Docker (or any PostgreSQL 14+).

```bash
git clone https://github.com/Medbelkacem/algeria-green.git
cd algeria-green
npm install

cp .env.example .env        # then fill in DATABASE_URL and AUTH_SECRET
docker compose up -d        # PostgreSQL on localhost:5434

npm run db:migrate          # apply migrations
npm run db:seed             # reference data only — no demo content
npm run dev                 # http://localhost:3000
```

`npm install` runs `prisma generate` automatically.

## Environment variables

Names only — never commit values. See `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (pooled) |
| `DIRECT_DATABASE_URL` | with a pooler | Unpooled connection used by `prisma migrate` |
| `AUTH_SECRET` | yes in production | Server-side security material. `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin, used for canonical URLs, sitemap and QR links |
| `BLOB_READ_WRITE_TOKEN` | for uploads | Vercel Blob token. Without it, production uploads are refused with a clear message rather than failing silently |
| `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` / `ADMIN_BOOTSTRAP_NAME` | bootstrap only | Consumed by `npm run bootstrap:admin`, never by the running app |
| `EMAIL_FROM`, `SMTP_URL` | optional | When unset, verification and reset links are logged server-side instead of being emailed. No message is ever silently dropped |
| `NEXT_PUBLIC_MAP_TILE_URL`, `NEXT_PUBLIC_MAP_ATTRIBUTION` | optional | Override the default OpenStreetMap tiles |

## Database

Eleven models: `User`, `Session`, `VerificationToken`, `RateLimit`, `Wilaya`, `TreeSpecies`,
`Campaign`, `CampaignParticipant`, `Tree`, `TreeVerification`, `Notification`, `AuditLog`.

Indexes cover the access patterns that matter — `Campaign.status`, `Campaign.wilayaId`,
`Campaign.date`, `Tree.status`, `Tree.wilayaId`, `Tree.campaignId`, `Tree.userId`, and both
sides of `CampaignParticipant`. A unique constraint on `(campaignId, userId)` is what
actually prevents a duplicate join under concurrency.

```bash
npm run db:migrate     # create + apply a migration in development
npm run db:deploy      # apply pending migrations (production-safe)
npm run db:seed        # idempotent reference data
npm run db:studio      # browse
```

`prisma migrate reset` is never run against production.

### First administrator

There is no public endpoint that can grant `ADMIN`. The first account is created from the
command line, with credentials read from the environment so they stay out of shell history:

```bash
ADMIN_BOOTSTRAP_EMAIL=you@example.dz \
ADMIN_BOOTSTRAP_PASSWORD='a-strong-password-1' \
ADMIN_BOOTSTRAP_NAME='Your Name' \
npm run bootstrap:admin
```

## Development

```bash
npm run dev          # dev server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest: unit + integration
npm run test:e2e     # Playwright end-to-end
npm run build        # production build
npm run start        # serve the build
```

## Testing

- **Unit** — progress calculation, password hashing, permission and escalation rules,
  coordinate coarsening, every Zod schema, upload magic-number sniffing, translation-key
  parity across the three locales, public-ID generation.
- **Integration** — run against a dedicated `dzgreen_test` database: registration, sign-in,
  suspension, campaign creation, joining (including the duplicate and capacity paths),
  attendance, tree submission, approval, rejection, correction, progress recomputation,
  and what a public page is allowed to expose.
- **End-to-end** — the full journey on a production build: admin publishes a campaign →
  citizen registers → joins → submits a tree → sees `PENDING` → admin approves → citizen sees
  `VERIFIED` → campaign progress moves. Plus authorisation, localisation, 404 behaviour, the
  PWA manifest, and responsive checks from 320 px upward.

The suites never touch development data.

## Security

- **Passwords** — scrypt (N=32768, r=8, p=1) with a random 16-byte salt and constant-time
  comparison. Hashes are versioned so parameters can be raised later.
- **Sessions** — random 32-byte tokens; only the SHA-256 hash is stored. HttpOnly, `SameSite=Lax`,
  `Secure` in production, 30-day sliding expiry. Suspension, role change and password change
  all invalidate every session immediately.
- **Authorisation** — enforced in server actions and page components, never in client code.
  The locale proxy performs no authorisation, so bypassing it grants nothing. An administrator
  cannot promote themselves, assign a role at or above their own rank, or act on a peer.
- **Rate limiting** — Postgres-backed fixed windows on registration, sign-in (per address *and*
  per account), password reset, verification resend, campaign joins, attendance and submissions.
- **Uploads** — size cap, allow-listed MIME types, extension check, magic-number sniff, and a
  mandatory re-encode through sharp that strips EXIF (including the GPS tags a phone writes).
  Filenames are generated server-side; the user-supplied name never reaches a path.
- **Privacy** — exact coordinates never leave the server. Public maps and tree pages show
  coordinates rounded to ~1 km, or the wilaya centroid. Public surfaces expose no email, phone,
  address or authentication data. Contributors can publish anonymously or hide their profile.
- **Identifiers** — trees are addressed publicly by an unguessable `DZG-TREE-XXXXXXXX` code.
  Database IDs are never exposed.
- **Other** — Zod validates every input including search parameters; redirect targets must be
  relative and same-origin; error pages show a digest, never a stack trace; security headers are
  set in `next.config.ts`; the audit log is append-only from the application's perspective.

## PWA

- Web manifest with maskable icons, shortcuts, `standalone` display and theme colours
- A hand-written service worker: precached shell, network-first navigations (so statistics stay
  fresh), cache-first immutable build assets, stale-while-revalidate images with size caps
- Per-locale offline fallback pages; `/dashboard` and `/admin` are never cached, and the page
  cache is dropped on sign-out
- Install prompt shown only when the browser actually offers one — nothing is simulated

**Offline honesty.** Submissions are never queued or replayed. If the network is unavailable the
form is disabled and says so; the app never reports success for work that did not reach the server.

## Internationalisation

Arabic (RTL, default), French and English share one set of pages — no duplicated routes. All
434 strings live in `src/i18n/messages/*.json`, and a test fails the build if the three
catalogues ever drift apart. Switching language changes direction, layout, navigation, forms,
dates, number formatting and metadata. A translator function cannot cross the server/client
boundary, so client components receive the locale and build their own via `useTranslator`.

## Deployment

The project deploys to Vercel from `main`. Before promoting a build:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Set `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` and
`BLOB_READ_WRITE_TOKEN` in the Vercel project, then apply migrations with `npm run db:deploy`
against the production database.

## Accessibility

Semantic landmarks, a skip link, labelled form controls, visible focus rings, `aria-invalid`
and `role="alert"` on validation errors, status conveyed by icon *and* text rather than colour
alone, 44 px minimum touch targets, and `prefers-reduced-motion` respected throughout.

## Licence

MIT.
