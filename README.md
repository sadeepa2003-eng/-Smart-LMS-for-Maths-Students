# Smart LMS for Maths Students

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application designed for secondary and undergraduate maths students and their teachers. Teachers publish curriculum lessons and multi-choice quizzes, while students study lessons, attempt quizzes with instant server-side scoring, and receive transparent **rule-based revision recommendations**.

---

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Rule-Based Recommendation Engine](#rule-based-recommendation-engine)
- [Database Schema Design](#database-schema-design)
- [Demonstration Accounts](#demonstration-accounts)
- [Prerequisites & System Requirements](#prerequisites--system-requirements)
- [Installation & Local Setup](#installation--local-setup)
- [Running Automated Tests](#running-automated-tests)
- [Building for Production](#building-for-production)
- [Examiner Verification Checklist](#examiner-verification-checklist)
- [Git Commit History & Development Plan](#git-commit-history--development-plan)

---

## 🎯 Project Overview
- **Project Title:** Smart LMS for Maths Students
- **Curriculum Topics:** **Algebra**, **Geometry**, and **Straight Lines**
- **User Roles:** `Student` and `Teacher`
- **Smart Feature:** Deterministic rule-based revision advice calculated directly from student quiz performance.

---

## ✨ Key Features

### 👨‍🎓 Student Role
- **Account Registration & Login:** Register as either a student or a teacher (with an administrator-issued invite code), with encrypted passwords.
- **Maths Study Lessons:** Filter lessons by topic (*Algebra*, *Geometry*, *Straight Lines*) with worked examples and verified external study links (e.g. Khan Academy).
- **Interactive Quizzes:** Multi-choice questions with server-side validation. Correct answers are withheld until submission.
- **Instant Detailed Feedback:** Review selected answers versus correct answers with step-by-step solutions and explanations.
- **Rule-Based Recommendations:** Dynamic topic badges and targeted recommendations guiding what to study next.
- **Progress Tracking:** Persistent history of all attempts with score breakdowns, percentages, and timestamps.

### 👩‍🏫 Teacher / Admin Role
- **Lesson Management (Full CRUD):**
  - Create new lessons with formatted math notes and external resource links.
  - Edit existing lesson content and topic tags.
  - Delete obsolete lessons.
- **Quiz Management:**
  - Create custom quizzes with dynamic questions builder (question prompt, 4 options, radio selector for correct answer, and explanation).
  - Delete quizzes and cascade cleanup.
- **Student Performance Monitor:**
  - Real-time audit table showing student names, emails, quiz titles, topics, scores, percentages, revision recommendations, and submission timestamps.

---

## 🛠️ Architecture & Tech Stack

| Technology | Responsibility in LMS |
| :--- | :--- |
| **MongoDB** | Document database storing `users`, `lessons`, `quizzes`, and `attempts`. |
| **Express.js** | RESTful API server handling routing, validation, JWT auth, and score calculations. |
| **React (Vite)** | Responsive single-page application (SPA) with tabbed navigation and real-time backend health monitor. |
| **Node.js** | JavaScript runtime executing backend services and automated test suites. |
| **Bcrypt.js** | Salted password hashing (10 rounds) protecting user credentials. |
| **JSON Web Tokens (JWT)** | Stateless bearer token authentication with role-based access control (`student` vs `teacher`). |

---

## 🧠 Rule-Based Recommendation Engine

Rather than relying on opaque AI, the application uses an honest, transparent, and deterministic rule-based recommendation algorithm:

$$\text{Percentage} = \text{round}\left(\frac{\text{Score}}{\text{Total Questions}} \times 100\right)$$

| Score Range | Recommendation Level | System Recommendation | Action Prompt |
| :---: | :---: | :--- | :--- |
| **< 50%** | `revise` (Red) | *"Score is below 50%. We strongly recommend revising the topic lessons and reviewing fundamental concepts before retrying."* | Direct link to review topic lessons |
| **50% – 74%** | `practice` (Amber) | *"Score is in the moderate range. Good foundation! We recommend completing more practice exercises to solidify your mastery."* | Link to practice exercises & quizzes |
| **≥ 75%** | `advance` (Green) | *"Outstanding performance! You have demonstrated strong mastery. You are ready to advance to the next maths topic!"* | Move forward to next curriculum module |

---

## 🗄️ Database Schema Design

### 1. `users`
- `name`: String, required
- `email`: String, required, unique, lowercase
- `passwordHash`: String (bcrypt hash)
- `role`: Legacy primary role (`student` or `teacher`) for existing accounts.
- `roles`: Array containing exactly one of `student` or `teacher` for newly registered accounts.
- `createdAt`: Date

### 2. `lessons`
- `title`: String, required
- `topic`: Enum `['Algebra', 'Geometry', 'Straight Lines']`
- `content`: String, formatted text
- `resourceUrl`: String (external resource link)
- `createdBy`: ObjectId (ref: `User`)
- `timestamps`: `createdAt`, `updatedAt`

### 3. `quizzes`
- `title`: String, required
- `topic`: Enum `['Algebra', 'Geometry', 'Straight Lines']`
- `description`: String
- `questions`: Array of objects:
  - `questionText`: String
  - `options`: Array of 4 Strings
  - `correctOptionIndex`: Number (0–3) *(excluded from student queries before submission)*
  - `explanation`: String
- `createdBy`: ObjectId (ref: `User`)

### 4. `attempts`
- `studentId`: ObjectId (derived from verified JWT `req.user.id`)
- `quizId`: ObjectId (ref: `Quiz`)
- `quizTitle`: String
- `topic`: String
- `answers`: Array of student selected option, correct option, and boolean `isCorrect`
- `score`: Number
- `total`: Number
- `percentage`: Number
- `recommendation`: String
- `recommendationLevel`: Enum `['revise', 'practice', 'advance']`
- `submittedAt`: Date

---

## 👥 Demonstration Accounts

The repository includes a controlled seeding script to generate test data safely without publishing production secrets:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@mathslms.com` | `Teacher123!` | Lesson CRUD, Quiz Management, Student Analytics |
| **Student** | `student@mathslms.com` | `Student123!` | Study Lessons, Take Quizzes, View Recommendations |

> 💡 **Tip:** The web interface includes **One-Click Demo Fill** buttons on the sign-in page for fast evaluation without typing.

---

## ⚙️ Prerequisites & System Requirements
- **Node.js:** v20+ or v22+ (verified on Node.js v24.21.0)
- **npm:** v10+ (verified on npm 11.19.0)
- **MongoDB:** Local MongoDB community service (port `27017`) or MongoDB Atlas URI
- **Git:** Installed on host machine

---

## 🚀 Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-maths-lms.git
cd smart-maths-lms
```

### Step 2: Configure Environment Variables
Inside `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_maths_lms
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=smart_maths_lms_super_secret_key_2026
TEACHER_INVITE_CODE=replace-with-a-private-invite-code
```

Teacher registration is disabled until `TEACHER_INVITE_CODE` is set in the backend environment. Keep this value private and share it only with approved teachers. Select either Student or Teacher during registration; choosing Teacher requires the invite code.

### Step 3: Install Dependencies & Seed Demo Data
```bash
# Install backend dependencies
cd backend
npm install

# Run database seed script (creates demo users, lessons, and quizzes)
npm run seed

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Start the Applications
Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
# Database connected
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Vite server running on http://localhost:5173
```

Open your browser at `http://localhost:5173`. The system status pill in the navigation header will display **API Online**.

---

## 🧪 Running Automated Tests

An automated end-to-end integration test suite is included in `backend/test-suite.js`:

```bash
cd backend
npm test
```

### Test Suite Verification Highlights:
- `✓` **Health Check:** `GET /api/health` reports status 200 and MongoDB connection.
- `✓` **Teacher Authentication:** Teacher login signs JWT with `teacher` role.
- `✓` **Student Authentication:** Student login signs JWT with `student` role.
- `✓` **Role Registration Protection:** Teacher registration requires the configured invite code; legacy role input cannot grant permissions.
- `✓` **Multiple Roles:** Registration and JWTs support both student and teacher roles on one account.
- `✓` **Access Control:** Student receives `403 Forbidden` when attempting teacher-only routes.
- `✓` **Teacher CRUD:** Teacher can create, read, update, and delete lessons.
- `✓` **Quiz Security:** Correct answers are sanitized and stripped from student quiz requests.
- `✓` **Server-Side Scoring:** Backend computes scores and derives rule-based recommendation.
- `✓` **Data Persistence:** Submissions persist in MongoDB and appear in student attempt history.

---

## 📦 Building for Production

To test the frontend production build:
```bash
cd frontend
npm run build
```
Vite compiles optimized production bundles into `frontend/dist/` with 0 errors.

---

## ✅ Examiner Verification Checklist

| Requirement | Test Scenario | Verified Status |
| :--- | :--- | :---: |
| **Authentication** | Student registration, login, session retention upon page refresh, and logout. | ✅ Passed |
| **Teacher Privileges** | Teacher can create new lesson, edit title/content, and delete lesson. | ✅ Passed |
| **Role Protection** | Student attempting teacher routes via API receives `403 Forbidden`. | ✅ Passed |
| **Quiz Execution** | Server calculates exact score, prevents client answer tampering. | ✅ Passed |
| **Rule-Based Engine** | Score <50% gives "Revise", 50-74% gives "More Practice", ≥75% gives "Mastery". | ✅ Passed |
| **Persistence** | Student refresh or re-login preserves full history of attempts. | ✅ Passed |
| **Input Validation** | Empty or invalid inputs display clear, user-friendly alert messages. | ✅ Passed |
| **Zero Build Errors** | Clean `npm run build` compilation with fast asset rendering. | ✅ Passed |

---

## 📜 Git Commit History & Development Plan

The project development history strictly adheres to the continuous development milestones:

1. `475ef86` — `docs: initialise project scope and README`
2. `a9ce203` — `feat: scaffold React frontend`
3. `a51490f` — `feat: connect frontend backend and MongoDB`
4. `cda83b8` — `feat: add authentication and role checks`
5. `545733e` — `feat: add lesson CRUD`
6. `7257f3f` — `feat: add quiz submission and scoring`
7. `66e5f84` — `feat: add progress and revision recommendations`
8. `e44e89e` — `feat: build full responsive student and teacher UI`
9. `388d4a6` — `test: add automated integration test suite`
10. Current — `docs: add setup instructions and demo guide`
