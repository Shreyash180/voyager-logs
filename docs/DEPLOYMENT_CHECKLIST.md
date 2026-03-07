# Deployment Checklist (Production)

## GitHub Repository
- [ ] Repository contains only app files needed for deployment
- [ ] `.gitignore` ignores `.env*`, `.next`, `node_modules`, logs
- [ ] `README.md` includes setup + deployment instructions
- [ ] CI pipeline runs lint/build/migrations

## Environment Variables
- [ ] All required vars are set in Vercel
- [ ] Secrets are strong and unique in production
- [ ] `.env.example` is up to date
- [ ] No real secret is committed in Git history

## Database (Neon/Supabase)
- [ ] Production `DATABASE_URL` points to managed Postgres
- [ ] `npx prisma migrate deploy` completed successfully
- [ ] `npx prisma generate` completed successfully
- [ ] Indexes exist and query plans are acceptable
- [ ] Pooling enabled (provider pooler or PgBouncer)

## API + Auth
- [ ] `/api/health` returns healthy response
- [ ] Register/login/logout works in production
- [ ] JWT cookies are `httpOnly`, `Secure` (prod), `SameSite`
- [ ] Admin-only endpoints block non-admin users

## Media Upload
- [ ] Cloudinary keys configured in Vercel
- [ ] Upload accepts only allowed image types
- [ ] 5MB size limit enforced
- [ ] Signed upload request works end-to-end

## Performance
- [ ] Post list pagination works on DB level
- [ ] Cache strategy active for list/detail reads
- [ ] Thumbnails use lazy loading
- [ ] TTFB and page load validated on public URL

## Monitoring
- [ ] Structured logs visible in host dashboard
- [ ] Error tracking configured (Sentry optional)
- [ ] Uptime monitor configured for home + health endpoint

## Manual Smoke Test
- [ ] Home page renders and loads posts
- [ ] Search and tag filter return expected results
- [ ] Create/edit/delete post works for admin
- [ ] Thumbnail upload works
- [ ] Comments, likes, bookmarks work
- [ ] Profile activity renders correctly
