# Backend Migration Guide: Admin to User Table

## Overview
The backend has been completely migrated from using separate `Admin` table to a unified `User` table that supports all user types (student, expert, admin, superadmin). Additionally, full student functionality has been implemented including enrollments, progress tracking, quizzes, certificates, and notifications.

---

## What Changed

### 1. Database Schema Changes

#### Admin → User Migration
- **Old**: `admins` table with roles: `superadmin`, `admin`, `expert`
- **New**: `users` table with roles: `student`, `expert`, `admin`, `superadmin`
- **New fields in User model**:
  - `phone` - Optional phone number
  - `profilePicture` - Optional profile picture URL
  - `role` - Now includes `student` as default role

#### Course Model Update
- **Old**: `adminId` foreign key → `admins.id`
- **New**: `userId` foreign key → `users.id`
- All courses now reference the `users` table

#### New Tables Created
1. **enrollments** - Student course enrollments
   - Tracks enrollment status, progress percentage, completion date

2. **progress** - Topic-level progress tracking
   - Tracks completion status, time spent per topic

3. **quizzes** - Course assessments
   - Stores questions, passing scores, time limits

4. **quiz_results** - Quiz submissions and scores
   - Tracks attempts, scores, passing status

5. **certificates** - Course completion certificates
   - Unique certificate numbers, verification URLs

6. **notifications** - User notifications
   - Support for different notification types, read status

---

### 2. Backend Code Changes

#### Models Created/Updated
- ✅ `User.js` - Unified user model (replaces Admin.js)
- ✅ `Enrollment.js` - Student enrollments
- ✅ `Progress.js` - Learning progress tracking
- ✅ `Quiz.js` - Course quizzes
- ✅ `QuizResult.js` - Quiz submissions
- ✅ `Certificate.js` - Certificates
- ✅ `Notification.js` - Notifications
- ✅ `Course.js` - Updated to use `userId` instead of `adminId`
- ✅ `index.js` - Updated all associations

#### Controllers Created/Updated
- ✅ `authController.js` - Updated to use User model, supports all roles
- ✅ `adminController.js` - Updated to use User model
- ✅ `courseController.js` - Updated to use User model
- ✅ `topicController.js` - Updated to use User model
- ✅ `enrollmentController.js` - NEW - Enrollment management
- ✅ `progressController.js` - NEW - Progress tracking
- ✅ `quizController.js` - NEW - Quiz operations
- ✅ `certificateController.js` - NEW - Certificate generation
- ✅ `notificationController.js` - NEW - Notification management

#### Routes Created/Updated
- ✅ `enrollmentRoutes.js` - NEW - `/api/enrollments`
- ✅ `progressRoutes.js` - NEW - `/api/progress`
- ✅ `quizRoutes.js` - NEW - `/api/quizzes`
- ✅ `certificateRoutes.js` - NEW - `/api/certificates`
- ✅ `notificationRoutes.js` - NEW - `/api/notifications`

#### Middleware Updated
- ✅ `auth.js` - Updated to use User model
- ✅ Added role-based middleware: `requireAdmin`, `requireExpert`, `requireStudent`

---

## Migration Steps

### Option 1: Fresh Installation (Recommended for Development)

1. **Backup your existing database**
   ```bash
   mysqldump -u root -p SkillSphere_Db > backup.sql
   ```

2. **Drop existing database and recreate**
   ```sql
   DROP DATABASE SkillSphere_Db;
   CREATE DATABASE SkillSphere_Db;
   ```

3. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Update environment variables** (`.env`)
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

5. **Run the server** (it will auto-create tables)
   ```bash
   npm run dev
   ```

6. **Seed super admin**
   ```bash
   npm run seed
   ```

---

### Option 2: Migrate Existing Data

1. **Backup your database**
   ```bash
   mysqldump -u root -p SkillSphere_Db > backup.sql
   ```

2. **Run the migration script**
   ```bash
   cd backend
   node scripts/migrateAdminToUser.js
   ```

   This script will:
   - Create `users` table
   - Copy all data from `admins` to `users`
   - Update `courses` table to use `userId` instead of `adminId`
   - Rename `admins` to `admins_backup`
   - Create all new student-related tables

