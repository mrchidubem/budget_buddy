## Budget Buddy – Full-Stack Budgeting App

Budget Buddy is a full-stack personal finance app built with a **React + Vite + Tailwind** frontend and a **Node.js + Express + MongoDB** backend. It helps users create budgets, track expenses and income, see insights, and (with the new backend pieces) support recurring transactions and savings goals.

---

### Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS v4, Axios  
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth  
- **Other**: Vite dev server, modular controllers/routes, lints and validation utilities

---

### Core Features (End-to-End)

#### Authentication

- Email + password registration and login.
- JWT-based authentication with protected routes on the backend.
- Frontend `AuthContext` stores the user and token.
- **Inactivity + absolute logout**:
  - After 30 minutes of no activity (mouse, keyboard, scroll), the user is logged out on the client and redirected to `/login`.
  - There is also a 30-minute absolute session timeout based on when the session started; if you come back long after that, the token is cleared and you must log in again.

#### Budgets

- Each user can create multiple **category-based budgets** (Food, Transportation, Utilities, etc.).
- Each budget has:
  - `limit`: monthly amount you allow yourself to spend.
  - `spent`: updated automatically from transactions.
  - `alertThreshold` (percentage) for warnings when you are close to the limit.
  - `description`, `isActive`, timestamps.
- Back-end validation ensures:
  - Category is from the allowed list.
  - Limits are positive.
  - Budgets belong to the logged-in user.

#### Transactions

- Each transaction belongs to:
  - A **budget** (category).
  - A **user**.
  - Has `description`, `amount`, `type` (`income` or `expense`), `date`, `paymentMethod`, and optional `notes`.
- **Auto-updated budgets**:
  - When transactions are created/updated/deleted, the `Transaction` model’s hooks recompute `budget.spent` by aggregating expense transactions for that budget.
- The API supports:
  - Filtering by `budgetId`, `type`, `startDate`, and `endDate`.
  - Fetching single transactions and basic statistics per budget.

#### Recurring Transactions (Backend)

- New `RecurringTransaction` model:
  - Fields for `userId`, `budgetId`, `description`, `amount`, `type`, `paymentMethod`, `notes`.
  - `recurrence` object with `frequency` (`daily`, `weekly`, `monthly`, `yearly`), `weekday` or `dayOfMonth`, and optional `startDate`/`endDate`.
  - `isActive` and `lastRunAt` to prevent duplicate runs.
- Endpoints:
  - `GET /api/recurring-transactions` – list templates for the logged-in user.
  - `POST /api/recurring-transactions` – create a recurring template (validates amount, type, and budget ownership).
  - `PUT /api/recurring-transactions/:id` – update.
  - `DELETE /api/recurring-transactions/:id` – delete.
- Worker: `src/workers/recurringWorker.js`:
  - Connects to MongoDB and runs an interval job.
  - Once per day, checks which templates should trigger **today** based on their recurrence rules.
  - Creates real `Transaction` documents from templates, which then update budgets as usual.
  - Run with:
    - `node src/workers/recurringWorker.js`

#### Savings Goals (Backend)

- New `Goal` model:
  - `userId`, `name`, `targetAmount`, `currentAmount`, optional `deadline` and `category`, and `isActive`.
- Endpoints:
  - `GET /api/goals` – list goals for the current user.
  - `POST /api/goals` – create a goal.
  - `PUT /api/goals/:id` – update a goal.
  - `DELETE /api/goals/:id` – delete a goal.
- These endpoints provide the server side for adding a **goals UI** later (e.g. show progress bars and link them to savings-related transactions).

#### Email Service (Safe by Default)

- `src/utils/emailService.js` is a thin wrapper for sending:
  - Budget alerts.
  - Monthly summaries.
- By default it **logs emails** (so nothing breaks if there’s no provider).
- To integrate a real provider like SendGrid:
  1. `npm install @sendgrid/mail` in `server`.
  2. Add to `.env`:
     - `SENDGRID_API_KEY=...`
     - `EMAIL_FROM="Budget Buddy <no-reply@yourdomain.com>"`
  3. Uncomment the SendGrid-specific code in `emailService.js`.

#### In‑App Notifications

- `NotificationContext` manages toast notifications with `addNotification`, `removeNotification`, and `clearAll`.
- `NotificationToast` renders individual toasts using consistent success/error/warning/info color styles.
- `NotificationContainer` is mounted once in `main.jsx` so any part of the app (auth, budgets, transactions) can show user feedback.

---

### Frontend Pages & UI

#### Login & Register

