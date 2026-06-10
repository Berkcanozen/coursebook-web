# Coursebook — web app (React + TypeScript + Vite)

The frontend, rebuilt as a proper SPA. PWA-enabled and structured so it can be
wrapped with Capacitor for iOS/Android later, all sharing the same backend API.

## Requirements
- Node.js 18+ (you already have 22)
- The backend running (the `coursebook-backend` project)

## Run it locally
```bash
npm install
cp .env.example .env     # VITE_API_URL defaults to http://localhost:4000
npm run dev              # opens http://localhost:5173
```
Start the backend first (`npm start` in the backend folder), then open the dev URL,
create an account, and optionally choose "Load sample data".

Scripts: `npm run dev` (dev server), `npm run build` (type-check + production build
into `dist/`), `npm run preview` (serve the build), `npm run typecheck`.

## Architecture (why it's "healthy" and mobile-ready)
```
src/
  lib/
    api.ts          typed REST client (the only place that talks to the server)
    format.ts       money/date helpers + derived values (status, totals)
    constants.ts    icons, colours, labels
  auth/auth.tsx     auth context: JWT token in localStorage, signIn/signOut
  hooks.ts          TanStack Query: useFamilyState() + useAction() (auto-refresh)
  ui.tsx            navigation + bottom-sheet context (tab/course/active child)
  screens/          Home, CourseDetail, Payments, Family, AuthScreen
  sheets/           Child / Course / Session / Settings forms
  Shell.tsx         app frame: header, tab bar, sheet host, sync indicator
  types.ts          shared domain types
```
Layers are separated on purpose: **UI** (screens/sheets) is decoupled from the
**data layer** (`lib/api.ts` + `hooks.ts`). Server state lives in TanStack Query;
every mutation invalidates the cached `['state']` query so the UI stays consistent
with the backend. This same data layer works unchanged inside a Capacitor WebView.

## Configure the API URL
Set `VITE_API_URL` in `.env` (build-time). For production builds point it at your
deployed backend, e.g. `VITE_API_URL=https://coursebook-api.onrender.com`.

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

## Deploy
- Build: `npm run build` -> static files in `dist/`.
- Host `dist/` on GitHub Pages (or Netlify/Vercel/Render static). For GitHub Pages
  with a project subpath, set Vite's `base` in `vite.config.ts` to `/<repo>/`.
- Keep the backend on Render and set `ALLOWED_ORIGIN` to your frontend origin.
