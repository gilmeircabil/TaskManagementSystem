# Kupon — Expense Tracker

A full-stack expense & income tracker built with **React (Vite)**, **Node.js/Express**, and **Supabase** (PostgreSQL + Auth + Row Level Security).

Currency defaults to **₱ Philippine Peso**, with support for switching currencies per user in Settings.

---

## Stack

| Layer     | Technology                                   |
|-----------|-----------------------------------------------|
| Frontend  | React (JSX) + Vite, React Router, Recharts, react-hot-toast |
| Backend   | Node.js + Express                            |
| Database  | Supabase PostgreSQL                          |
| Auth      | Supabase Auth (email/password) + JWT verification on the server |
| Security  | Postgres Row Level Security (RLS) — every table scoped to `auth.uid()` |

---

## Project Structure

```
expense-tracker/
├── client/            React + Vite frontend
│   └── src/
│       ├── components/   Reusable UI (Navbar, Sidebar, cards, forms, modal, chart...)
│       ├── pages/         Route-level views (Login, Dashboard, Expenses, Reports...)
│       ├── layouts/       DashboardLayout (sidebar + navbar shell)
│       ├── services/      supabase.js, authService, expenseService, incomeService, apiClient
│       ├── hooks/         useAuth, useExpenses, useIncome
│       ├── context/       AuthContext
│       ├── routes/        AppRoutes
│       └── utils/         formatting, constants, CSV/PDF export helpers
├── server/            Express API
│   ├── controllers/       expenseController, incomeController
│   ├── routes/             expenseRoutes, incomeRoutes
│   ├── middleware/         authMiddleware (verifies Supabase JWT)
│   └── config/             supabase.js (service-role admin client)
├── supabase/
│   └── schema.sql       Full table definitions, triggers, and RLS policies
└── package.json         Convenience scripts to run client + server together
```

---

## 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project

---

## 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard).
2. Open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it.
   This creates:
   - `profiles`, `expenses`, `income`, `categories` tables
   - RLS policies so each user can only read/write their **own** rows
   - A trigger that auto-creates a `profiles` row when someone signs up
   - `updated_at` auto-touch triggers
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (server only — keep secret!)
4. (Optional) Under **Authentication → Providers**, confirm Email auth is enabled. For local development you can disable "Confirm email" so sign-ups log straight in.

---

## 3. Configure environment variables

**`server/.env`**
```
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIENT_ORIGIN=http://localhost:5173
```

**`client/.env`**
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_API_BASE_URL=http://localhost:5000/api
```

`.env.example` files are provided in both folders as templates.

---

## 4. Install & run

From the project root:

```bash
npm run install:all   # installs server + client dependencies
npm run dev           # runs server (http://localhost:5000) and client (http://localhost:5173) together
```

Or run them separately:

```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd client && npm install && npm run dev
```

Visit **http://localhost:5173**, register an account, and start tracking.

---

## 5. How auth + data flow together

1. The client signs up / logs in directly against **Supabase Auth** (`services/authService.js`), which is stored in `AuthContext`.
2. For **Expenses** and **Income**, the client calls the **Express API** (`services/expenseService.js` / `incomeService.js`) instead of Supabase directly.
3. Every request automatically attaches the user's Supabase access token (`services/apiClient.js`).
4. On the server, `middleware/authMiddleware.js` verifies that token with Supabase, then builds a **request-scoped Supabase client** authenticated as that user — so every query still passes through **Postgres RLS**, even from the server.
5. This means a user can never read or modify another user's expenses/income, whether the request goes through the API or (hypothetically) straight to Supabase.

---

## 6. Features

- **Auth**: Register / Login / Logout, protected routes, profile management
- **Expenses**: full CRUD, categories, payment methods, date picker, search + filter (category, date range, payment method)
- **Income**: full CRUD, source tracking, date, search + filter
- **Dashboard**: time-of-day greeting, income/expense/balance summary cards, category spending chart, recent transactions
- **Reports**: daily / weekly / monthly views, category breakdown, income vs expenses comparison chart, **CSV and PDF export**
- **UI/UX**: responsive sidebar + navbar dashboard shell, ₱ currency formatting, toast notifications, loading states

---

## 7. Notes on RLS

Row Level Security is enforced at the database layer — not just in application code. Even if a bug in the Express API forgot a `WHERE user_id = ...` clause, Postgres would still refuse to return or modify rows that don't belong to the authenticated user, because every table's policies check `auth.uid() = user_id`.

## 8. Building for production

```bash
npm run build:client   # outputs client/dist
```

Deploy `client/dist` to any static host (Vercel, Netlify, etc.) and `server/` to any Node host (Render, Railway, Fly.io, etc.), setting the same environment variables there.
