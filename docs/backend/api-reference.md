# 📡 API Reference

**Base URL (dev):** `http://localhost:5000`  
**Base URL (prod):** `https://your-app.railway.app`

All protected routes require: `Authorization: Bearer <token>`

---

## Rate Limits

| Route Group | Limit |
|---|---|
| `/api/auth/*`, `/api/me` | 10 requests / 15 minutes / IP |
| All other `/api/*` | 100 requests / minute / IP |

---

## 🌍 Public Routes

### `GET /health`
Server health check.
```json
{ "status": "ok" }
```

---

### `GET /api/stats`
Platform-wide statistics.
```json
{
  "success": true,
  "stats": {
    "totalCompanies": 471,
    "totalQuestions": 3257,
    "totalUsers": 42,
    "totalTopics": 74,
    "lastUpdated": "2026-08-09T...",
    "difficultyBreakdown": { "EASY": 787, "MEDIUM": 1731, "HARD": 739 }
  }
}
```

---

### `GET /api/companies`
All companies with question count and top topics.
```json
{
  "success": true,
  "total": 471,
  "companies": [
    { "name": "Google", "slug": "google", "questionCount": 443, "topTopics": ["Array","DP","Tree","Graph","String"] }
  ]
}
```

---

### `GET /api/company/:slug`

Returns paginated, filtered problems for one company.

**Query Params:**

| Param | Values | Default |
|---|---|---|
| `period` | `30days \| 3months \| 6months \| 6plus \| all` | `all` |
| `difficulty` | `EASY,MEDIUM,HARD` (comma-separated) | — |
| `topics` | `Array,Dynamic Programming` (comma-separated) | — |
| `sortBy` | `frequency \| acceptanceRate \| difficulty \| title` | `frequency` |
| `page` | integer | `1` |
| `limit` | integer (max 200) | `50` |

**Response (unauthenticated):**
```json
{
  "success": true,
  "company": "Google",
  "slug": "google",
  "period": "all",
  "authenticated": false,
  "pagination": { "page": 1, "limit": 50, "total": 443, "totalPages": 9 },
  "problems": [
    {
      "id": 3,
      "slug": "two-sum",
      "title": "Two Sum",
      "difficulty": "EASY",
      "link": "https://leetcode.com/problems/two-sum",
      "topics": ["Array", "Hash Table"],
      "frequency": 100,
      "acceptanceRate": 54.2,
      "status": null,
      "bookmarked": null
    }
  ]
}
```

**When authenticated** (Bearer token sent), each problem includes real values:
```json
"status": "solved",
"bookmarked": true
```

---

### `GET /api/company/:slug/stats`
Difficulty + topic breakdown per time period.
```json
{
  "success": true,
  "company": "Google",
  "stats": {
    "30days":  { "total": 172, "easy": 45, "medium": 89, "hard": 38, "topTopics": ["Array","DP"] },
    "3months": { "total": 289, "easy": 72, "medium": 148, "hard": 69, "topTopics": ["..."] }
  }
}
```

---

### `GET /api/search`

**Query Params:**

| Param | Description |
|---|---|
| `q` | Search term (min 2 characters, required) |
| `difficulty` | `EASY \| MEDIUM \| HARD` |
| `limit` | Max 100, default 20 |

```json
{
  "success": true,
  "query": "two sum",
  "total": 6,
  "results": [
    {
      "id": 3,
      "slug": "two-sum",
      "title": "Two Sum",
      "difficulty": "EASY",
      "topics": ["Array", "Hash Table"],
      "companyCount": 115,
      "companies": [{ "name": "Google", "slug": "google", "frequency": 100 }]
    }
  ]
}
```

---

### `GET /api/topics`
All DSA topics sorted by problem count.
```json
{
  "success": true,
  "total": 74,
  "topics": [
    { "name": "Array", "slug": "array", "problemCount": 1856 }
  ]
}
```

---

### `GET /api/topics/:topic`
Problems for a specific topic. Slug is case-insensitive.

`/api/topics/dynamic-programming` → resolves to `"Dynamic Programming"`

