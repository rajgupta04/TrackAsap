# TrackAsap - 75 Day Goal Tracking Application

A full-stack personal analytics dashboard to track your 75-day journey for competitive programming, internship preparation, and fitness goals.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-7+-brightgreen)

## 🎯 Features

### Core Tracking (Revamped! 🚀)
- **Custom Daily Tracker** - Create and manage your own custom flexible tasks!
- **Premade Task Bucket** - Quick-add pre-built tasks (DSA, LLD, HLD, Codeforces, Gym, Clean Diet, etc.)
- **Recurring Habits** - Set tasks to recur daily, on specific days of the week, or for a custom date range.
- **Time-Series Analytics** - Visual Area charts tracking your daily completions over time.

### 📝 Problem Tracking (NEW!)
- **Save Solutions** - Store problem title, link, code, and notes
- **Monaco Code Editor** - View saved code with syntax highlighting
- **Copy Code** - One-click copy functionality
- **Multi-platform** - Track LeetCode, CodeChef, Codeforces, GFG, HackerRank
- **Tags & Difficulty** - Organize problems by tags and difficulty
- **Time Tracking** - Log time spent on each problem

### 📋 Custom Sheets & Roadmaps (NEW!)
- **Pre-built Templates** - DSA, CP, OS, CN, OOPS, Development
- **Topic-based Progress** - Track progress by topics
- **Custom Sheets** - Create your own learning roadmap
- **Visual Progress** - See completion percentage per topic
- **Link Problems to Sheets** - Organize problems by sheet/topic

### 🔥 Streak Animation (NEW!)
- **Confetti Celebration** - Animated celebration on completing daily goals
- **Streak Counter** - Visual streak display with fire animation
- **Progress Ring** - See your 75-day progress
- **Motivational Messages** - Dynamic messages based on streak length

### Analytics & Visualization
- **Dashboard** - Overview with key stats & progress
- **Problems Trend** - Line chart showing cumulative problems
- **Platform Distribution** - Bar chart comparing platforms
- **Difficulty Breakdown** - Pie chart for problem difficulty
- **Consistency Heatmap** - GitHub-style activity visualization
- **Codeforces Rating** - Rating progression graph
- **Weight Progress** - Weight trend with target line

### Physique Tracker
- Weekly weight logging
- Body fat percentage tracking
- Progress visualization
- Weekly average calculations
- Goal progress percentage

### Authentication
- JWT-based authentication
- Protected routes
- Persistent login state
- Profile management with logout

### UI Design
- 🌙 Dark theme
- ✨ Glassmorphism cards
- 💚 Neon green accents
- 🎬 Smooth Framer Motion animations
- 📱 Fully responsive layout

## 📁 Folder Structure

```
TrackAsap/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Auth logic
│   │   │   ├── dailyLog.controller.js # Daily logs CRUD
│   │   │   ├── physique.controller.js # Weight tracking
│   │   │   ├── analytics.controller.js # Dashboard data
│   │   │   ├── problem.controller.js  # Problem tracking (NEW)
│   │   │   └── sheet.controller.js    # Sheets/Roadmaps (NEW)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   ├── error.middleware.js   # Error handling
│   │   │   └── validate.middleware.js # Input validation
│   │   ├── models/
│   │   │   ├── User.model.js         # User schema
│   │   │   ├── DailyLog.model.js     # Daily log schema
│   │   │   ├── PhysiqueLog.model.js  # Weight log schema
│   │   │   ├── Problem.model.js      # Problem schema (NEW)
│   │   │   └── Sheet.model.js        # Sheet/Roadmap schema (NEW)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── dailyLog.routes.js
│   │   │   ├── physique.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── problem.routes.js     # (NEW)
│   │   │   └── sheet.routes.js       # (NEW)
│   │   └── server.js                 # Express app entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Header.jsx
│   │   │   ├── ui/
│   │   │   │   ├── GlassCard.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   ├── ProgressRing.jsx
│   │   │   │   ├── Checkbox.jsx
│   │   │   │   ├── NumberInput.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── ProblemModal.jsx      # Problem input form (NEW)
│   │   │   ├── CodeViewer.jsx        # Monaco editor view (NEW)
│   │   │   └── StreakAnimation.jsx   # Streak celebration (NEW)
│   │   ├── lib/
│   │   │   └── api.js                # Axios instance
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DailyTracker.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── PhysiqueTracker.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Sheets.jsx            # Sheets/Roadmaps page (NEW)
│   │   │   └── Problems.jsx          # Problems list page (NEW)
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── dailyLogService.js
│   │   │   ├── physiqueService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── problemService.js     # (NEW)
│   │   │   └── sheetService.js       # (NEW)
│   │   ├── store/
│   │   │   ├── authStore.js          # Zustand auth state
│   │   │   ├── dailyLogStore.js      # Daily logs state
│   │   │   ├── analyticsStore.js     # Analytics data
│   │   │   ├── physiqueStore.js      # Weight tracking
│   │   │   ├── problemStore.js       # Problems state (NEW)
│   │   │   └── sheetStore.js         # Sheets state (NEW)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/trackasap
# JWT_SECRET=your_super_secret_key
# JWT_EXPIRE=30d

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file (optional for custom API URL)
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:3000` to use the application.

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  startDate: Date,           // 75-day challenge start
  targetWeight: Number,
  codeforcesHandle: String,
  codechefHandle: String,
  leetcodeHandle: String,
  timestamps: true
}
```

### CustomTask Model
```javascript
{
  user: ObjectId,
  title: String,
  startDate: Date,
  endDate: Date,
  specificDate: Date,
  daysOfWeek: [Number], // 0 (Sun) - 6 (Sat)
  timestamps: true
}
```

### TaskLog Model
```javascript
{
  user: ObjectId,
  task: ObjectId (ref: 'CustomTask'),
  date: Date,
  completed: Boolean,
  timestamps: true
}
```

### PhysiqueLog Model
```javascript
{
  user: ObjectId,
  date: Date,
  weight: Number,
  bodyFat: Number,
  weekNumber: Number (1-11),
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  notes: String,
  timestamps: true
}
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Custom Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all active tasks |
| POST | `/api/tasks` | Create a new task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/logs` | Get task completion logs |
| POST | `/api/tasks/toggle` | Toggle task completion status |
| GET | `/api/tasks/streak` | Get current streak multiplier |

### Physique
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/physique` | Get all weight logs |
| POST | `/api/physique` | Add weight log |
| GET | `/api/physique/progress` | Get progress summary |
| DELETE | `/api/physique/:id` | Delete weight log |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard overview |
| GET | `/api/analytics/problems-trend` | Problems over time |
| GET | `/api/analytics/platform-distribution` | Platform breakdown |
| GET | `/api/analytics/difficulty-breakdown` | Difficulty stats |
| GET | `/api/analytics/heatmap` | Activity heatmap |
| GET | `/api/analytics/codeforces-rating` | CF rating history |
| GET | `/api/analytics/weight-progress` | Weight chart data |

