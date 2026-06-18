# Coursebook — web app (React + TypeScript + Vite)

A mobile-first SPA for tracking your children's courses and payments. PWA-enabled
and structured so it can be wrapped with Capacitor for iOS/Android later. The
backend is **Supabase** (hosted Postgres + Auth) — there is no separate server to
run.

## Requirements
- Node.js 18+ (only for local dev/builds; deploys build in the cloud)
- A Supabase project (see `supabase/SUPABASE_SETUP.md`)

## Run it locally
```bash
npm install
cp .env.example .env     # fill in your VITE_SUPABASE_* values
npm run dev              # opens http://localhost:5173
```
Open the dev URL, create an account, and optionally choose "Load sample data".

Scripts: `npm run dev` (dev server), `npm run build` (type-check + production build
into `dist/`), `npm run preview` (serve the build), `npm run typecheck`.

## Backend (Supabase)
There's no backend codebase — Supabase provides Postgres, Auth, and an
auto-generated API. One-time setup, all in the dashboard:
1. SQL Editor → run `supabase/01_schema.sql` (or `02_currency_fix.sql` if you
   already ran an earlier schema). This creates the tables, Row Level Security
   policies, and the profile-on-signup trigger.
2. Authentication → Providers → enable **Email**. Turn off "Confirm email" if you
   want signups to log in immediately.

Data ownership is enforced by RLS: every row carries a `user_id` and policies scope
all reads/writes to the signed-in user, so one family can never see another's data.

## Architecture (why it's "healthy" and mobile-ready)
```
src/
  lib/
    supabase.ts     Supabase client (reads VITE_SUPABASE_* env vars)
    api.ts          typed data layer (the only place that talks to Supabase)
    format.ts       money/date helpers + derived values (status, totals)
    constants.ts    icons, colours, labels, currencies
  auth/auth.tsx     auth context over Supabase Auth: token/ready, signIn/signOut
  hooks.ts          TanStack Query: useFamilyState() + useAction() (auto-refresh)
  ui.tsx            navigation + bottom-sheet context (tab/course/active child)
  screens/          AuthScreen, Home, Calendar, CourseDetail, Payments, Family
  sheets/           Child / Course / Session / Settings forms
  App.tsx           providers + auth gate
  Shell.tsx         app frame: header, tab bar, sheet host, sync indicator
  types.ts          shared domain types
supabase/           SQL schema + setup notes (run in the Supabase dashboard)
```
Layers are separated on purpose: **UI** (screens/sheets) is decoupled from the
**data layer** (`lib/api.ts` + `hooks.ts`). `api.ts` maps Postgres rows to the
domain types in `types.ts`; server state lives in TanStack Query, and every
mutation invalidates the cached `['state']` query so the UI stays consistent. This
same data layer works unchanged inside a Capacitor WebView.

## Deploy (Vercel)
- Build: `npm run build` → static files in `dist/`.
- Set the environment variables in Vercel → Settings → Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (the publishable key)
- Push to the connected GitHub repo; Vercel installs and builds in the cloud.

No CORS or backend origin config is needed — Supabase allows browser clients by
default, and the publishable key is safe to ship in client code (RLS guards the data).

> Hosting on GitHub Pages instead? It serves from a subpath, so set Vite's `base`
> in `vite.config.ts` to `/<repo>/` and add an SPA 404 fallback. Vercel needs none
> of this.

## Going mobile later (Capacitor)
Because this is a client-side SPA, wrapping it is straightforward:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init Coursebook com.example.coursebook --web-dir=dist
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios     # or android
```
Then add native plugins as needed (e.g. `@capacitor/push-notifications` for
payment reminders). The web build in `dist/` is what Capacitor ships.