3. **Start the server**
   ```bash
   npm run dev
   ```

4. **Verify migration**
   - Login with existing admin credentials
   - Check that courses are accessible
   - Register a new student account
   - Test student features

5. **After verification, drop backup table** (optional)
   ```sql
   DROP TABLE admins_backup;
   ```

---

## Testing the New Features

### 1. Test Authentication

**Register a student:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "student@test.com",
    "password": "password123",
    "role": "student"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123"
  }'
```

### 2. Test Enrollments

**Enroll in course:**
```bash
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"courseId": 1}'
```

**Get enrollments:**
```bash
curl http://localhost:5000/api/enrollments/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Progress

**Update topic progress:**
```bash
curl -X POST http://localhost:5000/api/progress/topic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "courseId": 1,
    "topicId": 1,
    "completed": true,
    "timeSpent": 3600
  }'
```

**Get statistics:**
```bash
curl http://localhost:5000/api/progress/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user (any role)
- `POST /api/auth/login` - Login (all user types)
- `GET /api/auth/profile` - Get current user

### Enrollments
- `GET /api/enrollments/my` - Get my enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:courseId` - Unenroll
- `GET /api/enrollments/check/:courseId` - Check enrollment

### Progress
- `GET /api/progress/my` - Get my progress
- `POST /api/progress/topic` - Update topic progress
- `GET /api/progress/stats` - Get learning stats
- `DELETE /api/progress/reset/:courseId` - Reset progress

### Quizzes
- `GET /api/quizzes/course/:courseId` - Get quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes/submit` - Submit quiz
- `GET /api/quizzes/results/my` - Get quiz results

### Certificates
- `GET /api/certificates/my` - Get my certificates
- `POST /api/certificates` - Generate certificate
- `GET /api/certificates/verify/:number` - Verify certificate

### Notifications
- `GET /api/notifications/my` - Get notifications
- `PUT /api/notifications/read/:id` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear/all` - Clear all

See `API_DOCUMENTATION.md` for complete API reference.

---

## Important Notes

### Authentication Changes
- The login response now returns `user` instead of `admin`
- All user types (student, expert, admin, superadmin) use the same login endpoint
- Default role for new registrations is `student`
- Frontend should check `user.role` to determine user type

### Database Schema
- The `admins` table is no longer used
- All user data is in the `users` table
- Courses now reference `userId` instead of `adminId`
- New tables use composite unique indexes to prevent duplicates

### Middleware Changes
- `req.admin` is now `req.user` in all controllers
- Use appropriate role middleware for access control:
  - `authenticateToken` - All authenticated users
  - `requireStudent` - Students only
  - `requireExpert` - Experts and above
  - `requireAdmin` - Admins and superadmins
  - `requireSuperAdmin` - Superadmins only

---

## Troubleshooting

### Error: "Unknown column 'adminId'"
- Run the migration script to update the courses table
- Or manually rename the column: `ALTER TABLE courses CHANGE adminId userId INT`

### Error: "Table 'users' doesn't exist"
- Make sure you ran `npm run dev` to create tables
- Or run the migration script

### Login fails after migration
- Check that data was properly copied from `admins` to `users`
- Verify password hashes were maintained
- Check user `isActive` status

### Foreign key constraint errors
- Ensure all course `userId` values exist in the `users` table
- Check that foreign key constraints are properly set

---

## Rollback Plan

If you need to rollback to the old system:

1. **Restore from backup**
   ```bash
   mysql -u root -p SkillSphere_Db < backup.sql
   ```

2. **Revert code changes** using git
   ```bash
   git checkout <previous_commit>
   ```

3. **Restart server**
   ```bash
   npm run dev
   ```

---

## Next Steps

1. ✅ All backend changes complete
2. ⏳ Update frontend to use new API endpoints
3. ⏳ Test all student features in the app
4. ⏳ Add admin UI for managing quizzes
5. ⏳ Implement certificate PDF generation
6. ⏳ Add email notifications

---

## Support

For issues or questions, please check:
- `API_DOCUMENTATION.md` for endpoint details
- `README.md` for general backend setup
- Server logs for error messages
