# Database Cleanup & Frontend Stats Synchronization Plan

This plan details the identification, safe deletion of zero-question companies from the PostgreSQL database, and synchronization of all frontend references with the exact updated counts.

---

## 🔍 Database Audit Findings

We queried the database and identified the exact state:

| Metric | Current Count | After Cleanup | Note |
|---|---|---|---|
| **Total Companies** | **471** | **429** | **42 companies have 0 questions** |
| **Total Questions** | **3,392** | **3,392** | All questions have active company mappings |
| **DSA Topics** | **173** | **173** | Unchanged |

### The 42 Zero-Question Companies to be Deleted:
1. `.git` (artifact entry)
2. `BILL Holdings` (`bill-holdings`)
3. `BP` (`bp`)
4. `Bentley Systems` (`bentley-systems`)
5. `BharatPe` (`bharatpe`)
6. `Blizzard` (`blizzard`)
7. `Block` (`block`)
8. `Bosch` (`bosch`)
9. `Brex` (`brex`)
10. `CEDCOSS` (`cedcoss`)
11. `Celigo` (`celigo`)
12. `Coforge` (`coforge`)
13. `ConsultAdd` (`consultadd`)
14. `Coveo` (`coveo`)
15. `Credit Karma` (`credit-karma`)
16. `DXC Technology` (`dxc-technology`)
17. `Devtron` (`devtron`)
18. `Electronic Arts` (`electronic-arts`)
19. `Genpact` (`genpact`)
20. `Gojek` (`gojek`)
21. `Graviton` (`graviton`)
22. `Hertz` (`hertz`)
23. `Hiver` (`hiver`)
24. `INDmoney` (`indmoney`)
25. `J.P. Morgan` (`j-p-morgan`)
26. `Komprise` (`komprise`)
27. `Licious` (`licious`)
28. `MSCI` (`msci`)
29. `Miro` (`miro`)
30. `Mountblue` (`mountblue`)
31. `NinjaCart` (`ninjacart`)
32. `Notion` (`notion`)
33. `Opendoor` (`opendoor`)
34. `Palantir Technologies` (`palantir-technologies`)
35. `QBurst` (`qburst`)
36. `Roche` (`roche`)
37. `Tejas Networks` (`tejas-networks`)
38. `Turo` (`turo`)
39. `Vanguard` (`vanguard`)
40. `WatchGuard` (`watchguard`)
41. `WinZO` (`winzo`)
42. `Yext` (`yext`)

---

## User Review Required

> [!NOTE]
> Deleting these 42 empty company records will permanently remove only records with `CompanyQuestion` count = 0. No interview questions, user bookmarks, or user progress records will be deleted or altered.

---

## Proposed Changes

### 1. Database Cleanup (Backend)

#### [NEW] [clean-empty-companies.js](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/backend/scripts/clean-empty-companies.js)
- Standalone, safe script using Prisma client to find and delete all companies matching `questions: { none: {} }`.
- Logs execution details and updated database statistics.

---

### 2. Frontend Stats & Text Updates

Sync all hardcoded fallback stats (`471+` → `429+`, `3,257+` → `3,392+`, `74` → `173`) across all pages and meta tags.

#### [MODIFY] [Landing.jsx](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Landing.jsx)
- Update hero text: `471+ top companies` → `429+ top companies`
- Update fallback stats: `totalCompanies: 429`, `totalQuestions: 3392`, `totalTopics: 173`
- Update CTA button: `View All 429+ Companies`

#### [MODIFY] [Dashboard.jsx](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Dashboard.jsx)
- Update explore CTA: `Explore 429+ Companies`
- Update stat tag: `429+ Companies`

#### [MODIFY] [About.jsx](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/About.jsx)
- Update hero description: `3,392+ real LeetCode questions` across `429+ top technology employers`
- Update stat numbers: `429+ Target Companies`, `3,392+ Interview Questions`
- Update tier breakdown paragraph: `We classify 429+ companies...`

#### [MODIFY] [Contact.jsx](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Contact.jsx)
- Update FAQ #1: `All 429+ target companies, 3,392+ LeetCode questions...`

#### [MODIFY] [Footer.jsx](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Footer.jsx)
- Update link label: `Browse All 429+ Companies →`

#### [MODIFY] [index.html](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/index.html)
- Update meta description tag: `Browse 429+ companies' real LeetCode DSA questions...`

---

## Verification Plan

### Automated Database & Build Verification
1. Run cleanup script:
   ```bash
   node backend/scripts/clean-empty-companies.js
   ```
2. Verify zero empty companies remain in PostgreSQL.
3. Test backend `/api/stats` and `/api/companies` endpoints.
4. Run `npx vite build` on frontend to verify 0 build errors.

### Manual Verification
1. Open Landing page → Verify live stats show `429+ Target Companies` and `3,392+ Questions`.
2. Open Companies directory page → Verify all 429 companies have questions > 0.
3. Open Dashboard, About, Contact, Footer → Verify all numbers are consistent.
