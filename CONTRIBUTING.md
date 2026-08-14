# 🤝 Contributing to TrackAsap

First off, **thank you** for considering contributing to TrackAsap! Whether you're fixing a typo, writing test cases, or building entire features — every contribution matters.

## 📋 Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contribution Workflow](#contribution-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Issue Labels Guide](#issue-labels-guide)
- [Recognition](#recognition)

---

## 🎯 Ways to Contribute

### 🟢 No-Code Contributions (Great for beginners!)
| Task | Difficulty | Time |
|---|---|---|
| Write a problem description for a DSA question | Easy | 15-30 min |
| Create test cases (input/output pairs) for a problem | Easy | 15-30 min |
| Report a bug or UI issue | Easy | 5 min |
| Improve documentation or fix typos | Easy | 10 min |
| Suggest a new feature | Easy | 10 min |

### 🟡 Code Contributions
| Task | Difficulty | Time |
|---|---|---|
| Fix a labeled bug | Easy-Medium | 1-3 hours |
| Add a UI component or animation | Medium | 2-4 hours |
| Build a new feature from an issue | Medium-Hard | 4-8 hours |
| Write unit/integration tests | Medium | 2-4 hours |

### 🔴 Major Contributions
| Task | Difficulty | Time |
|---|---|---|
| Build the online judge/compiler backend | Hard | 1-2 weeks |
| Create problem explanation diagrams | Medium | 2-4 hours each |
| Design system improvements | Hard | 1 week |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Git**

### Development Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/TrackAsap.git
cd TrackAsap

# 3. Add upstream remote
git remote add upstream https://github.com/rajgupta04/TrackAsap.git

# 4. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 5. Set up environment variables
# Backend: Create backend/.env
MONGODB_URI=mongodb://localhost:27017/trackasap
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend: Create frontend/.env
VITE_API_URL=http://localhost:5000

# 6. Start development servers
# Terminal 1 (Backend):
cd backend && npm run dev

# Terminal 2 (Frontend):
cd frontend && npm run dev
```

---

## 📁 Project Structure

```
TrackAsap/
├── backend/               # Express.js + MongoDB API
│   └── src/
│       ├── controllers/   # Route handlers
│       ├── models/        # Mongoose schemas
│       ├── routes/        # API route definitions
│       ├── middleware/     # Auth, error handling
│       └── server.js      # Entry point
├── frontend/              # React + Vite + Tailwind
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page-level components
│       ├── store/         # Zustand state management
│       ├── services/      # API service layer
│       ├── data/          # Static data (roadmap problems, etc.)
│       └── lib/           # Utilities & helpers
└── extension/             # Chrome Extension (TrackEx)
```

---

## 🔄 Contribution Workflow

### For Code Changes

```bash
# 1. Create a feature branch from main
git checkout -b feature/your-feature-name

# 2. Make your changes

# 3. Test your changes
cd frontend && npm run build    # Ensure no build errors

# 4. Commit with a descriptive message
git commit -m "feat: add two-sum problem description and test cases"

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Open a Pull Request against the main branch
```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use For |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no code change |
| `refactor:` | Code change that doesn't fix a bug or add a feature |
| `test:` | Adding tests |
| `content:` | Problem descriptions, test cases, explanations |

### For Problem Content (Descriptions + Test Cases)

1. Pick an unclaimed problem from [Issues](https://github.com/rajgupta04/TrackAsap/issues?q=is%3Aopen+label%3A%22content+needed%22)
2. Comment "I'll work on this" to claim it
3. Follow the templates in `content/problems/` and `content/testcases/`
4. Submit a PR with your content

---

## 📝 Coding Guidelines

### Frontend (React + Tailwind)
- Use **functional components** with hooks
- State management via **Zustand** stores
- Follow existing Tailwind class patterns (dark theme, neon-green accents)
- Use **Framer Motion** for animations
- Use **Lucide React** for icons

### Backend (Node.js + Express)
- Use **ES module** imports (`import/export`)
- Use **async/await** for all async operations
- Follow existing controller patterns (try/catch, `req.user._id`)
- Validate inputs before processing

### General
- Keep PRs focused — one feature/fix per PR
- Don't break existing functionality
- Write descriptive variable names
- Add comments for complex logic

---

## 🏷️ Issue Labels Guide

| Label | Meaning |
|---|---|
| `good first issue` | Perfect for newcomers |
| `content needed` | Problem descriptions or test cases needed |
| `bug` | Something isn't working |
| `enhancement` | New feature request |
| `help wanted` | Extra attention needed |
| `documentation` | Documentation improvements |
| `ui/ux` | Visual or interaction improvements |
| `backend` | Server-side changes |
| `frontend` | Client-side changes |
| `priority: high` | Needs attention ASAP |

---

## 🏆 Recognition

All contributors get:

- 🖼️ **Featured on the Contributors Wall** — Your photo, name, GitHub & LinkedIn displayed on the `/contributors` page
- 📋 **Listed in README** — Permanent credit in the project README
- 💼 **Resume-worthy** — "Core contributor to an open-source DSA platform used by X developers"
- 🎖️ **Contributor badge** — Based on contribution level (Bronze → Silver → Gold → Platinum)

### Contribution Tiers

| Tier | Requirement | Badge |
|---|---|---|
| 🥉 Bronze | 1-3 merged PRs | Bronze Contributor |
| 🥈 Silver | 4-10 merged PRs | Silver Contributor |
| 🥇 Gold | 11-25 merged PRs | Gold Contributor |
| 💎 Platinum | 25+ merged PRs or major feature | Core Contributor |

---

## ❓ Questions?

- Open a [Discussion](https://github.com/rajgupta04/TrackAsap/discussions) for general questions
- Tag `@rajgupta04` in issues for urgent help
- Check existing issues before creating new ones

---

**Happy Contributing! 🚀**