- Full-screen gradient background with a centered auth card.
- Login:
  - Email + password with validation.
  - Password visibility toggle.
  - “Remember me” and “Forgot password?” affordances.
- Register:
  - Name, email, password, confirm password.
  - Strength check (length and complexity) with feedback.
  - Matching password fields with show/hide toggles.

#### Main Navigation

- Sticky **dark header** (`bg-slate-900` with backdrop blur) with:
  - Gradient logo tile and brand text (“Budget Buddy / Smart personal finance”).
  - Center nav:
    - `Overview` → `/dashboard`
    - `Budgets` → `/budgets`
    - `Reports` → `/reports`
  - User avatar with initials, user dropdown, and logout.
  - Mobile nav menu with responsive links.

#### Dashboard (`/dashboard`)

- Personalized hero section:
  - “Welcome back” pre-title.
  - Title: `"{name}, here’s your money snapshot"` (or a generic fallback).
  - Short, focused description.
  - Quick actions:
    - “+ New Budget”
    - “+ Transaction” (enabled when a budget is selected).
- **Tabs**:
  - `Overview`:
    - KPI row via `Summary`:
      - Total monthly budget.
      - Total spent.
      - Remaining.
      - “Biggest spend category” dark card (shows where most money goes).
    - Budgets section:
      - “+ Create New Budget” button.
      - Grid of budget cards (`BudgetCard`).
    - Summary section:
      - Budget alerts where spending crosses `alertThreshold`.
      - Recent transactions list.
  - `Transactions`:
    - Header showing chosen budget or “All Transactions”.
    - Buttons:
      - “+ Add Transaction” (when a budget is selected).
      - “Export CSV” to download filtered transactions as `transactions.csv`.
    - Filters:
      - Search by description/notes.
      - Type (All / Expense / Income).
      - Min and max amount.
    - Transaction list grouped by date with edit/delete actions.

#### Budgets Page (`/budgets`)

- Page header with short description.
- “+ New Budget” button.
- Filters:
  - Search by category text.
  - Category dropdown (Food, Utilities, etc.).
- Stats snippet (`BudgetStats` on desktop) and filtered budget grid.
- Each `BudgetCard` shows:
  - Emoji icon + category.
  - Status pill:
    - “On track”.
    - “Near limit” (based on `alertThreshold`).
    - “Over budget”.
  - Progress bar, spent/remaining/progress percentages.
  - Edit/delete actions and “+ Add Transaction” button.

#### Reports Page (`/reports`)

- Overview copy explaining that this view is for insights.
- On non-empty data:
  - Reuses the KPI row (`BudgetStats`).
  - Wraps `Summary` in a card to show alerts and recent transactions.
- On empty data:
  - Clear empty state encouraging the user to create budgets first.

---

### How Things Work Together

- **Auth flow**:
  1. User registers or logs in via the client.
  2. Backend returns a JWT and user info; client stores them in `localStorage`.
  3. All API calls from `client/src/services/api.js` include the `Authorization: Bearer <token>` header.
  4. `AuthContext` verifies the token on app load and enforces a 30-minute inactivity logout.

- **Budgets & transactions**:
  1. User creates budgets (limit, category, alert threshold).
  2. User adds transactions (linked to budgets).
  3. Backend post-save hooks on `Transaction` recompute `Budget.spent`.
  4. Frontend contexts/hooks (`BudgetContext` + `useBudget`) fetch latest budgets and transactions and provide them to pages.
  5. Dashboard & Budgets UI display spending progress, status, and alerts.

- **Recurring & goals (backend)**:
  - Recurring templates and goals live in their own collections.
  - The worker generates real transactions from templates every day.
  - Goals endpoints make it possible to add a dedicated “Goals” UI later.

---

### Running the Project

1. **Backend**
   - `cd server`
   - Create a `.env` with at least:
     - `MONGODB_URI=...`
     - `JWT_SECRET=...`
     - `CORS_ORIGIN=http://localhost:3000`
   - Install dependencies and start:
     - `npm install`
     - `npm run dev` (or the start script you use).
   - (Optional) Start the recurring worker:
     - `node src/workers/recurringWorker.js`

2. **Frontend**
   - `cd client`
   - Create `.env` with:
     - `VITE_API_URL=http://localhost:5000/api`
   - Install and run:
     - `npm install`
     - `npm run dev`

Then open the app (by default `http://localhost:3000`), register a user, log in, and explore:
- `Overview` dashboard for a personal snapshot.
- `Budgets` to manage all categories.
- `Reports` to see KPI cards, alerts, and recent transactions.

