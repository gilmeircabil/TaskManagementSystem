# Production Deployment Guide: Task Management System

This guide covers end-to-end production deployment for the Task Management System monorepo (`client/` + `server/`).

---

## Architecture & Deployment Strategies

The application consists of:
- **Backend (`server/`)**: Node.js + Express 5 + Mongoose + TypeScript ESM.
- **Frontend (`client/`)**: React 19 + Vite SPA + TypeScript.
- **Database**: MongoDB (MongoDB Atlas or self-hosted).
- **Authentication**: JWT stored in an `httpOnly`, `sameSite: 'lax'`, `secure: true` cookie.

### Deployment Options

| Option | Frontend | Backend | Database | Best For |
|---|---|---|---|---|
| **Option 1 (Recommended)** | **Vercel** | **Render** | **MongoDB Atlas** | Fastest setup, generous free tier, automatic SSL |
| **Option 2** | **Railway** | **Railway** | **MongoDB Atlas / Railway Mongo** | Unified monorepo dashboard |
| **Option 3** | **Nginx** | **Node container** | **MongoDB container** | Self-hosted VPS (Docker Compose) |

---

## 1. Prerequisites: MongoDB Atlas Database

1. **Sign up / Log in** to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. **Create a Database Cluster**:
   - Choose the **M0 Free Tier** (AWS or GCP, select the region closest to your users).
3. **Configure Database User**:
   - Go to **Security > Database Access** > **Add New Database User**.
   - Authentication Method: **Password**.
   - Choose a username and a strong password (avoid special characters like `@`, `:`, or `#` in the password, or URL-encode them).
   - Set Built-in Role to **Read and write to any database**.
4. **Configure Network Access**:
   - Go to **Security > Network Access** > **Add IP Address**.
   - Click **Allow Access from Anywhere (`0.0.0.0/0`)** so serverless and cloud hosting providers (Render, Vercel, Railway) can connect.
5. **Obtain Connection String**:
   - Click **Databases** > **Connect** > **Drivers** (Node.js).
   - Copy the URI, replacing `<db_password>` with your password and specifying the database name:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/taskmanager?retryWrites=true&w=majority
     ```

---

## 2. Environment Variables Reference

### Backend (`server/.env`)

| Variable | Required | Production Value | Description |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | `mongodb+srv://...` | MongoDB connection string |
| `JWT_SECRET` | **Yes** | `[random 32+ char string]` | Secure signing key for authentication tokens |
| `PORT` | Optional | Handled by host (default `4000`) | Port Express listens on |
| `CLIENT_ORIGIN` | **Yes** | `https://your-app.vercel.app` | Exact URL of the frontend (no trailing slash) |
| `NODE_ENV` | **Yes** | `production` | Enables secure cookies, strict CSP, and rate limiting |

> **Generate a secure `JWT_SECRET`:**
> Run in terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 3. Option 1: Deploy with Vercel (Client) + Render (Server)

### A. Deploy Backend to Render

