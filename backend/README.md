# TrackAsap Backend

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Login/Register with Google credential
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)

### Daily Logs
- `GET /api/daily-logs` - Get all logs (Protected)
- `POST /api/daily-logs` - Create/Update log (Protected)
- `GET /api/daily-logs/:date` - Get log by date (Protected)
- `DELETE /api/daily-logs/:date` - Delete log (Protected)
- `GET /api/daily-logs/streak` - Get streak info (Protected)
- `GET /api/daily-logs/weekly-summary?weekNumber=1` - Get weekly summary (Protected)

### Physique
- `GET /api/physique` - Get all physique logs (Protected)
- `POST /api/physique` - Add physique log (Protected)
- `GET /api/physique/progress` - Get progress summary (Protected)
- `DELETE /api/physique/:id` - Delete log (Protected)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview (Protected)
- `GET /api/analytics/problems-trend` - Problems over time (Protected)
- `GET /api/analytics/platform-distribution` - Platform breakdown (Protected)
- `GET /api/analytics/difficulty-breakdown` - Difficulty pie chart (Protected)
- `GET /api/analytics/heatmap` - Consistency heatmap (Protected)
- `GET /api/analytics/codeforces-rating` - CF rating history (Protected)
- `GET /api/analytics/weight-progress` - Weight trend (Protected)

### AI Daily Study Planner
- `POST /api/daily-plan/generate` - Generate dual AI study plans via Gemini (Protected)
- `POST /api/daily-plan` - Save chosen/customized daily plan draft (Protected)
- `GET /api/daily-plan/active` - Fetch current active session or latest draft (Protected)
- `GET /api/daily-plan/history` - Fetch completed study session history (Protected)
- `PATCH /api/daily-plan/:id/start-session` - Launch non-stop session & snapshot sheets (Protected)
- `PATCH /api/daily-plan/:id/tasks` - Update and re-sequence tasks in plan (Protected)
- `PATCH /api/daily-plan/:id/toggle-task` - Toggle completion status of a task (Protected)
- `POST /api/daily-plan/:id/end-session` - Complete session & generate report (Protected)

### AI Live Mock Interviewer (NEW! 🐰)
- `POST /api/interview/session` - Create interview session (mode, role, difficulty) (Protected)
- `GET /api/interview/sessions` - List interview sessions with pagination (Protected)
- `GET /api/interview/session/:id` - Fetch session details & transcripts (Protected)
- `GET /api/interview/session/:id/initial-question` - Dynamic mode-tailored opening question (Protected)
- `POST /api/interview/session/:id/next-turn` - Real-time conversational agent follow-up (Protected)
- `POST /api/interview/upload-resume` - 5-Tier multi-modal resume & image OCR parsing (Protected)
- `POST /api/interview/session/:id/token` - Mint LiveKit WebRTC access token (Protected)
- `POST /api/interview/session/:id/transcript` - Record candidate / AI speech turn (Protected)
- `POST /api/interview/session/:id/evaluate` - Generate LLM evaluation rubric scorecard (Protected)
- `DELETE /api/interview/session/:id` - Delete interview session (Protected)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Google OAuth & Gemini AI env:

```bash
# Server-side verification audience
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Google Gemini AI Key (Required for AI Daily Study Planner)
GEMINI_API_KEY=your_gemini_api_key_here
```

## Striver A2Z Bucket Seeding

- Snapshot file: `src/data/striverA2Z.snapshot.json`
- Seeder entry: `src/seed-buckets.js`
- Extractor entry: `src/seeding/extractStriverA2Z.js`

Commands:

```bash
# Regenerate full Striver A2Z snapshot from source page
npm run extract:a2z

# Validate snapshot structure without writing to DB
npm run seed:a2z:dry

# Upsert snapshot buckets into DB
npm run seed:a2z
```

Notes:
- Seeder is idempotent by bucket name (rerun safely updates existing buckets).
- Bucket problem identity uses `problemKey` (URL/title-based normalized key) to reduce duplicates on imports.

## Bucket Admin Access

- `POST /api/buckets/upsert` is now admin-only.
- Ensure admin users have `role: "admin"` in `users` collection.
