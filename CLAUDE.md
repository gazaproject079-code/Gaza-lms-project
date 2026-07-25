# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkillSphere is a Learning Management System (LMS) with two active services:

1. **`AppAndroidSS/`** — React Native (CLI, not Expo) frontend targeting web, Android, and iOS
2. **`backend/`** — Express.js REST API with MySQL/Sequelize and Socket.IO

> Note: An `ai-backend/` (Flask/Groq) service is referenced in docs but the directory does not exist in this repo.

## Development Commands

### Backend (Express.js)
```bash
cd backend
npm install
npm run dev          # Start with nodemon (hot reload)
npm start            # Production start
npm run seed         # Seed superadmin user
npm run reset:db     # Reset database (destructive)
npm run migrate:permissions  # Add permissions column migration
```
Backend runs on `http://localhost:5000`

### Frontend (React Native Web)
```bash
cd AppAndroidSS
npm install
npm run web:dev      # Dev server with webpack.dev.js
npm run web          # Production webpack serve
npm run build:web    # Production build
npm run android      # Run on Android emulator
npm run ios          # Run on iOS
npm test             # Jest tests
npm run lint         # ESLint
```
Frontend runs on `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)
```
MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB=SkillSphere_Db
PORT=5000
NODE_ENV=development
JWT_SECRET=...
SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`AppAndroidSS/.env`)
```
REACT_APP_API_URL=http://localhost:5000
```

## Architecture

### Role-Based Navigation
`AppNavigator.js` routes users by role. The four actual role values (as stored in DB and used in code) are:
- `superadmin` → `SuperAdminNavigator`
- `instructor` → `AdminNavigator` (UI label is "Admin")
- `sponsor` → `SponsorNavigator` (UI label is "Expert")
- `student` → `StudentNavigator` (default for any authenticated user)

Each role has its own navigator in `AppAndroidSS/src/navigation/`.

### API Client (`AppAndroidSS/src/services/apiClient.js`)
Handles host resolution per platform:
- Android emulator: `http://10.0.2.2:5000`
- Web: reads `REACT_APP_API_URL` env var, falls back to `http://localhost:5000`
- JWT token stored in AsyncStorage under `@skillsphere:token`

### Backend Structure
- `server.js` — Entry point; registers all 24 route modules, initializes SuperAdmin on startup, runs Socket.IO server for real-time forum chat
- `config/database.js` — Sequelize connection
- `models/index.js` — Loads all models and associations
- `middleware/auth.js` — JWT verification; exposes `authenticateToken`, `requireSuperAdmin`, `requireAdmin`, `requireStudent`, and granular permission checkers (`canManageAllCourses`, `canManageCategories`, `canManageStudents`, `canManageCertificates`, `canViewFeedback`)
- `services/emailService.js` — Nodemailer (OTP, welcome emails)
- `services/certificateService.js` — PDF certificate generation via `@react-pdf/renderer`
- `services/geminiService.js` — AI backend integration
- `uploads/` — Local file storage for Multer (Cloudinary also configured)

### Socket.IO
The backend creates an HTTP server with Socket.IO for the forum. Events: `joinChannel`, `leaveChannel`, `sendMessage`. Messages are persisted to `ForumMessage` via Sequelize and broadcast to channel rooms.

### Frontend Context
- `AuthContext.js` — User authentication state, token management
- `ThemeContext.js` — Dark/light theme; brand gradient is Blue (`#6366f1`) to Purple (`#8b5cf6`). Edit here to change colors.
- `DataContext.js` — Shared data state
- `ToastContext.js` — App-wide toast notifications

### Database Models (26 total)
Core hierarchy: `User` → `Enrollment` → `Course` → `Topic` → `Material`

Additional models: `Quiz`, `QuizResult`, `Certificate`, `CertificateTemplate`, `TemplateCourse`, `AIChatSession`, `AIChatMessage`, `Notification`, `Feedback`, `Category`, `Progress`, `DailyActivity`, `ForumChannel`, `ForumMessage`, `LibraryItem`, `LiveLecture`, `Recording`, `Sponsorship`, `StudentUpload`, `Todo`, `Admin`

### Permissions System
`instructor` users have a `permissions` JSON column on the `User` model. `superadmin` bypasses all permission checks. Permission keys: `canManageAllCourses`, `canManageCategories`, `canManageStudents`, `canManageCertificates`, `canViewFeedback`.

### Deployment
- Frontend: Vercel (`AppAndroidSS/vercel.json`)
- Backend: Railway (`backend/railway.json`, `backend/Procfile`)
- Root `railway.toml` and `nixpacks.toml` for Railway build config
