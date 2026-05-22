# Budget Buddy — Local testing & deployment

## Prerequisites

- Node.js 18+ and npm 8+
- MongoDB (local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

---

## Local development (step by step)

### 1. MongoDB

**Option A — Local:** start MongoDB on `mongodb://127.0.0.1:27017`

**Option B — Atlas:** create a cluster, allow your IP, copy the connection string.

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET (and JWT_REFRESH_SECRET)
npm install
npm run dev
```

API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`

### 3. Frontend

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

App runs at `http://localhost:5173` (Vite proxies `/api` to the backend in dev).

### 4. Smoke tests

```bash
cd server && npm run test:smoke
cd ../client && npm run test:smoke
```

### 5. Recurring worker (optional)

In a third terminal:

```bash
cd server
node src/workers/recurringWorker.js
```

Posts recurring templates as real transactions once per day.

### 6. Manual test checklist

1. Register a new account at `/register`
2. Create a budget (Food, limit e.g. 500)
3. Add an expense transaction
4. Confirm budget `spent` updates on dashboard
5. Change currency in header — should persist (preferences API)
6. Create a goal on `/goals`
7. Create a recurring item on `/recurring`
8. Log out and log back in — session should restore via cookies

---

## Production deployment

Recommended split: **API on Render/Railway/Fly** + **frontend on Vercel/Netlify** + **MongoDB Atlas**.

### Backend (e.g. Render)

1. New Web Service → connect repo → root directory `server`
2. Build: `npm install`
3. Start: `npm start`
4. Environment variables:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI_PROD` | Atlas connection string |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | different long random string |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `PORT` | `5000` (or platform default) |

5. Deploy and note API URL: `https://your-api.onrender.com`

### Frontend (e.g. Vercel)

1. Import repo → root directory `client`
2. Build: `npm run build`
3. Output: `dist`
4. Environment: `VITE_API_URL=https://your-api.onrender.com/api`
5. Deploy

### Cookie auth in production

- API and frontend must use **HTTPS**
- `CORS_ORIGIN` must exactly match the frontend origin (no trailing slash)
- Cookies use `SameSite=None` + `Secure` in production (already configured)

### Recurring worker in production

Run as a separate **background worker** on Render/Railway:

- Start command: `node src/workers/recurringWorker.js`
- Same `MONGODB_URI_PROD` and env as the API

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Set `CORS_ORIGIN` to your frontend URL; use credentials (`withCredentials` is on) |
| 401 after login | Check cookies in DevTools → Application → Cookies |
| Currency not saving | Ensure `PUT /api/auth/preferences` returns 200 (fixed in this release) |
| Mongo connection failed | Verify `MONGODB_URI` / Atlas IP whitelist |
| Empty goals/recurring | Create budgets first; check Network tab for API errors |

---

## Portfolio talking points

- HttpOnly JWT cookies + refresh rotation (not localStorage)
- express-validator on routes + Mongoose schema validation
- Budget `spent` synced via transaction aggregation hooks
- Mobile bottom navigation + responsive layout
- Goals + recurring UI wired to full backend API
- Activity audit log on dashboard
