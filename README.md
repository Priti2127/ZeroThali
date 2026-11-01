# ZeroThali – Campus Food‑Rescue & Waste‑to‑Energy Platform

> **Live demo:** (will appear after you deploy to Vercel/Netlify)

## Table of Contents
1️⃣ [Project Overview](#overview)  
2️⃣ [Tech Stack](#tech-stack)  
3️⃣ [Setup – Local Development](#local-dev)  
4️⃣ [Supabase – Backend (Realtime DB & Auth)](#supabase)  
5️⃣ [Deploy to Vercel (or Netlify)](#deploy)  
6️⃣ [Testing Checklist](#test‑checklist)  
7️⃣ [Folder Structure & Key Files](#structure)  
8️⃣ [Environment Variables](#env)  
9️⃣ [Future Enhancements](#future)

---

## 📖 <a id="overview"></a>1️⃣ Project Overview
ZeroThali is a **mobile‑first, installable PWA** that connects three user roles:
- **Mess Staff** – logs surplus edible or unfit food.
- **Receiver / NGO** – claims edible food, receives a pickup code, marks collection.
- **College Admin / Biogas Operator** – monitors unfit waste, biogas estimates, and overall KPIs.

All data lives in **Supabase** (PostgreSQL + realtime) so updates appear instantly on every device.

---

## 🛠️ <a id="tech-stack"></a>2️⃣ Tech Stack
| Layer | Tech |
|------|------|
| Front‑end | **React 18** + **Vite** (fast dev/build) |
| UI | **Tailwind CSS** – custom colour palette, rounded cards, large tap targets |
| PWA | `vite-plugin-pwa` – manifest + service‑worker |
| Hosting | **Vercel** (free) – also works on Netlify |
| Backend | **Supabase** (PostgreSQL, Auth, Realtime, Storage) |
| State / Data fetching | Supabase client (`@supabase/supabase-js`) + custom React hooks |
| Map / distance (optional) | Google Maps / OpenStreetMap APIs (you can plug in later) |

---

## 👩‍💻 <a id="local-dev"></a>3️⃣ Local Development
```bash
# 1️⃣ Clone the repo (you already have it)
git clone https://github.com/Priti2127/ZeroThali.git
cd ZeroThali

# 2️⃣ Install dependencies (Node 20+ recommended)
npm ci   # installs exactly what's in package‑lock.json

# 3️⃣ Create a .env file (copy from .env.example after Supabase is ready)
cp .env.example .env
# edit .env and add your Supabase URL & anon key

# 4️⃣ Start dev server
npm run dev
```
Open <http://localhost:5173> – you should see the landing page.

---

## 🔧 <a id="supabase"></a>4️⃣ Supabase – Backend (Realtime DB & Auth)
Supabase is a **hosted Postgres** with built‑in auth, realtime listeners, and file storage. Follow these steps:

1️⃣ **Create a project** – go to <https://app.supabase.com> → *New project* → choose the free tier. Give it a name like `zerothali-db`.

2️⃣ **Grab the credentials** – after the project is ready, open **Settings → API**. Copy:
- `PROJECT_URL` → will become `VITE_SUPABASE_URL`
- `anon public` key → will become `VITE_SUPABASE_ANON_KEY`

3️⃣ **Enable Realtime** – In **Database → Realtime** make sure the toggle is **ON** (default). This allows our UI to receive live updates.

4️⃣ **Run the schema & seed data** – Open **SQL editor** → paste the content from `supabase/schema.sql` (we already added this file). Click **Run**. It creates tables, views, and inserts a few messes and demo users.

5️⃣ **Auth redirect URLs** – Open **Authentication → Settings → URL Configuration**. Add two URLs (replace `YOUR_VERCEL_SUBDOMAIN` with your future domain):
```
https://YOUR_VERCEL_SUBDOMAIN.vercel.app
http://localhost:5173   # for local dev
```
Save.

6️⃣ **Storage bucket for photos** – In **Storage → Buckets**, create a bucket named `food-photos`. Set **Public** access (read‑only) so anyone can fetch the image URL.

7️⃣ **CORS** – Supabase automatically allows origins listed in the Auth redirect URLs. No extra config needed.

> **That’s it!** Your Supabase backend is ready. The two values you copied go into the env vars (see the next section).

---

## 🚀 <a id="deploy"></a>5️⃣ Deploy to Vercel (or Netlify)
### Vercel (recommended – single click)
1️⃣ Sign‑in at <https://vercel.com> and click **New Project** → **Import Git Repository** → select `ZeroThali`.
2️⃣ Vercel auto‑detects a Vite app. Keep the default **Build Command** `npm run build` and **Output Directory** `dist`.
3️⃣ **Environment Variables** → add:
| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | *(your Supabase URL)* |
| `VITE_SUPABASE_ANON_KEY` | *(your anon key)* |
4️⃣ Click **Deploy**. After a few seconds you’ll get a public URL like `https://zero-thali.vercel.app`.

### Netlify (alternative)
1️⃣ Log‑in to <https://app.netlify.com> → **New site from Git** → pick the repo.
2️⃣ Build settings: **Command** `npm run build`, **Publish directory** `dist`.
3️⃣ Add the same two env vars under **Site settings → Build & deploy → Environment**.
4️⃣ Add a `_redirects` file (we already placed one) with `/*    /index.html   200` to enable SPA routing.
5️⃣ Deploy – you’ll receive a `https://your‑site‑name.netlify.app` URL.

---

## ✅ <a id="test-checklist"></a>6️⃣ Test Checklist (run on two phones)
1️⃣ Open the live URL on Phone A → **Mess Staff** → log an edible item (e.g., "Veg Curry, 3 kg").
2️⃣ Open the same URL on Phone B → **Receiver** → you should see the new item instantly.
3️⃣ Claim the item → verify the claim code appears and the status tag changes to **Claimed** on both devices.
4️⃣ Mark it as **Collected** → it disappears from the receiver list.
5️⃣ Switch to **Biogas Queue** → any unfit items appear with a “Mark as loaded” button.
6️⃣ Open **Admin Dashboard** → KPI numbers reflect the actions you performed.
7️⃣ Add the site to Home Screen (PWA) on both phones and launch it in standalone mode – it should work offline for cached assets.

---

## 📁 <a id="structure"></a>7️⃣ Folder Structure (key files)
```
ZeroThali/
│   package.json
│   vite.config.ts
│   tailwind.config.cjs
│   postcss.config.cjs
│   .env.example
│   vercel.json
│   README.md   ← you are reading this
│
└─ public/
│   │   index.html
│   │   icons/ (icon-192.png, icon-512.png)
│   │   manifest.json   (generated by Vite‑PWA)
│
└─ src/
    │   main.tsx
    │   App.tsx
    │   index.css   ← Tailwind imports & global fonts
    │
    ├─ components/   (Navbar, Card, Tag, Button, etc.)
    ├─ pages/        (Landing, Staff, Receiver, Biogas, Admin)
    ├─ services/     (supabase client)
    └─ hooks/        (useRealtime, useAuth)
```
All files are already created in the repo – you can explore them after the first push.

---

## ⚙️ <a id="env"></a>8️⃣ Environment Variables
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Base URL of your Supabase project (e.g. `https://xyz.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Public anon key – used by the front‑end for auth & DB access. |

Add them **exactly** with those names to:
- **Vercel** → *Project Settings → Environment Variables* (both `Production` and `Preview`).
- **Netlify** → *Site Settings → Build & Deploy → Environment*.

> The `.env.example` file in the repo shows the required shape.

---

## 🚧 <a id="future"></a>9️⃣ Future Enhancements
- Map view with distance calculation (Google Maps / OpenStreetMap).
- Push notifications for new pickups (via VAPID + Supabase Edge Functions).
- Role‑based UI guards using Supabase policies.
- Email / SMS OTP for claim verification.

---

If you run into any step, let me know – I can walk you through the Supabase console or adjust the code.
