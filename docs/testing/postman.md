# 🧪 API Testing with Postman

The Postman collection is pre-built and covers all 17 API endpoints with 30 ready-to-run requests including error case tests.

**Collection file:** `backend/DSA_API_Collection.postman_collection.json`

---

## Step 1 — Import the Collection

1. Open **Postman**
2. Click **Import** (top-left button)
3. Select the file: `backend/DSA_API_Collection.postman_collection.json`
4. Click **Import** — all folders and requests appear instantly

---

## Step 2 — Set the Base URL

1. Click the collection name **"DSA Prep Platform API"** in the sidebar
2. Go to the **Variables** tab
3. Set `baseUrl` to your server URL:
   - Development: `http://localhost:5000`
   - Production: `https://your-app.railway.app`
4. Click **Save**

---

## Step 3 — Get a Token (Login First)

1. Open **🔐 Auth → Login**
2. The body is pre-filled — edit email/password if needed
3. Click **Send**
4. The test script runs automatically and saves your JWT to `{{authToken}}`

> 💡 All protected routes use `{{authToken}}` — no manual copy-paste needed!

---

## Step 4 — Test Any Endpoint

Click any request and hit **Send**. That's it.

---

## Collection Structure

| Folder | What's inside |
|---|---|
| 🏥 Health | Server health check |
| 🔐 Auth | Register, Login, Get Me, + 2 error cases |
| 📊 Dashboard | Get full dashboard stats |
| 📈 Progress | Get all, mark single, bulk fetch, + error case |
| 🔖 Bookmarks | Get all, toggle |
| 🏢 Companies | List all, get problems (with filters), stats, + error case |
| 🔍 Search | Search, search+filter, + error case |
| 🏷️ Topics | List all, get topic problems, filter by difficulty, + error case |
| 📉 Stats | Platform-wide stats |

> `❌` prefixed requests **intentionally test error cases** (400, 401, 404) — run them to verify error handling works correctly.

---

## How Token Auto-Save Works

After **Login** or **Register**, Postman runs this test script automatically:

```js
const res = pm.response.json();
if (res.token) {
  pm.collectionVariables.set('authToken', res.token);
}
```

Every protected request already has this header pre-configured:
```
Authorization: Bearer {{authToken}}
```

Postman substitutes `{{authToken}}` with the saved token at request time.

---

## How Variables Work

| Variable | Value | Purpose |
|---|---|---|
| `{{baseUrl}}` | `http://localhost:5000` | Base URL for all requests |
| `{{authToken}}` | (auto-saved after login) | JWT token for protected routes |

Change `baseUrl` once → all 30 requests update automatically.

---

## Tips

- **Run Collection** — Use Postman's Collection Runner to run all requests sequentially (great for smoke testing after changes)
- **Environment** — You can create separate Postman Environments for `dev` and `prod` — each with its own `baseUrl`
- **Console** — Open Postman Console (`Ctrl+Alt+C`) to see the token save log and debug responses
