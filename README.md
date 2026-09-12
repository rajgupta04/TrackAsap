<p align="center">
  <img src="frontend/public/logo.png" alt="TrackAsap Logo" width="180" />
</p>

# TrackAsap — The Ultimate Developer Command Center & Interview Prep Platform

The Ultimate Developer Command Center & Interview Prep Platform. Featuring extensive Company-Wise DSA Sheets (Google, Meta, Amazon & more), TakeUForward-style problem buckets, live CP analytics & heatmaps (LeetCode, CodeChef, Codeforces), automated time-tracking via Chrome Extension (TrackEx), instant GitHub repository sync, multi-language code playground, and a 75-Day coding & physique mastery tracker. Built with React + Vite + Node.js + MongoDB.

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

### 🧠 AI Daily Study Planner & Focus Engine (NEW! ⚡)
- **Multi-Mode Focus AI** - Personalized study session plans tailored to your energy level (**☕ Chill Mode**, **🔥 Grind Mode**, **⚡ All-In Mode**).
- **Dual AI Plan Comparison** - Compare two distinct algorithmic schedule blueprints (Balanced Deep-Work Blocks vs. Agile Pomodoro Spreads) with direct task customization.
- **Dynamic Cascading Timeline** - Automatically cascades task intervals sequentially and provides a real-time **Surplus / Deficit Balance Meter**.
- **Live Sheet Monitoring** - Auto-matches study tasks to your active DSA/CP problem sheets, captures pre-session snapshots, and logs solved/revision deltas in real-time.
- **Non-Stop Session Engine & Live Alignment** - Timer re-aligns to the exact second of launch so time spent reviewing or editing your plan is never lost.
- **Matrix Glitch Reality Check** - Playful Easter egg preventing accidental premature task check-offs if insufficient study time has elapsed.
- **Motivational Session Reports** - Generates dynamic focus scores, progress breakdowns, and personalized congratulatory feedback.
- **macOS Window Interface** - Responsive 2-column widescreen layout with native controls: Minimize (🟡), Fullscreen toggle with dual-window restore icon (🟢), and draggable Quick-Launch bubble.

### 🎙️ TrackAsap AI Live Mock Interviewer & Mascot Avatar (NEW! 🐰)
- **Authentic TrackAsap Mascot Avatar (`rabbit.png`)** — Replaced heavy 3D CAD/Three.js rendering with a clean, ultra-responsive 2D mascot avatar featuring real-time visual reactive feedback:
  - 🗣️ **Active Speaking Aura**: Dynamic pulsating neon-green audio shockwaves and glowing outer rim when the AI interviewer is speaking.
  - 🎧 **Live Listening Breathing**: Gentle cyan-blue breathing luminescence and status badge while actively capturing candidate responses.
  - ⚡ **Thinking State**: Radiant amber spinning radar ring when the conversational engine synthesizes contextual follow-up questions.
  - 🚀 **Silky 60 FPS Performance**: Zero WebGL rendering overhead, GPU battery drain, or canvas crashes; operates with zero lag across desktop and mobile.
- **Intelligent Acoustic Echo Cancellation** — Employs a 1400ms acoustic silence delay after AI speech ends plus a token-level overlap filter (`isEchoOfAI`) to prevent browser speech recognition from picking up the AI's own voice through speakers.
- **6 Mode-Calibrated Technical Interview Personas**:
  - **Verbal DSA & Algorithmic Intuition**: Out-loud algorithmic problem solving without code, focusing on data structure trade-offs, two-pointer/sliding window patterns, and Big-O edge cases.
  - **System Design & Distributed Architecture**: Scalability, database sharding, latency bottlenecks, caching invalidation, and failover design.
  - **Backend Engineering**: Concurrency, ACID transactions, connection pools, and microservices architecture.
  - **Resume Deep-Dive**: In-depth probing of candidate's actual projects, architectural claims, and scale metrics parsed directly from their uploaded resume.
  - **Target Job Description Alignment**: Tailored questions aligned with the candidate's target job role and company tech stack.
  - **General SDE Round**: Comprehensive software engineering interview spanning CS fundamentals, problem solving, and design trade-offs.
- **5-Tier Fault-Tolerant Resume Parsing Pipeline** — Multi-tier extraction pipeline extracting structured candidate profiles (role, skills, projects, metrics) from PDF, Word (`.docx`, `.doc`, `.rtf`), Markdown/Text (`.md`, `.txt`), and image scans (`.png`, `.jpg`, `.jpeg`, `.webp`) using Gemini 3.6 Flash Multi-Modal Vision OCR.
- **Authentic Post-Interview Evaluation & Rubric** — Post-interview scoring based on actual transcript turns (Technical Knowledge, System Design, Communication, Problem Solving, Confidence) alongside objective speech delivery signals (WPM pace, speaking duration, filler word counts) and premature session detection.

