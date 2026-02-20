# TrackAsap Backend

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
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

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```
