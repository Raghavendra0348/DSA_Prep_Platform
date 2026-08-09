# ⚙️ Backend — Local Setup Guide

**Prerequisites:** Node.js 18+, PostgreSQL 14+, npm

---

## Step 1 — Clone & Install

```bash
git clone <repo-url>
cd "Project DSA/backend"
npm install
```

---

## Step 2 — Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE dsa_db;
\q
```

---

## Step 3 — Configure Environment

Create a `.env` file in the `backend/` folder:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/dsa_db"
JWT_SECRET="your_super_secret_key_change_this_in_production"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ Never commit `.env` — it's already in `.gitignore`

---

## Step 4 — Run Migrations

```bash
npx prisma migrate deploy   # apply the baseline migration
npx prisma generate         # generate the Prisma client
```

---

## Step 5 — Import Data

Run the CSV import script **once** to populate the database:

```bash
npm run import
```

This reads 471 company CSV folders from `leetcode-company-wise-problems/` and loads:
- 471 Companies
- 3,257 unique Questions
- ~50,000 CompanyQuestion links
- 74 unique Topics

Takes ~2 minutes to complete.

---

## Step 6 — Start the Server

```bash
npm run dev
# Server running on http://localhost:5000
```

**Verify it's working:**
```bash
curl http://localhost:5000/health
# → {"status":"ok"}

curl http://localhost:5000/api/stats
# → {"stats":{"totalCompanies":471,"totalQuestions":3257,...}}
```

---

## Optional — View Database in Browser

```bash
npm run studio
# Opens Prisma Studio at http://localhost:5555
# Visual table browser — view/edit data directly
```

---

## Switching to Production Database (Aiven)

Only one line changes in `.env`:

```env
# Development
DATABASE_URL="postgresql://postgres:password@localhost:5432/dsa_db"

# Production (Aiven)
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require"
```

Zero code changes needed — Prisma handles it automatically.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED` on startup | PostgreSQL not running — start it with `sudo service postgresql start` |
| `P1001: Can't reach database` | Check `DATABASE_URL` in `.env` — wrong password or port |
| `Table does not exist` | Run `npx prisma migrate deploy` |
| `Module not found: generated/prisma` | Run `npx prisma generate` |
| `npm run import` fails | Make sure the `leetcode-company-wise-problems/` folder is at the project root |
| Port 5000 in use | Change `PORT=5001` in `.env` |
