# SkillSphere Deployment Guide

This guide explains how to deploy SkillSphere in a production environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Creating Super Admin](#creating-super-admin)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Production Checklist](#production-checklist)

---

## Prerequisites

Before deploying, ensure you have:
- Node.js v18+ installed
- MySQL 8.0+ database server
- A domain name (for production)
- SSL certificate (for HTTPS)
- SMTP email service credentials (Gmail, SendGrid, AWS SES, etc.)

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd skillsphere_app
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your production values:

```env
# Database Configuration
MYSQL_DB=SkillSphere_Db
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_secure_password
MYSQL_HOST=your_db_host
MYSQL_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret - IMPORTANT: Generate a strong random string
JWT_SECRET=your_very_long_random_secret_key_here_at_least_64_characters

# Super Admin Credentials
SUPER_ADMIN_EMAIL=skillspherefyp@gmail.com
SUPER_ADMIN_PASSWORD=your_secure_admin_password

# SMTP Configuration for Email
# For Gmail: Use App Password (https://myaccount.google.com/apppasswords)
# For SendGrid/AWS SES: Use your API credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Firebase Configuration (for Google OAuth)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

### Important Security Notes:
- **JWT_SECRET**: Generate a strong random string (64+ characters). You can use:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **SUPER_ADMIN_PASSWORD**: Use a strong password (12+ characters, mixed case, numbers, symbols)
- **Never commit `.env` file to version control**

---

## Database Setup

### 1. Create the Database

```sql
CREATE DATABASE SkillSphere_Db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'skillsphere_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON SkillSphere_Db.* TO 'skillsphere_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Initialize Database Tables

The application will automatically create tables when it starts for the first time.

Alternatively, you can run the sync manually:
```bash
node -e "require('./config/database').testConnection().then(() => process.exit(0))"
```

---

## Creating Super Admin

### Method 1: Using the Seed Script (Recommended for Initial Setup)

This is the standard way to create the super admin account:

```bash
cd backend
npm run seed
```

This will:
1. Connect to the database
2. Create tables if they don't exist
3. Create the super admin account using credentials from `.env`
4. Send a welcome email to the super admin

### Method 2: Manual Creation (For Production After Database Reset)

If you need to create a super admin without running the full seed script:

```bash
cd backend
node scripts/seedSuperAdmin.js
```

### Method 3: Using Database Directly (Emergency Only)

If you cannot run scripts, you can create the super admin directly in the database:

```sql
-- First, generate a bcrypt hash of your password (do this in Node.js):
-- node -e "require('bcryptjs').hash('your_password', 10).then(h => console.log(h))"

INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt)
VALUES (
  'Super Admin',
  'skillspherefyp@gmail.com',
  '$2a$10$your_bcrypt_hash_here',
  'superadmin',
  1,
  NOW(),
  NOW()
);
```

### Verifying Super Admin Creation

After creation, you should see:
```
✅ Super admin created successfully!
   Email: skillspherefyp@gmail.com
   Password: [your_password]
   Role: superadmin
📧 Sending welcome email to super admin...
✅ Welcome email sent successfully!
```

---

## Backend Deployment

### Option 1: Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application:
```bash
cd backend
pm2 start server.js --name skillsphere-backend
```

3. Configure PM2 to start on boot:
```bash
pm2 startup
pm2 save
```

4. Useful PM2 commands:
```bash
pm2 status              # Check status
pm2 logs skillsphere    # View logs
pm2 restart skillsphere # Restart
pm2 stop skillsphere    # Stop
```

### Option 2: Using Docker

1. Create a `Dockerfile` in the backend folder:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

2. Build and run:
```bash
docker build -t skillsphere-backend .
docker run -d -p 5000:5000 --env-file .env skillsphere-backend
```

### Option 3: Cloud Deployment (AWS, GCP, Azure, etc.)

Configure your cloud provider's deployment service to:
1. Use Node.js 18+ runtime
2. Set environment variables from `.env`
3. Run `npm install` on build
4. Start with `node server.js`

---

## Frontend Deployment

### For Web (React Native Web)

1. Navigate to the app folder:
```bash
cd AppAndroidSS
```

2. Update API_BASE URL in `src/services/apiClient.js`:
```javascript
// Change this to your production backend URL
const getHost = () => {
  if (Platform.OS === 'web') return 'https://your-api-domain.com';
  return 'https://your-api-domain.com';
};
```

3. Build for production:
```bash
npm run build:web
```

4. Deploy the `web-build` folder to your web hosting service (Netlify, Vercel, AWS S3, etc.)

### For Android

1. Update the API URL for production
2. Build the APK:
```bash
cd android
./gradlew assembleRelease
```

3. Sign and publish to Google Play Store

---

## Production Checklist

Before going live, ensure:

### Security
- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Secure SUPER_ADMIN_PASSWORD
- [ ] HTTPS enabled (SSL certificate)
- [ ] Database credentials are secure
- [ ] `.env` file is NOT in version control
- [ ] CORS is properly configured

### Database
- [ ] Database is backed up regularly
- [ ] Database user has minimal required permissions
- [ ] Connection pooling is configured

### Email
- [ ] SMTP credentials are correct
- [ ] Test emails are being received (Gmail AND Outlook)
- [ ] Email from address is verified with your provider

### Performance
- [ ] Node.js is running in production mode (`NODE_ENV=production`)
- [ ] Static files are served with caching headers
- [ ] Database queries are optimized

### Monitoring
- [ ] Error logging is configured
- [ ] Health check endpoint is monitored
- [ ] PM2 or similar process manager is running

---

## Troubleshooting

### Super Admin Not Created
1. Check database connection in `.env`
2. Verify tables exist in database
3. Check console for specific error messages

### Emails Not Sending
1. Verify SMTP credentials
2. For Gmail: Use App Password, not regular password
3. Check if email service allows SMTP access
4. Check spam folder

### Database Connection Issues
1. Verify MySQL is running
2. Check host, port, user, password in `.env`
3. Ensure database exists

### Health Check
Test the backend is running:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "OK", "timestamp": "..."}
```

---

## Support

For issues or questions, please:
1. Check the error logs: `pm2 logs skillsphere-backend`
2. Review the console output during startup
3. Contact the development team

---

*Last updated: January 2026*