### 🗺️ Interactive Gamified DSA Roadmap (NEW!)
- **11 Thematic Kingdoms** - Arrays, Two Pointers, Sliding Window, Stacks, Binary Search, Linked Lists, Trees, Heaps, Graphs, DP, and Advanced Citadel.
- **Dynamic Mode Selector** - Toggle instantly between **Blind 75**, **Rabbit 150**, and **Running Rabbit 175** question counts.
- **Ambient backdrops & Visualizers** - Features dynamic equalizer bars, falling leaves with depth blur, and storm lightning strikes.
- **Notes & Code Editors** - Attach reflection text and multi-language solutions directly onto standard/boss levels.
- **Gold Coin Economy** - Defeat boss levels and clear standard paths to earn coins and unlock custom soundtracks.

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
│   │   │   ├── sheet.controller.js    # Sheets/Roadmaps (NEW)
│   │   │   └── interview.controller.js # AI Mock Interviewer & turn generation (NEW 🐰)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   ├── error.middleware.js   # Error handling
│   │   │   └── validate.middleware.js # Input validation
│   │   ├── models/
│   │   │   ├── User.model.js         # User schema
│   │   │   ├── DailyLog.model.js     # Daily log schema
│   │   │   ├── PhysiqueLog.model.js  # Weight log schema
│   │   │   ├── Problem.model.js      # Problem schema (NEW)
│   │   │   ├── Sheet.model.js        # Sheet/Roadmap schema (NEW)
│   │   │   └── InterviewSession.model.js # Interview transcripts & evaluation (NEW 🐰)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── dailyLog.routes.js
│   │   │   ├── physique.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── problem.routes.js     # (NEW)
│   │   │   ├── sheet.routes.js       # (NEW)
│   │   │   └── interview.routes.js   # Interview & resume upload routes (NEW 🐰)
│   │   ├── utils/
│   │   │   ├── resumeParser.js       # 5-Tier multi-modal resume parsing pipeline
│   │   │   ├── interviewConversationalAgent.js # Real-time mode-tailored question generator
│   │   │   └── interviewEvaluator.js # Post-interview LLM rubric evaluation
│   │   └── server.js                 # Express app entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── assets/
│   │       └── avatar/
│   │           └── rabbit.png        # Official TrackAsap mascot avatar image (🐰)
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
│   │   │   ├── interview/            # AI Interviewer components (NEW 🐰)
│   │   │   │   ├── RabbitAvatar.jsx  # Reactive TrackAsap Mascot Avatar (Speaking/Listening)
│   │   │   │   ├── AudioWaveform.jsx # Real-time dynamic voice activity visualizer
│   │   │   │   └── ConfirmModal.jsx  # Confirmation dialogs
│   │   │   ├── roadmap/              # Gamified Roadmap components (NEW)
│   │   │   │   ├── WorldMap.jsx
│   │   │   │   ├── WorldModal.jsx
│   │   │   │   ├── ProblemTile.jsx
│   │   │   │   └── BossLevel.jsx
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
│   │   │   ├── Problems.jsx          # Problems list page (NEW)
│   │   │   ├── Roadmap.jsx           # Gamified DSA Roadmap Page (NEW)
│   │   │   ├── Interview.jsx         # AI Interview Lobby & Resume Upload (NEW 🐰)
│   │   │   ├── InterviewRoom.jsx     # Live WebRTC Interview Room with Rabbit Avatar (NEW 🐰)
│   │   │   └── InterviewResults.jsx  # Post-interview evaluation scorecard & metrics (NEW 🐰)
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── dailyLogService.js
│   │   │   ├── physiqueService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── problemService.js     # (NEW)
│   │   │   ├── sheetService.js       # (NEW)
│   │   │   └── interviewService.js   # Interview session & resume API (NEW 🐰)
│   │   ├── store/
│   │   │   ├── authStore.js          # Zustand auth state
│   │   │   ├── dailyLogStore.js      # Daily logs state
│   │   │   ├── analyticsStore.js     # Analytics data
│   │   │   ├── physiqueStore.js      # Weight tracking
│   │   │   ├── problemStore.js       # Problems state (NEW)
│   │   │   ├── sheetStore.js         # Sheets state (NEW)
│   │   │   ├── roadmapStore.js       # Roadmap state & audio progress (NEW)
│   │   │   └── interviewStore.js     # AI Interview session & audio state (NEW 🐰)
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

### AI Mock Interview (NEW! 🐰)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/session` | Create new interview session (mode, role, company, difficulty) |
| GET | `/api/interview/sessions` | List candidate interview history (paginated) |
| GET | `/api/interview/session/:id` | Get interview session details & transcript |
| GET | `/api/interview/session/:id/initial-question` | Generate mode-tailored dynamic opening question |
| POST | `/api/interview/session/:id/next-turn` | Conversational follow-up turn via Groq/Gemini LLM agent |
| POST | `/api/interview/upload-resume` | 5-Tier multi-modal resume & image OCR parsing |
| POST | `/api/interview/session/:id/token` | Mint LiveKit WebRTC access token |
| POST | `/api/interview/session/:id/transcript` | Record candidate / AI speech turn |
| POST | `/api/interview/session/:id/evaluate` | Generate comprehensive LLM evaluation rubric scorecard |
| DELETE | `/api/interview/session/:id` | Delete interview session record |

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
