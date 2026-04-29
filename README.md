# FilePilot — Frontend

Web UI for the FilePilot document version control system. Pure presentation layer — all logic lives in the backend.

## Tech Stack

- **React 18**
- **Vite 5**
- **React Router 6**
- **Axios** (REST client)
- Plain CSS

## What It Does

Displays data and forwards user actions to the backend API. **No business logic here.**

Pages:
- Login / Register
- Dashboard
- Document list
- Document detail (with version history)
- Version detail (view content, diff, export)
- Admin panel (users, audit log)

## Requirements

- Node.js 20 LTS
- The backend running on `http://localhost:8080`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   VITE_API_URL=http://localhost:8080/api
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

The app opens at **http://localhost:3000**.

## Project Structure

```
src/
├── api/          Axios client + JWT interceptor
├── components/   Reusable UI (Navbar, DocumentCard, VersionDiff, ...)
├── pages/        Top-level pages mapped to routes
├── App.jsx       Router definition
└── main.jsx      Entry point
```

## Build for Production

```bash
npm run build
```

The static files are produced in `dist/` and can be served by any web server (nginx, Vercel, Netlify, etc.).

## Notes

- The JWT token is kept in memory and attached to every request via an Axios interceptor.
- If the backend URL changes, update `VITE_API_URL` in `.env` — no code changes needed.
