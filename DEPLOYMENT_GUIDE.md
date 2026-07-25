# SkillSphere Deployment Guide

Complete guide to deploy SkillSphere application with:
- **Frontend**: Vercel (Free tier)
- **Backend**: Railway (Free tier with $5 credit)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment on Railway](#backend-deployment-on-railway)
3. [Frontend Deployment on Vercel](#frontend-deployment-on-vercel)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Testing the Deployment](#testing-the-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [x] Git installed on your machine
- [x] GitHub account
- [x] Railway account (sign up at https://railway.app)
- [x] Vercel account (sign up at https://vercel.com)
- [x] Gmail account with App Password (for email service) OR SendGrid account

### Generate Gmail App Password

1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification (enable if not already)
3. Scroll to "App passwords" at the bottom
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password

### Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Backend Deployment on Railway

### Step 1: Prepare Your Repository

1. **Initialize Git repository (if not already done)**

```bash
cd "C:\Users\danis\Downloads\skillsphere_app (1)\skillsphere_app"
git init
git add .
git commit -m "Initial commit for deployment"
```

2. **Push to GitHub**

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/skillsphere-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Railway

1. **Login to Railway**: Go to https://railway.app and sign in

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will detect it's a Node.js project

3. **Add MySQL Database**:
   - In your project dashboard, click "+ New"
   - Select "Database" > "Add MySQL"
   - Railway will create a MySQL database and provide connection credentials

4. **Configure Backend Service**:
   - Click on your backend service
   - Go to "Settings" tab
   - Set **Root Directory**: `backend`
   - Set **Start Command**: `node server.js`

5. **Set Environment Variables**:
   - Go to "Variables" tab
   - Click "Raw Editor" to paste all variables at once:

```env
# Railway will provide these automatically from MySQL plugin
MYSQL_URL=${{MySQL.DATABASE_URL}}
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DB=${{MySQL.MYSQLDATABASE}}

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (paste the one you generated)
JWT_SECRET=your_generated_jwt_secret_here

# Super Admin Credentials
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
SUPER_ADMIN_NAME=Super Admin

# SMTP Configuration (Gmail or SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password

# Firebase Configuration (for Google OAuth)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-email
FIREBASE_PRIVATE_KEY=your-private-key

# Frontend URL (we'll update this after deploying frontend)
FRONTEND_URL=
```

6. **Deploy**:
   - Click "Deploy" button
   - Railway will build and deploy your backend
   - Wait for deployment to complete (usually 2-3 minutes)

7. **Get Backend URL**:
   - Go to "Settings" tab
   - Under "Domains", click "Generate Domain"
   - Copy the generated URL (e.g., `https://skillsphere-backend.up.railway.app`)
   - **Save this URL - you'll need it for frontend configuration**

8. **Verify Backend Deployment**:
   - Visit: `https://your-railway-url.up.railway.app/health`
   - You should see: `{"status":"OK","message":"Server is running"}`

---

## Frontend Deployment on Vercel

### Step 1: Prepare Frontend Configuration

1. **Update API URL in local environment**:

Create `.env` file in `AppAndroidSS/` directory:

```env
REACT_APP_API_URL=https://your-railway-backend-url.up.railway.app
```

Replace `your-railway-backend-url` with your actual Railway domain.

2. **Commit the changes**:

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 2: Deploy Frontend on Vercel

1. **Login to Vercel**: Go to https://vercel.com and sign in

2. **Import Project**:
   - Click "Add New..." > "Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: Click "Edit" and select `AppAndroidSS`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `web-build`
   - **Install Command**: `npm install`

4. **Set Environment Variables**:
   - Click "Environment Variables"
   - Add the following variable:
     - **Name**: `REACT_APP_API_URL`
     - **Value**: `https://your-railway-backend-url.up.railway.app`
   - Make sure to add it for all environments (Production, Preview, Development)

5. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Wait for deployment to complete (usually 2-5 minutes)

6. **Get Frontend URL**:
   - After deployment, you'll see your frontend URL (e.g., `https://skillsphere.vercel.app`)
   - **Copy this URL**

---

## Post-Deployment Configuration

### Update Backend CORS Settings

Now that you have your Vercel frontend URL, update your backend environment variables on Railway:

1. Go to Railway dashboard > Your backend service > Variables
2. Update `FRONTEND_URL` variable with your Vercel URL:
   ```
   FRONTEND_URL=https://skillsphere.vercel.app
   ```
3. Click "Deploy" to restart the backend with new variables

### Verify CORS Configuration

1. Open your browser console (F12)
2. Visit your Vercel frontend URL
3. Try to login or make any API call
4. Check console for any CORS errors
5. If there are errors, verify:
   - FRONTEND_URL is set correctly on Railway
   - REACT_APP_API_URL is set correctly on Vercel
   - Backend has redeployed with new variables

---

## Testing the Deployment

### 1. Test Backend Health

```bash
curl https://your-railway-url.up.railway.app/health
```

Expected response:
```json
{"status":"OK","message":"Server is running"}
```

### 2. Test Super Admin Login

1. Visit your Vercel frontend URL
2. Try logging in with Super Admin credentials (email and password from environment variables)
3. You should be able to login successfully

### 3. Test Database Connection

1. Login as Super Admin
2. Navigate to admin dashboard
3. Try creating a category or course
4. Verify data persists after page refresh

### 4. Test Email Service

1. Try the "Forgot Password" or "Sign Up with OTP" feature
2. Check if you receive the email
3. If not, verify SMTP configuration in Railway environment variables

### 5. Test File Uploads

1. Try uploading a course image or material
2. Verify the upload succeeds
3. Check if the image displays correctly

---

## Troubleshooting

### Backend Issues

#### "Cannot connect to database"

**Solution**:
1. Go to Railway > MySQL service
2. Verify MySQL service is running (green status)
3. Check if environment variables are correctly linked:
   - `MYSQL_URL=${{MySQL.DATABASE_URL}}`
4. Redeploy backend service

#### "JWT Secret not configured"

**Solution**:
1. Go to Railway > Backend service > Variables
2. Verify `JWT_SECRET` is set and is a long random string
3. Generate new one if needed: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

#### "Email sending failed"

**Solution**:
1. For Gmail: Ensure you're using App Password, not regular password
2. For SendGrid: Verify API key is correct
3. Check SMTP settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password (16 chars, no spaces)
   ```

#### "CORS errors"

**Solution**:
1. Verify `FRONTEND_URL` in Railway includes `https://` prefix
2. Make sure there are no trailing slashes
3. Check backend logs for CORS error messages
4. Redeploy backend after updating FRONTEND_URL

### Frontend Issues

#### "Network request failed" or "Cannot connect to server"

**Solution**:
1. Go to Vercel > Your project > Settings > Environment Variables
2. Verify `REACT_APP_API_URL` is set correctly
3. Make sure the URL includes `https://` and NO trailing slash
4. Redeploy frontend after updating variables

#### "White screen" or "Build failed"

**Solution**:
1. Check Vercel build logs for specific errors
2. Verify `Root Directory` is set to `AppAndroidSS`
3. Verify `Build Command` is `npm run vercel-build`
4. Verify `Output Directory` is `web-build`
5. Try redeploying from Vercel dashboard

#### "Cannot read property of undefined"

**Solution**:
1. Check browser console for specific error
2. Verify all environment variables are set in Vercel
3. Clear browser cache and try again
4. Check if backend is responding: visit `https://your-railway-url.up.railway.app/health`

### Database Issues

#### "Table doesn't exist"

**Solution**:
- Backend auto-creates tables on startup
- Check Railway logs to see if sync completed
- If needed, restart the backend service

#### "Lost connection to MySQL server"

**Solution**:
1. Railway free tier has connection limits
2. Check if MySQL service is running
3. Restart MySQL service if needed
4. Consider upgrading to paid tier if you hit limits

---

## Railway Free Tier Limits

- **$5 credit per month**
- **500 hours of usage**
- **1GB RAM per service**
- **100GB bandwidth**

**Tips to stay within free tier**:
- Set services to sleep after 30 minutes of inactivity (Railway > Settings > Sleep Mode)
- Monitor your usage in Railway dashboard
- Consider upgrading if you exceed limits

---

## Vercel Free Tier Limits

- **100GB bandwidth per month**
- **Unlimited websites and deployments**
- **Automatic HTTPS**

---

## Monitoring Your Deployment

### Railway Monitoring

1. Go to Railway dashboard > Your project
2. Click "Metrics" to see:
   - CPU usage
   - Memory usage
   - Network usage
   - Deployment logs

### Vercel Monitoring

1. Go to Vercel dashboard > Your project
2. Click "Analytics" to see:
   - Page views
   - Performance metrics
   - Error tracking

---

## Updating Your Deployment

### Update Backend

1. Make changes to backend code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```
3. Railway will automatically detect changes and redeploy

### Update Frontend

1. Make changes to frontend code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. Vercel will automatically detect changes and redeploy

---

## Environment Variables Summary

### Backend (Railway)

| Variable | Example Value | Required |
|----------|--------------|----------|
| MYSQL_URL | ${{MySQL.DATABASE_URL}} | Yes |
| MYSQL_HOST | ${{MySQL.MYSQLHOST}} | Yes |
| MYSQL_PORT | 3306 | Yes |
| MYSQL_USER | ${{MySQL.MYSQLUSER}} | Yes |
| MYSQL_PASSWORD | ${{MySQL.MYSQLPASSWORD}} | Yes |
| MYSQL_DB | railway | Yes |
| PORT | 5000 | Yes |
| NODE_ENV | production | Yes |
| JWT_SECRET | (64-char random string) | Yes |
| SUPER_ADMIN_EMAIL | admin@example.com | Yes |
| SUPER_ADMIN_PASSWORD | SecurePassword123! | Yes |
| SMTP_HOST | smtp.gmail.com | Yes |
| SMTP_PORT | 587 | Yes |
| SMTP_USER | your-email@gmail.com | Yes |
| SMTP_PASS | your-app-password | Yes |
| FRONTEND_URL | https://skillsphere.vercel.app | Yes |
| FIREBASE_PROJECT_ID | your-project-id | Optional |
| FIREBASE_CLIENT_EMAIL | your-email | Optional |
| FIREBASE_PRIVATE_KEY | your-key | Optional |

### Frontend (Vercel)

| Variable | Example Value | Required |
|----------|--------------|----------|
| REACT_APP_API_URL | https://your-backend.up.railway.app | Yes |

---

## Custom Domain Setup (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel > Project > Settings > Domains
2. Add your domain (e.g., `skillsphere.com`)
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

### Add Custom Domain to Railway

1. Go to Railway > Project > Settings > Domains
2. Add your domain (e.g., `api.skillsphere.com`)
3. Configure DNS CNAME record as instructed
4. Update `REACT_APP_API_URL` in Vercel to use new domain

---

## Support

If you encounter issues:

1. Check Railway logs: Railway Dashboard > Service > Logs
2. Check Vercel logs: Vercel Dashboard > Deployments > Build Logs
3. Check browser console for frontend errors (F12)
4. Verify all environment variables are set correctly
5. Ensure your GitHub repository is up to date

---

## Security Recommendations

- [ ] Change default Super Admin password after first login
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable 2FA on Railway and Vercel accounts
- [ ] Regularly update dependencies
- [ ] Monitor Railway and Vercel usage
- [ ] Use SendGrid instead of Gmail for better email deliverability
- [ ] Set up database backups (Railway Pro feature)
- [ ] Review and restrict CORS origins as needed

---

## Next Steps

After successful deployment:

1. **Change Super Admin password** in the app settings
2. **Test all features** thoroughly
3. **Set up monitoring** and error tracking
4. **Configure custom domain** (optional)
5. **Set up CI/CD** for automated testing (optional)
6. **Enable analytics** to track usage

---

**Congratulations! Your SkillSphere application is now live!** 🎉

- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.up.railway.app

