# Supabase setup (backend)

This project now uses Supabase (Postgres + Auth) instead of the old Render/Express
backend. There is no separate backend repo anymore — the "backend" is the SQL below
plus your Supabase project.

## 1. Database
In the Supabase Dashboard -> SQL Editor:
- Fresh project: run `01_schema.sql`.
- If you already ran an earlier schema (with a currency CHECK constraint): run
  `02_currency_fix.sql` instead.

## 2. Auth
Authentication -> Providers -> enable **Email**.
To let signups log in immediately, turn **off** "Confirm email".

## 3. Frontend env vars (Vercel -> Settings -> Environment Variables)
```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # the publishable key
```
The old `VITE_API_URL` is no longer used.

## 4. Verify
Register an account -> confirm a row in Table Editor -> profiles -> add a child,
course, and session -> reload; it should persist. Then retire the Render service.

Note: README.md still describes the old Render backend — safe to update when convenient.
