# ZYVORA CODEVERSE

**Build. Break. Learn. Create.**

ZYVORA CODEVERSE is evolving from HTML LAB into a multilingual developer-learning universe: language tracks, progressive levels, an interactive browser IDE, challenge unlocking, local progression, and a production-ready backend architecture for cloud accounts and isolated compute.

## Current frontend build
- 70+ language and framework tracks across Web, Backend, Systems, Data, DevOps, General and Web3
- 10,000 progressive levels per track in the learning model
- Search and category filtering
- Interactive Codeverse IDE workspace
- Real sandboxed browser execution for HTML, CSS and JavaScript
- Challenge submission, hints, level unlocks and XP
- Local progression across sessions
- Developer progression dashboard
- Responsive futuristic Zyvora interface
- Runtime architecture prepared for isolated Python, Java, C++, Rust and other workers

## Important runtime boundary
The frontend does **not** pretend to execute server languages. HTML/CSS/JavaScript run locally in a sandboxed iframe. Python, Java, C/C++, Rust and other arbitrary-code runtimes require an isolated backend worker/container before they can safely execute user code.

## Backend
The repository also contains a TypeScript/Express/PostgreSQL API under `api/` for authentication, progress and lesson attempts. Production cloud progress requires a configured `DATABASE_URL`; the static frontend remains usable without it.

## GitHub Pages
The static frontend is designed for GitHub Pages from the `main` branch root.

Expected URL:
`https://teamzyvorax.github.io/HTML-Learn/`

## Roadmap
1. Language-specific lesson/content packs
2. Verified task + quiz progression on the server
3. Isolated multi-language compute workers
4. Project workspaces and multi-file repositories
5. Cloud profiles, streaks, achievements and leaderboard
6. Certificates with server verification
7. AI tutor/debugger integration
8. Admin/content-authoring system

The roadmap is intentionally staged so the platform does not claim secure code execution before the required isolation layer exists.
