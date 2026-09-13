# 🧪 TrackAsap Automated Testing & QA Suite Guide

This document outlines the testing architecture, test strategy, and execution instructions for the TrackAsap automated testing suite.

---

## 🎯 Testing Architecture & Tech Stack

| Layer | Framework | Purpose | Key Metrics |
|---|---|---|---|
| **Backend Integration & API Tests** | Jest + Supertest + MongoDB Memory Server | REST API contract verification, auth boundary enforcement, database transactions | 32 Test Cases across 7 suites |
| **Frontend Unit & Component Tests** | Vitest + React Testing Library + jsdom | Utility validation, Zustand store state transitions, UI modal interaction | 14 Test Cases across 3 suites |
| **End-to-End (E2E) Browser Tests** | Playwright | Full user journey automation across desktop & mobile viewports | Multi-browser headless flows |
| **Continuous Integration (CI)** | GitHub Actions | Automated regression testing on every push and pull request | Parallel matrix CI pipeline |

---

## 🚀 How to Run the Tests

### 1. Backend API Test Suite
```bash
# Navigate to backend directory
cd backend

# Run all API tests
npm test

# Run tests in watch mode (reruns on file save)
npm run test:watch

# Run tests with code coverage analysis
npm run test:coverage
```

### 2. Frontend Unit Test Suite
```bash
# Navigate to frontend directory
cd frontend

# Run all unit and component tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with code coverage
npm run test:coverage
```

### 3. Playwright E2E Tests
```bash
cd frontend

# Run headless browser tests
npm run test:e2e
```

---

## 📋 Test Case Coverage Overview

### Backend Test Suites (`backend/tests/`)
1. **`auth.test.js`**
   - User registration (valid data, duplicate email rejection, password sanitization)
   - User authentication / login (valid credentials, incorrect password, non-existent user)
   - Profile retrieval (`GET /api/auth/me` with valid JWT vs unauthenticated 401)
2. **`task.test.js`**
   - Task creation with title uniqueness validation
   - Daily toggle status logging (`completed: true / false`)
   - Data isolation between different users
3. **`sheet.test.js`**
   - Custom problem sheet creation and category validation
   - Adding sheet problems with links and difficulties
   - Cascading deletion of sheets and problems
4. **`discussion.test.js`**
   - Community post creation (gated by agreement acceptance and email verification)
   - Like and unlike toggling mechanics with atomic counter assertions
5. **`dailyPlan.test.js`**
   - AI daily study planner draft persistence
   - Live timer countdown session initiation (`sessionStartedAt` timestamping)
   - Task completion checkoffs during active sessions
6. **`leaderboard.test.js`**
   - Paginated global leaderboard rankings by score
   - Current user rank and profile endpoint
7. **`middleware.test.js`**
   - 404 handler for nonexistent routes
   - Role-based access control (blocking regular users from admin routes with 403)
   - Immediate account suspension blocking for banned users

### Frontend Test Suites (`frontend/src/`)
1. **`utils/__tests__/avatar.test.js`**
   - Validating fallback avatar resolution (Profile Picture $\to$ Google Picture $\to$ GitHub Avatar $\to$ Clean Minimalist SVG)
   - Verifying complete removal of unwanted external avatar generators
2. **`store/__tests__/authStore.test.js`**
   - Zustand authentication store state mutations on login, logout, and token persistence in `localStorage`
3. **`components/__tests__/UserAgreementModal.test.jsx`**
   - Component lifecycle and conditional DOM rendering
   - Agreement checkbox toggle enabling the "Accept & Join Community" CTA button
   - Modal cancellation and accept callback dispatches

---

## 🔄 SDLC & STLC Mapping for QA Roles

- **Requirement Analysis**: Identifying API contracts, security barriers (e.g., email verification & community agreements), and responsive viewport constraints.
- **Test Planning**: Designing high-coverage test cases covering both Happy Paths and Edge Cases (400, 401, 403, 404).
- **Test Automation**: Writing modular, idempotent test scripts using modern industry-standard frameworks (Jest, Vitest, Supertest, React Testing Library, Playwright).
- **Defect Tracking & Regression**: Automated test execution via GitHub Actions ensuring zero regression bugs on production deployments.