### Problems (NEW!)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems` | Get all problems |
| POST | `/api/problems` | Create problem |
| GET | `/api/problems/:id` | Get problem details |
| PUT | `/api/problems/:id` | Update problem |
| DELETE | `/api/problems/:id` | Delete problem |
| GET | `/api/problems/by-date/:date` | Get problems by date |
| GET | `/api/problems/stats` | Get problem statistics |

### Sheets/Roadmaps (NEW!)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sheets` | Get all sheets |
| POST | `/api/sheets` | Create sheet |
| GET | `/api/sheets/templates` | Get available templates |
| GET | `/api/sheets/:id` | Get sheet with problems |
| PUT | `/api/sheets/:id` | Update sheet |
| DELETE | `/api/sheets/:id` | Delete sheet |
| POST | `/api/sheets/:id/topics` | Add topic to sheet |
| PUT | `/api/sheets/:id/topics/:topicName` | Update topic progress |

## 🔥 Streak Calculation Logic (Multiplier Reward)

```javascript
// A day is considered "active" if the user completes AT LEAST ONE task.
// The streak is NO LONGER just the number of consecutive active days.

// Instead, the streak is a Multiplier Reward:
// It counts the TOTAL NUMBER OF TASKS completed across all active consecutive days!

// Example: 
// Day 1: Completed 2 tasks
// Day 2: Completed 3 tasks
// Day 3 (Today): Completed 1 task so far
// Current Streak = 2 + 3 + 1 = 6 🔥 

// If you complete another task today, your streak instantly jumps to 7!
// This rewards users heavily for doing more tasks every single day.
```

## 🎨 State Management (Zustand)

```javascript
// Auth Store
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async (credentials) => { ... },
  logout: () => { ... },
  updateUser: async (data) => { ... },
}));

// Task Store (Zustand)
const useTaskStore = create((set, get) => ({
  tasks: [],
  taskLogs: [],
  streak: { currentStreak: 0, longestStreak: 0 },
  fetchTasks: async () => { ... },
  createTask: async (data) => { ... },
  toggleTaskLog: async (taskId, date) => { ... },
  fetchStreak: async () => { ... },
}));

// Analytics Store
const useAnalyticsStore = create((set) => ({
  dashboard: null,
  problemsTrend: [],
  platformDistribution: [],
  fetchAll: async () => { ... },
}));
```

## 🌐 Deployment

### Backend (Render/Railway/Vercel)
1. Set environment variables
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel/Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set `VITE_API_URL` environment variable

### Environment Variables

**Backend:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
JWT_EXPIRE=30d
NODE_ENV=production
```

**Frontend:**
```env
VITE_API_URL=https://your-api-url.com/api
```

## 📝 License

MIT License - feel free to use this for your own 75-day challenge!

---

Built with 💚 for the grind. Stay consistent, track everything, achieve your goals!
