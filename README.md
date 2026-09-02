# TaskFlow — Realtime Task Manager (MERN + TypeScript)

A Kanban-style task manager built on the MERN stack (MongoDB, Express, React, Node), written entirely
in TypeScript, with realtime sync powered by Socket.io.

## Features

- **Realtime everywhere** — creating, editing, deleting, or dragging a task instantly updates every
  connected client, no refresh needed.
- **Drag-and-drop board** — three columns (To Do / In Progress / Done); drag cards between and within
  columns, with order persisted server-side.
- **Live presence** — see who else is currently on the board, shown as avatars in the header.
- **Typing indicators** — see "Name is editing…" when someone else opens the same task you're viewing.
- **Full CRUD API** — REST endpoints backed by Mongoose/MongoDB with server-side validation.
- **Type-safe end to end** — shared status/priority types, strict TypeScript on both client and server.

## Project structure

```
task-manager/
├── server/            Express + Socket.io + MongoDB API (TypeScript)
│   └── src/
│       ├── config/        MongoDB connection
│       ├── controllers/   Route handlers + realtime broadcasts
│       ├── models/        Mongoose schemas
│       ├── routes/        Express routers
│       ├── socket/        Socket.io presence/typing handlers
│       └── types/         Shared types + socket event names
└── client/            React 18 + Vite + TypeScript frontend
    └── src/
        ├── api/            Axios client for the REST API
        ├── components/     Header, board, columns, cards, modal
        ├── context/        Socket.io React context/provider
        ├── hooks/          useTasks — state + realtime sync
        └── types/          Shared task types
```

## Prerequisites

- Node.js 18+
- A MongoDB instance — local (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env    # edit MONGO_URI if needed
npm run dev              # starts on http://localhost:5000
```

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env    # defaults already point at localhost:5000
npm run dev              # starts on http://localhost:5173
```

Open `http://localhost:5173`, enter a name, and you're on the board. Open the same URL in a second
tab (or another browser) to see realtime sync and presence in action.

## Production build

```bash
# server
cd server && npm run build && npm start

# client
cd client && npm run build   # outputs static files to client/dist
```

Serve `client/dist` with any static host (Vercel, Netlify, nginx, or Express's `express.static`),
and point `VITE_API_URL` / `VITE_SOCKET_URL` at your deployed API URL before building.

## How the realtime sync works

1. Every mutation (create/update/delete/reorder) goes through a normal REST call.
2. On success, the Express controller emits a Socket.io event (`task:created`, `task:updated`,
   `task:deleted`, `task:reordered`) to **all** connected clients, including the one that made
   the change.
3. The client's `useTasks` hook listens for those events and merges them into local state — so the
   UI is always driven by the server's source of truth, and every open tab stays in sync automatically.
4. Presence and typing indicators are pure Socket.io (no REST involved): `presence:join` on connect,
   and `user:typing` while a form field changes, both echoed back out to other clients.

## Extending this further

- Swap the in-memory presence map (`server/src/socket/index.ts`) for Redis if you need multiple
  server instances behind a load balancer.
- Add authentication (e.g. JWT) and scope tasks to a user or workspace.
- Add optimistic UI for create/update (currently only delete is optimistic — everything else waits
  for the socket echo, which keeps state simple but adds a tiny bit of latency).