1. Sign up/log in at [render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `TaskManagementSystem`.
4. Configure the service:
   - **Name**: `task-management-api`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
5. Add **Environment Variables** in Render dashboard:
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
   - `JWT_SECRET`: `<your-generated-jwt-secret>`
   - `NODE_ENV`: `production`
   - `CLIENT_ORIGIN`: `https://your-frontend-name.vercel.app` *(update once frontend is created)*
6. Click **Deploy Web Service**.
7. Note down your backend URL (e.g., `https://task-management-api.onrender.com`).
8. Verify backend health by visiting: `https://task-management-api.onrender.com/api/health` (should return `{"ok":true}`).

---

### B. Deploy Frontend to Vercel

Because `client/src/api.ts` sends API requests to relative path `/api/...` with credentials, configuring a Vercel rewrite ensures the frontend and backend appear **same-origin** to the browser. This prevents third-party cookie blocking and CORS issues.

1. Create a `vercel.json` file inside the `client/` directory:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://task-management-api.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   *(Replace `https://task-management-api.onrender.com` with your actual Render API URL).*

2. Sign in to [Vercel](https://vercel.com) and click **Add New... > Project**.
3. Import your GitHub repository.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.
6. Once deployed, copy your production URL (e.g., `https://task-flow.vercel.app`).
7. **Important**: Go back to Render > **Environment** and verify `CLIENT_ORIGIN` matches this URL:
   ```env
   CLIENT_ORIGIN=https://task-flow.vercel.app
   ```
   *(Render will trigger a quick redeploy).*

---

## 4. Option 2: Deploy with Railway (Monorepo)

Railway can host both client and server under a single project:

1. Sign in to [railway.com](https://railway.com) and create a **New Project**.
2. **Deploy Backend**:
   - Choose **Deploy from GitHub repo**.
   - Under Settings:
     - **Root Directory**: `server`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start`
   - Under Variables: Add `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `CLIENT_ORIGIN`.
   - Under Networking: Click **Generate Domain** (e.g. `https://api.up.railway.app`).
3. **Deploy Frontend**:
   - In the same project, click **New > GitHub Repo** (select same repo).
   - Under Settings:
     - **Root Directory**: `client`
     - **Build Command**: `npm install && npm run build`
   - Provide Nginx or static file serving, or add a `vercel.json` / reverse proxy configuration.

---

## 5. Option 3: Self-Hosting with Docker & Docker Compose

For a VPS (DigitalOcean Droplet, AWS EC2, Hetzner, etc.):

### `docker-compose.yml` (at repository root)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7-jammy
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: strong_admin_password
      MONGO_INITDB_DATABASE: taskmanager
    volumes:
      - mongo_data:/data/db
    networks:
      - app-net

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: always
    environment:
      MONGODB_URI: mongodb://admin:strong_admin_password@mongodb:27017/taskmanager?authSource=admin
      JWT_SECRET: your_very_secure_random_jwt_secret_min_32_characters
      PORT: 4000
      CLIENT_ORIGIN: https://yourdomain.com
      NODE_ENV: production
    depends_on:
      - mongodb
    networks:
      - app-net

  client:
    build:
      context: .
      dockerfile: Dockerfile.client
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server
    networks:
      - app-net

volumes:
  mongo_data:

networks:
  app-net:
    driver: bridge
```

---

## 6. Optional: Seeding Production Demo Data

To populate initial projects, categories, and sample tasks on your deployed database:

Run the seed script from your local machine pointing to the production MongoDB URI:

```bash
cd server
MONGODB_URI="your-production-mongodb-connection-string" npm run seed
```

This sets up:
- **Email**: `demo@example.com`
- **Password**: `demo-password-123`

---

## 7. Post-Deployment Verification & Troubleshooting

### 1. Verification Checklist
- [ ] Visit frontend URL (e.g. `https://task-flow.vercel.app`).
- [ ] Register a new account or log in.
- [ ] Create a new task, update its status, and assign a project/category.
- [ ] Refresh the page to verify that the `tms_token` cookie persists session state.
- [ ] Check Dashboard metrics to confirm real-time server-side stats load properly.

### 2. Common Issues & Solutions

| Issue | Cause | Fix |
|---|---|---|
| **403 Forbidden: "Cross-origin request blocked by CSRF policy"** | `CLIENT_ORIGIN` does not match the actual browser origin | Ensure `CLIENT_ORIGIN` on backend has no trailing slash, starts with `https://`, and exactly matches the domain shown in browser address bar. |
| **Login succeeds but page remains unauthenticated on reload** | Cookie was rejected or blocked | In production, cookies are flagged `Secure: true`. Ensure your site is loaded over `HTTPS` and that the proxy (`vercel.json`) is correctly forwarding requests. |
| **Backend fails on startup ("Invalid environment configuration")** | Missing or invalid env variable | Check `server/src/config/env.ts` requirements: `JWT_SECRET` must be at least 32 characters, `MONGODB_URI` cannot be empty. |
| **MongoDB connection timeout (`serverSelectionTimeoutMS`)** | Atlas firewall blocking Render / cloud IPs | In MongoDB Atlas, go to **Network Access** and verify `0.0.0.0/0` (Allow from anywhere) is active. |
| **Render initial request takes ~50 seconds** | Free instance spun down due to inactivity | Free tier instances on Render sleep after 15 minutes of inactivity. First request wakes it up. Upgrade to Starter or use an uptime monitor (e.g. UptimeRobot) if instant response is required. |
