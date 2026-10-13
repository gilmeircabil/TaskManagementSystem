# Task Management System (Functional Prototype)

A full-stack, responsive Task Management web application built with **React + TypeScript (Vite)**, **Node.js + Express + TypeScript**, and **MongoDB (Mongoose)**.

The app helps users organize, prioritize, and track tasks from a central dashboard with real-time stats, color-coded badges, overdue task detection, categories, projects, combinable server-side filtering, and in-app reminders.

---

## Architecture & Project Structure

This repository is structured as a monorepo:

```
TaskManagementSystem/
├── package.json               # Root convenience scripts
├── .gitignore                 # Ignores node_modules, build dist, and all .env files
├── README.md                  # Setup and usage guide
├── server/
│   ├── .env.example           # Example environment configuration (no secrets)
│   ├── tsconfig.json          # Strict NodeNext TypeScript config
│   ├── package.json           # Express, Mongoose, Zod, bcryptjs, jsonwebtoken, etc.
│   └── src/
│       ├── config/env.ts      # Validated environment configuration with Zod
│       ├── constants.ts       # Shared domain constants and enums
│       ├── db.ts              # Mongoose connection & index initialization
│       ├── index.ts           # Server bootstrap
│       ├── app.ts             # Express app with CORS, JSON parser, and routes
│       ├── seed.ts            # Idempotent demo data seed script
│       ├── middleware/
│       │   ├── auth.ts        # JWT httpOnly cookie verification & req.userId scoping
│       │   └── errors.ts      # Centralized error handler (Zod, Mongoose, duplicates)
│       ├── models/
│       │   ├── User.ts        # User model with hidden passwordHash
│       │   ├── Project.ts     # Project model scoped to user
│       │   ├── Category.ts    # Category model with case-insensitive uniqueness
│       │   └── Task.ts        # Task model with status, priority, and indexes
│       ├── routes/
│       │   ├── auth.ts         # Register, login, logout, current user (/me)
│       │   ├── tasks.ts        # Tasks CRUD, search, filter, sort, pagination
│       │   ├── projects.ts     # Projects CRUD (delete unassigns tasks)
│       │   ├── categories.ts   # Categories CRUD (delete unassigns tasks)
│       │   ├── dashboard.ts    # Dashboard statistics & upcoming tasks
│       │   └── notifications.ts# In-app reminders (overdue and due within 48h)
│       └── utils/
│           ├── dates.ts       # Unified DateContext for overdue & weekly progress
│           ├── serializeTask.ts
│           └── validation.ts  # Zod ObjectId & date-only sanitizers
└── client/
    ├── index.html             # Vite entry HTML with TaskFlow branding
    ├── vite.config.ts         # Vite config with /api proxy to Express server
    ├── tsconfig.json          # React TypeScript config
    ├── package.json           # React 19, React Router 7
    └── src/
        ├── main.tsx           # Application root with BrowserRouter & Providers
        ├── App.tsx            # Protected & public routes
        ├── index.css          # Design system, layout, responsive styling (1280px / 768px / 375px)
        ├── api.ts             # Typed fetch wrapper with timezone headers
        ├── format.ts          # Badges, labels, and date formatting
        ├── types.ts           # Shared TypeScript interfaces
        ├── context/
        │   ├── AuthContext.tsx    # User session state & cookie sync
        │   ├── TaskUiContext.tsx  # Shared Add/Edit Task modal & live refresh signal
        │   └── ToastContext.tsx   # Toast notifications
        ├── components/
        │   ├── Layout.tsx         # Responsive sidebar drawer, topbar, user menu
        │   ├── Icons.tsx          # Lightweight SVG icons
        │   ├── Badges.tsx         # Inline status/priority dropdowns & badges
        │   ├── Modal.tsx          # Accessible modal & delete confirmation dialog
        │   ├── TaskModal.tsx      # Add & edit task form with project/category refs
        │   ├── RowMenu.tsx        # Row actions dropdown
        │   └── NotificationBell.tsx # 48h reminders bell with unread badge
        └── pages/
            ├── AuthPages.tsx      # Login and Register pages
            ├── DashboardPage.tsx  # Stat cards, progress bar, upcoming tasks
            ├── TasksPage.tsx      # Task list table, search, combinable filters
            ├── ProjectsPage.tsx   # Project cards & CRUD
            └── CategoriesPage.tsx # Category chips & color picker CRUD
```

---

## Setup & Running the Application

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB Atlas** cluster connection string (or a local MongoDB instance: `mongodb://localhost:27017/taskmanager`)

---

### 2. Configure Environment Variables

