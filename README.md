# Voyager Logs

Voyager Logs is a full-stack personal vlog platform built with Next.js App Router, Prisma, PostgreSQL, JWT cookie auth, and Cloudinary uploads.

## Project Overview
- Public vlog pages with search, tags, pagination, SEO-friendly slugs
- User auth (register/login/logout), likes, comments, bookmarks
- Admin dashboard for post and comment management
- API handlers under `src/app/api/*` (Node runtime)
- Rich markdown content formatting for blog posts

## Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers (Node.js runtime)
- Database: PostgreSQL + Prisma ORM
- Auth: JWT access/refresh cookies (`httpOnly`)
- Media: Cloudinary signed upload flow
- Content rendering: `react-markdown`

## Recommended Project Structure
```text
src/
  app/
  components/
  lib/
prisma/
public/
```

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:studio`

## Local Development
1. Install dependencies:
```bash
npm install
```
2. Create a local env file:
```bash
New-Item .env.local
```
3. Set local database URL and secrets in `.env.local`.
4. Generate Prisma client:
```bash
npx prisma generate
```
5. Run migrations:
```bash
npx prisma migrate dev --name init
```
6. Start app:
```bash
npm run dev
```

## Environment Variables
Required keys:
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_API_KEY`
- `VIEW_HASH_SALT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

Never commit real secrets. `.env*` is ignored by `.gitignore`.

## Production Database (Neon or Supabase)
1. Create a managed PostgreSQL project in Neon or Supabase.
2. Copy pooled connection string into `DATABASE_URL`.
3. In CI/CD or release pipeline run:
```bash
npx prisma migrate deploy
npx prisma generate
```
4. Confirm indexes/migrations exist:
```bash
npx prisma migrate status
```

Notes:
- Prisma client is instantiated as a singleton in `src/lib/prisma.ts`.
- Current schema includes indexes for tags, publish/date sorting, title, and trigram search migration.

## Cloudinary Upload Security
Current upload flow (`POST /api/admin/uploads`):
- admin-only endpoint
- validates file type (`jpg`, `jpeg`, `png`, `webp`)
- validates max file size (5MB)
- server-generated signed upload request to Cloudinary

## Production Build Verification
Run before deploy:
```bash
npm run lint
npm run build
npm run start
```

If build fails, check:
- missing env vars
- database connectivity
- Prisma migrations not applied

## Deploy on Vercel
1. Push repository to GitHub.
2. Import repo in Vercel.
3. Framework preset: Next.js.
4. Build command: `npm run build`
5. Install command: `npm install`
6. Add all required env vars in Vercel Project Settings.
7. Set `DATABASE_URL` to Neon/Supabase production URL.
8. Deploy.
9. Run `prisma migrate deploy` in CI or release job.

## Public URL Strategy
- Recommended: Vercel domain (`https://voyager-logs.vercel.app`) or custom domain.
- GitHub Pages (`username.github.io/...`) is static-only and does not support Next.js server APIs, auth cookies, or Prisma-backed routes.

Use Vercel for this full-stack app.

## Performance Baseline
Already implemented:
- server-side pagination in DB queries
- API list caching with stale windows
- Prisma indexes for common filters/sort
- route-level rate limiting

Recommended production tuning:
- managed Postgres pooling (Neon/Supabase pooler or PgBouncer)
- Vercel Image Optimization and lazy-loaded thumbnails
- keep `LIMIT/OFFSET` or migrate heavy feeds to cursor pagination

## Monitoring
Current:
- structured JSON logs in route wrapper (`src/lib/http/route.ts`)

Optional:
- add Sentry DSN and capture API/runtime exceptions
- add uptime monitor to `/api/health`

## Content Formatting (Markdown)

Blog posts support **Markdown formatting** for rich, professional content.

**For content creators:**
- Write posts using markdown syntax
- See formatted output when published
- Syntax guide available in the post editor

**Supported features:**
- Headings (# through ###)
- Bold, italic, combined emphasis
- Unordered and ordered lists
- Code blocks with syntax highlighting
- Blockquotes
- Links
- Horizontal rules

The post editor includes a compact markdown syntax guide.

## How To Review
1. Register user and login.
2. Promote account to `ADMIN` (Prisma Studio or SQL), then re-login.
3. Create post with thumbnail upload and tags.
4. Verify search, pagination, likes, comments, bookmarks.
5. Verify admin analytics and comment moderation.

## Production Readiness Checklist
See: [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)
