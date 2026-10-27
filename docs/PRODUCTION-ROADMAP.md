# ZYVORA HTML LAB — Production Roadmap

## Product goal
Build an expandable, multilingual coding academy with individual course routes, interactive lessons, quizzes, projects, saved progress, certificates, a leaderboard, and an admin console.

## Current frontend baseline
- Static GitHub Pages frontend in `index.html`.
- 38 course cards are currently listed in the course catalogue.
- The learning roadmap now advertises 10,000 levels.
- Course progress and quiz completion are stored locally in the browser.
- The current in-browser preview is appropriate for HTML/CSS/JavaScript-style content only.
- Task completion and the quick-check quiz are both required before the next level unlocks.

## Important scope honesty
A 10,000-level roadmap is a capacity target, not 10,000 individually authored and reviewed lessons. The existing lessons beyond the initial topics are generated from reusable templates. Content should be authored, tested, localized, and reviewed in batches before claiming each level is complete.

A course card for Python, Java, C++, SQL, PHP, and other backend or compiled languages does not mean that language executes in the browser today. Do not evaluate arbitrary code on the web server or claim a runtime is live until a sandboxed execution service has been deployed and tested.

## Recommended architecture
- **Frontend:** keep the current static site initially; migrate to a component-based app only when the separate course route and testing benefits justify it.
- **API:** Node.js + TypeScript service, versioned under `/api/v1`.
- **Database:** PostgreSQL for users, courses, lessons, attempts, progress, projects, certificates, and moderation/audit events.
- **Authentication:** managed identity provider or secure server-side sessions; email verification, password reset, rate limits, CSRF protections where applicable, and secure cookies.
- **Code execution:** isolated, ephemeral containers or a reputable execution provider. No host filesystem access, secrets, network access by default, strict CPU/memory/time limits, per-language allowlists, and automatic cleanup.
- **Hosting:** static frontend on GitHub Pages or CDN; API and worker on a backend host; managed PostgreSQL; custom domain with HTTPS.
- **Observability:** structured logs, health checks, error reporting, backup/restore drills, and abuse monitoring.

## Suggested API surface
- `GET /api/v1/courses`
- `GET /api/v1/courses/:slug/lessons?cursor=...`
- `GET /api/v1/lessons/:id`
- `POST /api/v1/lessons/:id/attempts`
- `GET /api/v1/me/progress`
- `PUT /api/v1/me/progress/:courseSlug`
- `POST /api/v1/runs` (rate-limited, sandboxed execution only)
- `GET /api/v1/leaderboard`
- `GET /api/v1/certificates/:id`
- Admin-only course/lesson CRUD routes protected by role-based access control.

## Release phases
1. **Foundation:** responsive UI, course catalogue, URL-addressable course pages, browser-saved progress, accessible navigation, tests, and accurate feature labels.
2. **Learning engine:** structured lesson schema, original reviewed lessons, task and quiz validation, projects, streaks/badges, and import/export.
3. **Backend:** authentication, PostgreSQL persistence, progress sync, API validation, rate limits, backups, and admin roles.
4. **Execution:** launch HTML/CSS/JS preview first; add Python/Java/C++/SQL runtimes only after sandbox security review and end-to-end tests.
5. **Academy features:** certificates with verifiable IDs, fair leaderboard rules, admin audit logs, translation workflow, and localization QA.
6. **Production launch:** custom domain, HTTPS, monitoring, accessibility checks, performance budget, security review, restore test, and smoke tests.

## Acceptance criteria
- No course claims real execution unless the runtime is available and tested.
- Task and quiz must both pass before a level is marked complete.
- Progress survives refresh in the same browser; cloud sync is labelled unavailable until API/authentication are deployed.
- UI translations must be complete for each language before it is marked fully supported.
- Admin endpoints must enforce server-side authorization; hiding admin buttons is not security.
- Certificates must be generated from server-verified completion data, not client-side flags.
