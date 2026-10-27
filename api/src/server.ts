import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "./db";
import { requireAuth, signAccessToken } from "./auth";

const app = express();
const port = Number(process.env.PORT || 10000);
const allowedOrigins = (process.env.WEB_ORIGIN || "http://localhost:5500,https://teamzyvorax.github.io")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
}));
app.use(express.json({ limit: "32kb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: "draft-7", legacyHeaders: false });
const runLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });

app.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", service: "zyvora-html-lab-api", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", service: "zyvora-html-lab-api", database: "unavailable" });
  }
});

const signupSchema = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(40),
});
app.post("/api/v1/auth/signup", authLimiter, async (req, res, next) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid email, a display name (2–40 characters), and a password of 12–128 characters." });
    return;
  }
  try {
    const { email, password, displayName } = parsed.data;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await db.query(
      "INSERT INTO users(email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, role",
      [email, passwordHash, displayName],
    );
    const row = result.rows[0];
    const user = { id: row.id as string, email: row.email as string, role: row.role as "student" | "admin" };
    res.status(201).json({ token: signAccessToken(user), user: { ...user, displayName: row.display_name } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    next(error);
  }
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
app.post("/api/v1/auth/login", authLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }
  try {
    const result = await db.query(
      "SELECT id, email, password_hash, display_name, role FROM users WHERE email = $1",
      [parsed.data.email],
    );
    const row = result.rows[0];
    if (!row || !(await argon2.verify(row.password_hash, parsed.data.password))) {
      res.status(401).json({ error: "Email or password is incorrect." });
      return;
    }
    const user = { id: row.id as string, email: row.email as string, role: row.role as "student" | "admin" };
    res.json({ token: signAccessToken(user), user: { ...user, displayName: row.display_name } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/me", requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, email, display_name, role, created_at FROM users WHERE id = $1",
      [req.auth!.id],
    );
    if (!result.rowCount) {
      res.status(404).json({ error: "Account not found." });
      return;
    }
    const row = result.rows[0];
    res.json({ user: { id: row.id, email: row.email, displayName: row.display_name, role: row.role, createdAt: row.created_at } });
  } catch (error) {
    next(error);
  }
});

const courses = [
  ["html", "HTML", "Build website structure", "browser"],
  ["css", "CSS", "Style responsive interfaces", "browser"],
  ["javascript", "JavaScript", "Add interactive behavior", "browser"],
  ["python", "Python", "Learn programming and logic", "planned-runtime"],
  ["java", "Java", "Object-oriented programming", "planned-runtime"],
  ["cpp", "C++", "Core programming and algorithms", "planned-runtime"],
  ["c", "C", "Programming fundamentals", "planned-runtime"],
  ["sql", "SQL", "Query relational databases", "planned-runtime"],
  ["php", "PHP", "Server-side web development", "planned-runtime"],
  ["react", "React", "Build component-based interfaces", "browser"],
  ["typescript", "TypeScript", "Typed JavaScript", "browser"],
  ["go", "Go", "Build backend services", "planned-runtime"],
  ["rust", "Rust", "Systems programming", "planned-runtime"],
  ["ruby", "Ruby", "Scripting and web apps", "planned-runtime"],
  ["swift", "Swift", "Apple platform development", "planned-runtime"],
  ["kotlin", "Kotlin", "Modern JVM and Android", "planned-runtime"],
  ["dart", "Dart", "Dart and Flutter fundamentals", "planned-runtime"],
  ["bash", "Bash", "Shell automation", "planned-runtime"],
  ["powershell", "PowerShell", "Windows automation", "planned-runtime"],
  ["r", "R", "Statistics and data analysis", "planned-runtime"],
  ["matlab", "MATLAB", "Numerical computing", "planned-runtime"],
  ["perl", "Perl", "Text processing", "planned-runtime"],
  ["lua", "Lua", "Lightweight scripting", "planned-runtime"],
  ["scala", "Scala", "JVM programming", "planned-runtime"],
  ["solidity", "Solidity", "Smart contracts", "planned-runtime"],
  ["xml", "XML", "Structured documents", "reference"],
  ["yaml", "YAML", "Configuration files", "reference"],
  ["json", "JSON", "Data interchange", "reference"],
  ["markdown", "Markdown", "Documentation", "reference"],
  ["nodejs", "Node.js", "JavaScript on the server", "planned-runtime"],
  ["vue", "Vue", "Reactive interfaces", "browser"],
  ["angular", "Angular", "Web applications", "browser"],
  ["svelte", "Svelte", "Reactive UI components", "browser"],
  ["nextjs", "Next.js", "React application framework", "planned-runtime"],
  ["flask", "Flask", "Python web framework", "planned-runtime"],
  ["django", "Django", "Python web framework", "planned-runtime"],
  ["laravel", "Laravel", "PHP web framework", "planned-runtime"],
  ["docker", "Dockerfile", "Container fundamentals", "reference"],
] as const;

app.get("/api/v1/courses", (_req, res) => {
  res.json({ courses: courses.map(([slug, name, description, runtime]) => ({ slug, name, description, runtime, levelCount: 10000 })) });
});

const progressSchema = z.object({
  currentLevel: z.number().int().min(1).max(10000),
  unlockedLevel: z.number().int().min(1).max(10000),
  completedLevels: z.array(z.number().int().min(1).max(10000)).max(10000),
  quizPassedLevels: z.array(z.number().int().min(1).max(10000)).max(10000),
}).refine((v) => v.unlockedLevel <= Math.max(1, ...v.completedLevels, 1) + 1, {
  message: "Unlocked level must follow completed levels.",
});
app.get("/api/v1/me/progress", requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT course_slug, current_level, unlocked_level, completed_levels, quiz_passed_levels, updated_at FROM course_progress WHERE user_id = $1 ORDER BY course_slug",
      [req.auth!.id],
    );
    res.json({ progress: result.rows.map((row) => ({
      courseSlug: row.course_slug,
      currentLevel: row.current_level,
      unlockedLevel: row.unlocked_level,
      completedLevels: row.completed_levels,
      quizPassedLevels: row.quiz_passed_levels,
      updatedAt: row.updated_at,
    })) });
  } catch (error) { next(error); }
});

