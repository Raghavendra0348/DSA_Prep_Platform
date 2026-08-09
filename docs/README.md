# 📚 DSA Prep Platform — Documentation

> **One place for everything** — product decisions, architecture, API reference, dev setup, and what's next.

---

## 📁 Docs Structure

```
docs/
├── README.md                    ← You are here (index)
│
├── product/
│   └── PRD.md                   ← Product Requirements Document (what & why)
│
├── backend/
│   ├── architecture.md          ← System design, DB schema, file structure
│   ├── api-reference.md         ← Complete API docs with request/response examples
│   ├── setup.md                 ← Local dev setup guide (DB + server)
│   └── pending.md               ← What's left to build (prioritized)
│
└── testing/
    └── postman.md               ← How to use the Postman collection
```

---

## 🚀 Quick Links

| What | Doc |
|---|---|
| What is this project? | [product/PRD.md](./product/PRD.md) |
| How is the backend structured? | [backend/architecture.md](./backend/architecture.md) |
| All API endpoints + examples | [backend/api-reference.md](./backend/api-reference.md) |
| Set up local dev environment | [backend/setup.md](./backend/setup.md) |
| What's pending / TODO | [backend/pending.md](./backend/pending.md) |
| How to test APIs in Postman | [testing/postman.md](./testing/postman.md) |

---

## 📊 Project Status (August 2026)

| Layer | Status |
|---|---|
| ✅ Database (PostgreSQL + Prisma) | Complete |
| ✅ Backend API (Express, 17 endpoints) | Complete |
| ✅ Auth (JWT + bcrypt) | Complete |
| ✅ Data Import (471 companies, 3,257 questions) | Complete |
| 🔜 Frontend (React + Vite) | In Progress |
| 🔜 Deployment (Railway + Aiven + Vercel) | Pending |
