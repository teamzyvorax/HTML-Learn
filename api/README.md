# ZYVORA HTML LAB API

This folder contains the first backend foundation: authentication, course catalogue, cloud progress, and lesson-attempt records.

## Local development

Requirements: Node.js 20+ and PostgreSQL 14+.

1. Create a PostgreSQL database named `zyvora_lab`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and `WEB_ORIGIN`.
3. Install and build:

```sh
npm install
npm run build
npm run migrate
npm start
```

The API listens on port 10000 by default. Check `GET /health`.

## Endpoints

- `POST /api/v1/auth/signup` — `{ "email", "password", "displayName" }`; passwords must be at least 12 characters.
- `POST /api/v1/auth/login` — `{ "email", "password" }`.
- `GET /api/v1/me` — Bearer access token required.
- `GET /api/v1/courses` — course catalogue and runtime status.
- `GET /api/v1/me/progress` — Bearer token required.
- `PUT /api/v1/me/progress/:courseSlug` — save progress for the signed-in user.
- `POST /api/v1/attempts` — records a task/quiz attempt.

Access tokens expire after two hours. Sign-in returns a token; use it as `Authorization: Bearer <token>`. Do not put tokens in URLs or logs.

## Deploy with Render

The repository root includes `render.yaml`. In Render, create a new Blueprint and select this repository. Review the database and web-service plans and pricing before confirming. After deploy, test `https://YOUR-API.onrender.com/health`.

The frontend origin is configured in `WEB_ORIGIN`; include the exact GitHub Pages origin and any production custom domain. Do not use a wildcard CORS origin with authenticated endpoints.

## Security notes and current limitations

- New accounts always receive the `student` role. Never accept a role from public signup input.
- Admin authorization middleware exists, but no public admin-promotion route is provided. Grant admin roles only through a controlled database/operator process.
- This API does not execute arbitrary code. The browser preview is not a Python/Java/C++ compiler. A separate isolated runner service and security review are required before enabling execution.
- Progress endpoints validate the payload shape and require task/quiz completion flags to be consistent. Because browser-supplied progress is not proof of actual lesson correctness, certificates must wait for server-side grading and reviewed lesson tests.
- For a public launch, add email verification, password reset, abuse monitoring, automated tests, database backup/restore checks, and a proper secret rotation process.
