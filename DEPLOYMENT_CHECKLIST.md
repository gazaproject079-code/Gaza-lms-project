# SkillSphere Deployment Checklist

Use this checklist to ensure you complete all steps for successful deployment.

---

## Pre-Deployment Checklist

### Accounts Setup
- [ ] Create GitHub account
- [ ] Create Railway account (https://railway.app)
- [ ] Create Vercel account (https://vercel.com)
- [ ] Create Gmail App Password OR SendGrid account

### Prepare Credentials

- [ ] Generate JWT Secret
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Get Gmail App Password (or SendGrid API key)
- [ ] Prepare Super Admin email and password
- [ ] (Optional) Get Firebase credentials for Google OAuth

---

## Backend Deployment (Railway)

### Step 1: Repository Setup
- [ ] Initialize git repository
  ```bash
  git init
  ```
- [ ] Create GitHub repository
- [ ] Push code to GitHub
  ```bash
  git add .
  git commit -m "Initial commit for deployment"
  git remote add origin https://github.com/YOUR_USERNAME/skillsphere-app.git
  git push -u origin main
  ```

### Step 2: Railway Setup
- [ ] Login to Railway
- [ ] Create new project from GitHub repo
- [ ] Add MySQL database to project
- [ ] Configure backend service:
  - [ ] Set Root Directory: `backend`
  - [ ] Set Start Command: `node server.js`

### Step 3: Environment Variables
- [ ] Set all required environment variables in Railway:
  ```
  MYSQL_URL=${{MySQL.DATABASE_URL}}
  MYSQL_HOST=${{MySQL.MYSQLHOST}}
  MYSQL_PORT=${{MySQL.MYSQLPORT}}
  MYSQL_USER=${{MySQL.MYSQLUSER}}
  MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
  MYSQL_DB=${{MySQL.MYSQLDATABASE}}
  PORT=5000
  NODE_ENV=production
  JWT_SECRET=<your-generated-secret>
  SUPER_ADMIN_EMAIL=<your-email>
  SUPER_ADMIN_PASSWORD=<your-password>
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=<your-email>
  SMTP_PASS=<your-app-password>
  FRONTEND_URL=<will-add-after-vercel-deployment>
  ```

### Step 4: Deploy & Verify
- [ ] Deploy backend on Railway
- [ ] Generate public domain for backend
- [ ] Copy backend URL (e.g., https://xxx.up.railway.app)
- [ ] Test health endpoint: `https://your-backend-url/health`

---

## Frontend Deployment (Vercel)

### Step 1: Update Code
- [ ] Create `.env` in `AppAndroidSS/`:
  ```
  REACT_APP_API_URL=https://your-railway-backend-url.up.railway.app
  ```
- [ ] Commit and push changes
  ```bash
  git add .
  git commit -m "Configure for Vercel deployment"
  git push origin main
  ```

### Step 2: Vercel Setup
- [ ] Login to Vercel
- [ ] Import project from GitHub
- [ ] Configure build settings:
  - [ ] Framework Preset: Other
  - [ ] Root Directory: `AppAndroidSS`
  - [ ] Build Command: `npm run vercel-build`
  - [ ] Output Directory: `web-build`
  - [ ] Install Command: `npm install`

### Step 3: Environment Variables
- [ ] Add `REACT_APP_API_URL` in Vercel:
  - Value: `https://your-railway-backend-url.up.railway.app`
  - Environments: Production, Preview, Development

### Step 4: Deploy & Verify
- [ ] Deploy frontend on Vercel
- [ ] Copy frontend URL (e.g., https://skillsphere.vercel.app)
- [ ] Visit frontend URL and verify it loads

---

## Post-Deployment Configuration

### Update Backend CORS
- [ ] Go back to Railway
- [ ] Update `FRONTEND_URL` environment variable with Vercel URL
- [ ] Redeploy backend service

### Final Testing
- [ ] Test backend health endpoint
- [ ] Test Super Admin login on frontend
- [ ] Test creating a category/course
- [ ] Test email sending (signup OTP or forgot password)
- [ ] Test file upload functionality
- [ ] Check browser console for any errors

---

## Verification Tests

### Backend Tests
- [ ] Health check works: `curl https://your-backend-url/health`
- [ ] Database connection successful (check Railway logs)
- [ ] Super Admin auto-created (check Railway logs)
- [ ] No errors in Railway logs

### Frontend Tests
- [ ] Website loads without errors
- [ ] No CORS errors in browser console
- [ ] Login works correctly
- [ ] Navigation works
- [ ] Images and assets load correctly

### Integration Tests
- [ ] Frontend can connect to backend
- [ ] Login authentication works
- [ ] Data fetching works (categories, courses)
- [ ] Data creation works (create category, course)
- [ ] File upload works
- [ ] Email sending works

---

## Post-Launch Checklist

### Security
- [ ] Change Super Admin password after first login
- [ ] Verify JWT secret is strong (64+ characters)
- [ ] Enable 2FA on Railway and Vercel accounts
- [ ] Review CORS settings

### Monitoring
- [ ] Set up Railway usage monitoring
- [ ] Set up Vercel analytics
- [ ] Monitor error logs regularly
- [ ] Set up uptime monitoring (optional)

### Documentation
- [ ] Save all credentials securely
- [ ] Document backend URL
- [ ] Document frontend URL
- [ ] Document Super Admin credentials
- [ ] Share access with team members (if applicable)

---

## Common Issues & Solutions

### ❌ "Cannot connect to database"
**Solution**: Check if MySQL service is running on Railway and environment variables are correctly set

### ❌ "CORS error"
**Solution**: Verify FRONTEND_URL is set in Railway backend, then redeploy

### ❌ "Network request failed"
**Solution**: Verify REACT_APP_API_URL is set correctly in Vercel

### ❌ "Email not sending"
**Solution**: Check SMTP credentials, ensure using App Password for Gmail

### ❌ "Build failed"
**Solution**: Check build logs in Vercel, verify build settings

---

## URLs to Save

After deployment, save these URLs:

```
Backend (Railway): https://_________________________.up.railway.app
Frontend (Vercel): https://_________________________.vercel.app

Super Admin Email: _________________________
Super Admin Password: _________________________

Railway Dashboard: https://railway.app/project/_________________________
Vercel Dashboard: https://vercel.com/_________________________/skillsphere
```

---

## Next Steps

- [ ] Test all application features thoroughly
- [ ] Create additional admin accounts
- [ ] Add courses and content
- [ ] Customize branding (if needed)
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)
- [ ] Set up automated backups (Railway Pro feature)

---

**Deployment Status**: ⬜ Not Started | 🔄 In Progress | ✅ Completed

Mark each checkbox as you complete the step!