app.put("/api/v1/me/progress/:courseSlug", requireAuth, async (req, res, next) => {
  const slug = z.string().regex(/^[a-z0-9-]{1,60}$/).safeParse(req.params.courseSlug);
  const parsed = progressSchema.safeParse(req.body);
  if (!slug.success || !parsed.success) {
    res.status(400).json({ error: "Invalid course slug or progress payload." });
    return;
  }
  const p = parsed.data;
  if (p.unlockedLevel > Math.max(1, ...p.completedLevels, 1) + 1 ||
      p.quizPassedLevels.some((level) => !p.completedLevels.includes(level))) {
    res.status(400).json({ error: "Progress must have passed both the task and quiz before a level is completed." });
    return;
  }
  try {
    const result = await db.query(
      `INSERT INTO course_progress(user_id, course_slug, current_level, unlocked_level, completed_levels, quiz_passed_levels)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(user_id, course_slug) DO UPDATE SET
         current_level = EXCLUDED.current_level,
         unlocked_level = GREATEST(course_progress.unlocked_level, EXCLUDED.unlocked_level),
         completed_levels = (SELECT ARRAY(SELECT DISTINCT unnest(course_progress.completed_levels || EXCLUDED.completed_levels) ORDER BY 1)),
         quiz_passed_levels = (SELECT ARRAY(SELECT DISTINCT unnest(course_progress.quiz_passed_levels || EXCLUDED.quiz_passed_levels) ORDER BY 1)),
         updated_at = NOW()
       RETURNING course_slug, current_level, unlocked_level, completed_levels, quiz_passed_levels, updated_at`,
      [req.auth!.id, slug.data, p.currentLevel, p.unlockedLevel, [...new Set(p.completedLevels)], [...new Set(p.quizPassedLevels)]],
    );
    const row = result.rows[0];
    res.json({ progress: { courseSlug: row.course_slug, currentLevel: row.current_level, unlockedLevel: row.unlocked_level, completedLevels: row.completed_levels, quizPassedLevels: row.quiz_passed_levels, updatedAt: row.updated_at } });
  } catch (error) { next(error); }
});

app.post("/api/v1/attempts", requireAuth, runLimiter, async (req, res, next) => {
  const schema = z.object({
    courseSlug: z.string().regex(/^[a-z0-9-]{1,60}$/),
    level: z.number().int().min(1).max(10000),
    taskPassed: z.boolean(),
    quizPassed: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lesson attempt." });
    return;
  }
  try {
    const { courseSlug, level, taskPassed, quizPassed } = parsed.data;
    await db.query(
      "INSERT INTO lesson_attempts(user_id, course_slug, level, task_passed, quiz_passed) VALUES ($1, $2, $3, $4, $5)",
      [req.auth!.id, courseSlug, level, taskPassed, quizPassed],
    );
    res.status(201).json({ recorded: true, eligibleToComplete: taskPassed && quizPassed });
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API request failed", error);
  if (res.headersSent) return;
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ZYVORA HTML LAB API listening on port ${port}`);
});
