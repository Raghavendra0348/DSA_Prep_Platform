# ✅ High Priority Fixes — Implementation Log

**Date:** August 9, 2026  
**Status:** All 5 high-priority backend tasks completed.

---

## What Was Fixed & How

---

### Fix 1 — Prisma Error Handler

**Problem:** `errorHandler.js` was 9 lines that just returned `err.message` — raw Prisma internal error messages like `Unique constraint failed on the fields: (\`email\`)` were sent directly to the client.

**What I did:**
- Rewrote `src/middleware/errorHandler.js`
- Added a lookup map for Prisma error codes (`P2002`, `P2003`, `P2025`, `P2000`)
- Added handlers for `ZodError` (from validation) and JWT errors
- Dev vs production: full error logged in dev, hidden in production

**File changed:** `src/middleware/errorHandler.js`

**Before:**
```js
// 9 lines, no special handling
res.status(err.status || 500).json({ error: err.message });
```

**After:**
```js
// Handles: ZodError, P2002 (duplicate), P2003 (foreign key), P2025 (not found), JWT errors
if (err.code === 'P2002') return res.status(409).json({ error: 'A record with this value already exists' });
```

---

### Fix 2 — Zod Input Validation

**Problem:** Validation in `auth.js` was manual `if (!email)` checks — easy to miss edge cases (e.g., empty string `""` would pass `if (!email)` as truthy was not checking format).

**What I did:**
- Installed `zod` (`npm install zod`)
- Defined `registerSchema` and `loginSchema` using `z.object()`
- Replaced all manual checks with `schema.parse(req.body)` — throws `ZodError` automatically on failure, which the new error handler catches and formats cleanly

**Files changed:** `src/routes/auth.js`

**Key pattern:**
```js
const registerSchema = z.object({
  email:    z.string().email('Invalid email format'),
  name:     z.string().trim().min(1, 'Name cannot be empty'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// In route handler:
const { email, name, password } = registerSchema.parse(req.body);
// ^ throws ZodError automatically if invalid — caught by errorHandler
```

---

### Fix 3 — Token Refresh + Proper Logout

**Problem:** JWT expired after 7 days → user silently got 401 with no recovery. Logout only cleared localStorage on frontend — server had no concept of invalidating a session.

**What I did:**

**Step 1 — Added `RefreshToken` model to Prisma schema:**
```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    String
  createdAt DateTime @default(now())
  user      User     @relation(...)
}
```

**Step 2 — Ran migration:**
```bash
npx prisma migrate dev --name add_refresh_token
npx prisma generate
```

**Step 3 — Added `POST /api/auth/refresh`:**
- Accepts `{ refreshToken }` in body
- Verifies JWT signature + checks it exists in DB (not revoked)
- Returns a new access token (short-lived, 7d)
- Refresh tokens live 30 days

**Step 4 — Added `POST /api/auth/logout`:**
- Requires JWT (so we know who is logging out)
- Deletes the refresh token from DB
- If no `refreshToken` in body → deletes ALL tokens for user (logout all devices)

**Files changed:** `src/routes/auth.js`, `prisma/schema.prisma`  
**New migration:** `prisma/migrations/20260809175654_add_refresh_token/`

---

### Fix 4 — `PUT /api/me` (Profile Update)

**Problem:** `GET /api/me` existed but there was no way to update name, avatar, or password. Frontend profile settings page was blocked.

**What I did:**
- Created `src/routes/user.js` — a new route file for all `/api/me` endpoints
- `GET /api/me` — get profile (moved from inline handler in `app.js`)
- `PUT /api/me` — update name + avatar with Zod validation
  - `avatar` must be a valid URL or null
  - Rejects empty updates (nothing to change)
- `PUT /api/me/password` — change password
  - Requires `currentPassword` for verification (security)
  - Prevents setting same password as current
  - Revokes all refresh tokens after password change (force re-login everywhere)
- Moved old inline `/api/me` handler out of `app.js` → clean separation

**File created:** `src/routes/user.js`  
**File changed:** `src/app.js` (registered `app.use('/api/me', require('./routes/user'))`)

---

### Fix 5 — `GET /api/questions/:slug`

**Problem:** No endpoint to view a single question's full details. Frontend couldn't build a problem detail page — there was no way to get all companies that asked a problem, or a user's status on it.

**What I did:**
- Created `src/routes/questions.js`
- Fetches the question by slug with all companies that asked it (ordered by frequency)
- Uses the same `optionalAuth()` pattern as `company.js`:
  - Anonymous users get `status: null`, `bookmarked: null`
  - Authenticated users get real values fetched in parallel

**File created:** `src/routes/questions.js`  
**File changed:** `src/app.js` (registered `app.use('/api/questions', require('./routes/questions'))`)

**Response shape:**
```json
{
  "question": {
    "id": 3,
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "EASY",
    "link": "https://leetcode.com/problems/two-sum",
    "topics": ["Array", "Hash Table"],
    "companyCount": 115,
    "companies": [{ "name": "Google", "slug": "google", "frequency": 100 }],
    "status": "solved",
    "bookmarked": true
  }
}
```

---

## Files Changed Summary

| File | Action | What Changed |
|---|---|---|
| `src/middleware/errorHandler.js` | Modified | Prisma + Zod + JWT error handling |
| `src/routes/auth.js` | Modified | Zod validation, added `/refresh` and `/logout` |
| `src/routes/user.js` | **Created** | `GET/PUT /api/me`, `PUT /api/me/password` |
| `src/routes/questions.js` | **Created** | `GET /api/questions/:slug` |
| `src/app.js` | Modified | Wired up new routes, removed inline handler |
| `prisma/schema.prisma` | Modified | Added `RefreshToken` model |
| `prisma/migrations/.../migration.sql` | **Auto-created** | DB migration for `refresh_tokens` table |

---

## New API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/questions/:slug` | Optional | Full question detail + companies |
| `GET` | `/api/me` | 🔐 | Get user profile |
| `PUT` | `/api/me` | 🔐 | Update name / avatar |
| `PUT` | `/api/me/password` | 🔐 | Change password |
| `POST` | `/api/auth/refresh` | None | Get new access token via refresh token |
| `POST` | `/api/auth/logout` | 🔐 | Revoke refresh token (server-side logout) |

---

## Testing the New Endpoints

**1. Register (now returns both tokens):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","password":"pass123"}'
# → { token: "eyJ...", refreshToken: "eyJ..." }
```

**2. Refresh token:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ..."}'
# → { token: "eyJ...new access token..." }
```

**3. Update profile:**
```bash
curl -X PUT http://localhost:5000/api/me \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
```

**4. Question detail:**
```bash
curl http://localhost:5000/api/questions/two-sum
```

**5. Zod validation (should return clean error):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"123"}'
# → { error: "Validation failed", issues: [...] }
```