**Query Params:** `difficulty`, `page`, `limit`

```json
{
  "success": true,
  "topic": "Dynamic Programming",
  "total": 584,
  "questions": [ { "id": 3, "title": "...", "difficulty": "MEDIUM", ... } ]
}
```

---

## 🔐 Auth Routes

### `POST /api/auth/register`
```json
// Request body:
{ "email": "user@gmail.com", "name": "Ravi", "password": "mypass123" }

// Validations:
// - email must be valid format
// - password minimum 6 characters
// - name cannot be blank or whitespace
```
```json
// Response 201:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com" }
}
```

**Error responses:**
| Status | Error |
|---|---|
| 400 | `All fields required` |
| 400 | `Invalid email format` |
| 400 | `Password must be at least 6 characters` |
| 409 | `Email already registered` |

---

### `POST /api/auth/login`
```json
// Request body:
{ "email": "user@gmail.com", "password": "mypass123" }
```
```json
// Response 200:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com" }
}
```

> JWT tokens expire in **7 days**.  
> Send as: `Authorization: Bearer <token>`

---

## 🔒 Protected Routes

> All routes below require `Authorization: Bearer <token>` header.

---

### `GET /api/me`
Returns the currently logged-in user's profile.
```json
{
  "success": true,
  "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com", "avatar": null, "createdAt": "..." }
}
```

---

### `GET /api/dashboard`
Complete user stats in one call (all parallel DB queries).
```json
{
  "success": true,
  "overview": {
    "totalSolved": 42,
    "totalAttempted": 17,
    "totalBookmarks": 8,
    "totalQuestions": 3257
  },
  "difficulty": { "easy": 15, "medium": 22, "hard": 5 },
  "topCompanies": [
    { "name": "Google", "slug": "google", "solvedCount": 12 }
  ],
  "topTopics": [
    { "name": "Dynamic Programming", "solvedCount": 9 }
  ],
  "recentActivity": [
    { "questionId": 3, "slug": "two-sum", "title": "Two Sum", "difficulty": "EASY", "status": "solved", "updatedAt": "..." }
  ]
}
```

---

### `GET /api/progress`
All progress records for the logged-in user.
```json
{
  "success": true,
  "progress": [
    { "questionId": 3, "status": "solved", "updatedAt": "...", "question": { "slug": "two-sum", "title": "Two Sum" } }
  ]
}
```

---

### `POST /api/progress`
Upsert (create or update) progress for a single question.
```json
// Body:
{ "questionId": 3, "status": "solved" }

// status values: "solved" | "attempted" | "not-started"
```
```json
// Response:
{ "success": true, "progress": { "userId": "...", "questionId": 3, "status": "solved", "updatedAt": "..." } }
```

---

### `POST /api/progress/bulk`
Fetch statuses for many question IDs in one request (used by company page — avoids N+1 calls).
```json
// Body: (max 500 IDs)
{ "questionIds": [3, 7, 15, 22] }
```
```json
// Response — only questions with a status are included (absent = not-started):
{ "success": true, "progress": { "3": "solved", "7": "attempted" } }
```

---

### `GET /api/bookmarks`
All bookmarked questions for the logged-in user.
```json
{
  "success": true,
  "bookmarks": [
    { "questionId": 3, "createdAt": "...", "question": { "id": 3, "slug": "two-sum", "title": "Two Sum", "difficulty": "EASY", ... } }
  ]
}
```

---

### `POST /api/bookmarks`
Toggle a bookmark on/off (idempotent).
```json
// Body:
{ "questionId": 3 }
```
```json
// Response — bookmarked: true if added, false if removed:
{ "success": true, "bookmarked": true }
```

---

## Error Response Format

All errors follow this shape:
```json
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:

| Status | Meaning |
|---|---|
| 400 | Bad request — missing or invalid input |
| 401 | Unauthorized — missing or invalid JWT |
| 404 | Not found — company/user/question doesn't exist |
| 409 | Conflict — e.g., email already registered |
| 429 | Too many requests — rate limit hit |
| 500 | Internal server error |
