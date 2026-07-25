# SkillSphere Backend API

Backend API for SkillSphere Admin Panel built with Node.js, Express, MySQL, and Sequelize.

## Features

- Admin authentication with JWT
- Super admin can create and manage other admins
- Course management (CRUD operations)
- Category management
- Topic management
- Material management
- Feedback management
- MySQL database with Sequelize ORM

## Prerequisites

- Node.js (v16 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory. See `ENV_SETUP.md` for details.

```env
MYSQL_DB=SkillSphere_Db
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_HOST=localhost
MYSQL_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SUPER_ADMIN_EMAIL=skillsphereadmin@admin.com
SUPER_ADMIN_PASSWORD=skillsphere@123
```

### 3. Start MySQL Server

Make sure MySQL is running on your system.

### 4. Create Super Admin

Run the seed script to create the super admin account:

```bash
npm run seed
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get current admin profile (requires auth)

### Admins (Super Admin Only)
- `POST /api/admins` - Create new admin
- `GET /api/admins` - Get all admins
- `GET /api/admins/:id` - Get admin by ID
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin

### Categories
- `POST /api/categories` - Create category
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Courses
- `POST /api/courses` - Create course
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `PATCH /api/courses/:id/publish` - Publish course

### Topics
- `POST /api/topics` - Create topic
- `GET /api/topics/course/:courseId` - Get topics by course
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic

### Materials
- `POST /api/materials` - Create material
- `GET /api/materials` - Get materials (query: courseId, topicId)
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Feedback
- `POST /api/feedback` - Create feedback
- `GET /api/feedback` - Get all feedback
- `GET /api/feedback/:id` - Get feedback by ID
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Super Admin Credentials

- Email: `skillsphereadmin@admin.com`
- Password: `skillsphere@123`

## Database Schema

The database will be automatically created and synced when you start the server. Tables include:

- `admins` - Admin users
- `categories` - Course categories
- `courses` - Courses
- `topics` - Course topics
- `materials` - Course/topic materials
- `feedbacks` - Expert feedback

## Commands

```bash
# Install dependencies
npm install

# Run seed script (create super admin)
npm run seed

# Start server (development)
npm run dev

# Start server (production)
npm start
```

## Notes

- The database tables are automatically created on first run
- In production, use migrations instead of `sync()`
- Change `JWT_SECRET` to a secure random string
- Never commit `.env` file to version control



