# 🔜 Backend — Pending Development Tasks

**Last Updated:** August 9, 2026  
**Backend Status:** ✅ Core complete — polish + missing features below

---

## ✅ What's Already Done

| Area | Status |
|---|---|
| Auth (Register / Login / JWT) | ✅ Done |
| Rate Limiting (auth + general) | ✅ Done |
| Progress tracking (single + bulk) | ✅ Done |
| Bookmarks (toggle) | ✅ Done |
| Dashboard stats | ✅ Done |
| Company list + detail + stats | ✅ Done |
| Search (title + difficulty filter) | ✅ Done |
| Topics (list + detail + filter) | ✅ Done |
| Global error handler | ✅ Done |
| Helmet + CORS security | ✅ Done |
| Prisma schema + migrations | ✅ Done |

---

## 🔴 HIGH Priority

### 1. User Profile Update API Missing
`GET /api/me` exists (read profile) but there's no endpoint to **update** name, avatar, or password.

```
PUT /api/me
Body: { name, avatar }

PUT /api/me/password
Body: { currentPassword, newPassword }
```

---

### 2. Question Detail Route Missing
There is no `GET /api/questions/:slug` — no way to view full details of a single problem.

**Frontend needs this for:** clicking a problem card to see all companies that asked it, topics, etc.

---

### 3. No Input Validation Library
Validation is done manually with scattered `if (!email)` checks.  
**Fix:** Add `zod` for schema-based validation — catches edge cases early.

---

### 4. Prisma Error Handler is Too Generic
Raw Prisma error codes (like `P2002` for unique constraint) leak to the client.

```js
// Needed in errorHandler.js:
if (err.code === 'P2002') {
  return res.status(409).json({ error: 'Already exists' });
}
```

---

### 5. No Token Refresh / Logout
JWT expires after 7 days — user gets silently 401'd with no recovery path.

- Add `POST /api/auth/refresh` to issue a new token
- Add token invalidation (blacklist table or Redis) for proper logout

---

## 🟡 MEDIUM Priority

### 6. No Request Logging
Zero HTTP log visibility in dev or production.  
**Fix:** Add `morgan` — 2-line change in `app.js`.

```js
app.use(require('morgan')('dev'));
```

---

### 7. No Pagination on `/api/progress` and `/api/bookmarks`
Both routes dump **all** records — could be 1000+ for active users.  
**Fix:** Add `page` + `limit` query params using Prisma `take`/`skip`.

---

### 8. No `notes` Field on Progress
Users can't save personal notes per problem.

**Schema addition:**
```prisma
model Progress {
  // existing...
  notes    String?    // personal notes
  solvedAt DateTime?  // first time solved
}
```

---

### 9. Search is Title-Only
`GET /api/search?q=...` only searches by **title**.  
**Fix:** Extend to search topic names and company names too.

---

### 10. No Avatar Upload Support
The `User` model has `avatar` field but no endpoint to upload/store a profile picture.  
**Fix:** Add `POST /api/me/avatar` using `multer` (or accept a URL string for simplicity).

---

## 🟢 LOW Priority

### 11. No Tests
Zero unit or integration tests.  
**Fix:** Add `jest` + `supertest`. Start with auth and progress routes.

---

### 12. No `.env.example` File
New developers have no template for required env vars.  
**Fix:** Create `.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dsa_db
JWT_SECRET=your_super_secret_key_change_this_in_production
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### 13. No API Versioning
All routes are at `/api/...` — breaking changes break all clients instantly.  
**Fix:** Prefix with `/api/v1/...` now while it's still easy.

---

### 14. Lightweight Company Slugs Endpoint Missing
`GET /api/companies` is heavy (returns questionCount + topTopics for every company).  
Frontend navigation only needs slugs.

**Fix:**
```
GET /api/companies/slugs
→ [{ name: "Google", slug: "google" }, ...]
```

---

## Summary Table

| Priority | Task | Effort |
|---|---|---|
| 🔴 HIGH | `PUT /api/me` — profile update | Small |
| 🔴 HIGH | `GET /api/questions/:slug` | Small |
| 🔴 HIGH | Prisma error codes in errorHandler | Small |
| 🔴 HIGH | Input validation with `zod` | Medium |
| 🔴 HIGH | Token refresh + logout | Medium |
| 🟡 MED | Pagination on progress/bookmarks | Small |
| 🟡 MED | `notes` + `solvedAt` on Progress model | Small |
| 🟡 MED | `morgan` request logging | Tiny |
| 🟡 MED | Extend search to topics + companies | Medium |
| 🟡 MED | Avatar upload endpoint | Medium |
| 🟢 LOW | Tests (jest + supertest) | Large |
| 🟢 LOW | `.env.example` file | Tiny |
| 🟢 LOW | API versioning `/api/v1/` | Small |
| 🟢 LOW | `/api/companies/slugs` lightweight endpoint | Tiny |