Navigate to the `server/` directory and create your `.env` file based on `.env.example`:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and supply your real values:
```ini
# MongoDB connection URI (e.g. Atlas mongodb+srv://... or local)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/taskmanager?retryWrites=true&w=majority

# Long random string (at least 32 characters)
JWT_SECRET=your-secure-random-secret-key-at-least-32-chars-long

# Server Port
PORT=4000

# Client origin for CORS
CLIENT_ORIGIN=http://localhost:5173
```

> **Note**: `.env` is ignored by Git and will never be committed.

---

### 3. Install Dependencies

From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside both `server/` and `client/` directories.)*

---

### 4. (Optional) Seed Demo Data

To populate sample projects, categories, and tasks (including overdue and upcoming tasks) for quick testing, run:

```bash
npm run seed
```

This creates a demo account:
- **Email**: `demo@example.com`
- **Password**: `demo-password-123`

---

### 5. Start the Application

You will run the backend server and frontend client in two terminal windows:

#### Terminal 1 — Start the Backend Server:
```bash
npm run dev:server
# or: cd server && npm run dev
```
The server will start at: **http://localhost:4000**

#### Terminal 2 — Start the Frontend Client:
```bash
npm run dev:client
# or: cd client && npm run dev
```
The frontend will start at: **http://localhost:5173**

Open **http://localhost:5173** in your web browser.

---

## Feature Tour & Verification

1. **User Authentication**
   - Register a new account or log in with the seeded credentials (`demo@example.com` / `demo-password-123`).
   - Session persists across page reloads via `httpOnly` JWT cookie.
   - Protected routes redirect unauthenticated users to `/login`.
   - Log out securely from the user avatar dropdown in the top bar.

2. **Task CRUD**
   - Click the primary blue **"Add Task"** button from any view (Dashboard or Tasks table).
   - Edit tasks by clicking their title or selecting **Edit** from the row action menu (`⋯`).
   - Delete tasks with confirmation dialog.
   - All tasks persist directly in MongoDB.

3. **Status and Priority**
   - Status: *To Do*, *In Progress*, *Completed*.
   - Priority: *Low*, *Medium*, *High*.
   - Change both **inline** directly from dropdown badges in the table without opening the full edit form.
   - Quick-toggle completion using the table checkbox; `completedAt` timestamp is automatically set or cleared.

4. **Deadlines & Overdue Detection**
   - Set calendar due dates.
   - Overdue tasks (due before today and not completed) display bold red text with an **"Overdue"** badge.
   - Overdue status is computed server-side taking into account the user's timezone (`X-Timezone` header).

5. **Projects and Categories**
   - Create, edit, and delete projects on the `/projects` page.
   - Create, edit, and delete categories with customizable color swatches on the `/categories` page.
   - Category names are case-insensitively unique per user.
   - Deleting a project or category **unassigns** existing tasks rather than deleting them.

6. **Search & Combinable Filtering**
   - Server-side keyword search across `title` and `description`.
   - Filters: status, priority, project, category, due date (*Overdue*, *Due today*, *Due this week*, *No due date*).
   - Combinable and stored in URL query parameters for shareability and persistence across refresh.
   - Sort by created date, due date, or priority.
   - 10 tasks per page with pagination controls and a *"Showing X–Y of N tasks"* indicator.

7. **Dashboard & Progress Tracking**
   - Server-calculated stat cards: *Total*, *To Do*, *In Progress*, *Completed*, and *Overdue*.
   - Real-time completion percentage progress bar.
   - *"Tasks completed this week"* counter.
   - Next 5 upcoming tasks list with direct edit links.
   - Updates immediately when any task is added, edited, or deleted.

8. **In-App Notifications & Reminders**
   - Notification bell in the top navigation bar displays a count badge.
   - Dropdown displays non-completed tasks that are overdue or due within the next 48 hours.
   - Polls automatically every 60 seconds and updates on task changes.
   - Clicking a reminder opens that task in the edit modal.

9. **Responsive Design**
   - **Desktop (≥1024px)**: Fixed sidebar navigation, top bar with bell and user profile, comprehensive task table.
   - **Tablet (768px)**: Collapsible sidebar into hamburger menu drawer, responsive stat cards.
   - **Mobile (375px)**: Stacked stat cards, touch-friendly controls, horizontal scroll table.

---

## Prototype Scope & Known Limitations

As specified in the functional prototype requirements:
- **Scope Included**: Complete end-to-end functionality for single-user task management, authentication, CRUD, filtering, dashboard metrics, in-app reminders, and responsive layout.
- **Excluded by Design**: Multi-user collaboration/assignees, team workspaces, file attachments, external email/SMS notifications, calendar drag-and-drop view, OAuth providers, and automated cron jobs.
- **Security Baseline**: Passwords hashed with bcrypt (12 rounds), inputs validated and sanitized with Zod to prevent NoSQL injection, all database queries strictly scoped to `req.userId`, and generic auth errors. Production hardening (rate limiting, email verification, CSRF tokens, CSP tuning) is reserved for future production deployment.
