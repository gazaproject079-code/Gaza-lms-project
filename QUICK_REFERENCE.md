# SkillSphere - Quick Reference Guide

---

## 🔑 Essential URLs

### Development
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
API:       http://localhost:5000/api
Health:    http://localhost:5000/health
```

### Production (Update after deployment)
```
Frontend:  https://your-app.vercel.app
Backend:   https://your-app.up.railway.app
API:       https://your-app.up.railway.app/api
Health:    https://your-app.up.railway.app/health
```

---

## ⚡ Quick Commands

### Backend (Express.js)
```bash
cd backend

# Development
npm run dev              # Start with nodemon

# Production
npm start                # Start server

# Database
npm run seed             # Seed super admin
npm run reset:db         # Reset database
npm run migrate:permissions  # Add permissions column
```

### Frontend (React Native Web)
```bash
cd AppAndroidSS

# Web Development
npm run web:dev          # Development server (localhost:3000)

# Web Production
npm run build:web        # Build for production
npm run vercel-build     # Build for Vercel

# Mobile
npm run android          # Run on Android
npm run ios             # Run on iOS
npm start               # Start Metro bundler
```

---

## 🚀 Deployment Commands

### Push to GitHub
```bash
git add .
git commit -m "Your message"
git push origin main
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Backend Health
```bash
curl https://your-backend-url.up.railway.app/health
```

### Test Login API
```bash
curl -X POST https://your-backend-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

---

## 🔐 Default Credentials

### Super Admin (Configure in .env)
```
Email:    SUPER_ADMIN_EMAIL from .env
Password: SUPER_ADMIN_PASSWORD from .env
```

**⚠️ IMPORTANT**: Change password after first login!

---

## 📝 Environment Variables

### Backend Railway Variables (Required)
```env
MYSQL_URL=${{MySQL.DATABASE_URL}}
PORT=5000
NODE_ENV=production
JWT_SECRET=<64-char-random-string>
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=<strong-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<gmail-app-password>
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend Vercel Variables (Required)
```env
REACT_APP_API_URL=https://your-backend.up.railway.app
```

---

## 🛠️ Deployment Platforms

### Railway (Backend)
```
Website:   https://railway.app
Dashboard: https://railway.app/dashboard
Docs:      https://docs.railway.app
Free Tier: $5 credit/month
```

### Vercel (Frontend)
```
Website:   https://vercel.com
Dashboard: https://vercel.com/dashboard
Docs:      https://vercel.com/docs
Free Tier: Unlimited deployments
```

---

## 📊 File Structure

### Backend Entry Point
```
backend/server.js       # Main server file
backend/config/database.js  # Database config
backend/models/index.js     # All models
backend/routes/         # API routes
```

### Frontend Entry Point
```
AppAndroidSS/index.web.js   # Web entry
AppAndroidSS/App.js         # Main app component
AppAndroidSS/src/services/apiClient.js  # API client
```

### Deployment Configs
```
backend/railway.json        # Railway config
backend/Procfile           # Process file
AppAndroidSS/vercel.json   # Vercel config
AppAndroidSS/webpack.config.js  # Webpack config
```

---

## 🔍 Debugging

### Check Backend Logs (Railway)
1. Go to Railway Dashboard
2. Click on your backend service
3. Click "Logs" tab
4. Filter by "Errors" if needed

### Check Frontend Logs (Vercel)
1. Go to Vercel Dashboard
2. Click on your project
3. Click "Deployments"
4. Click on latest deployment
5. View "Build Logs" or "Function Logs"

### Check Browser Console
1. Open your deployed frontend
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to "Console" tab
4. Check for errors

### Common Error Messages

**"Cannot connect to database"**
- Check if MySQL service is running on Railway
- Verify MYSQL_URL environment variable

**"CORS policy error"**
- Update FRONTEND_URL in Railway backend
- Redeploy backend

**"Network request failed"**
- Verify REACT_APP_API_URL in Vercel
- Check if backend is running

**"JWT Secret not configured"**
- Set JWT_SECRET in Railway
- Redeploy backend

---

## 📱 Testing Checklist

### Backend Health
- [ ] Visit: `https://your-backend.up.railway.app/health`
- [ ] Should return: `{"status":"OK","message":"Server is running"}`

### Frontend Loading
- [ ] Visit: `https://your-frontend.vercel.app`
- [ ] Page loads without errors
- [ ] No CORS errors in console

### Authentication
- [ ] Login with Super Admin works
- [ ] JWT token is saved
- [ ] Protected routes require authentication

### Database
- [ ] Create category works
- [ ] Create course works
- [ ] Data persists after refresh

### Email
- [ ] OTP email is sent
- [ ] Welcome email is received
- [ ] Check spam folder if not in inbox

---

## 🎯 Important Notes

1. **Railway Free Tier**
   - $5 credit per month
   - Services sleep after inactivity
   - Set up sleep mode to conserve credits

2. **Vercel Free Tier**
   - Unlimited deployments
   - 100GB bandwidth/month
   - Automatic HTTPS

3. **Gmail SMTP**
   - Use App Password, not regular password
   - May not work with all email providers
   - Consider SendGrid for production

4. **Environment Variables**
   - Never commit .env files
   - Update both Railway and Vercel after changes
   - Redeploy after updating variables

5. **Database**
   - Railway MySQL auto-created
   - Backup data regularly
   - Consider migration strategy for schema changes

---

## 🔗 Important Links

### Documentation
- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [README](./README.md)
- [Backend API Docs](./backend/API_DOCUMENTATION.md)

### External Services
- [Railway Dashboard](https://railway.app)
- [Vercel Dashboard](https://vercel.com)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [SendGrid](https://sendgrid.com) (alternative to Gmail)

---

## 💡 Pro Tips

1. **Monitor Your Usage**
   - Check Railway usage weekly
   - Watch for bandwidth limits on Vercel
   - Set up alerts if available

2. **Keep Secrets Secure**
   - Use password manager for credentials
   - Rotate JWT secret periodically
   - Never share .env files

3. **Optimize Costs**
   - Enable sleep mode on Railway
   - Minimize database connections
   - Use CDN for static assets

4. **Development Workflow**
   - Test locally before deploying
   - Use git branches for features
   - Deploy from main/master branch only

5. **Backup Strategy**
   - Export database regularly
   - Keep backup of environment variables
   - Save uploaded files externally

---

## 🆘 Need Help?

1. **Check Documentation**
   - Read DEPLOYMENT_GUIDE.md
   - Review troubleshooting section

2. **Check Logs**
   - Railway logs for backend errors
   - Vercel logs for build errors
   - Browser console for frontend errors

3. **Verify Configuration**
   - All environment variables set
   - URLs are correct (no trailing slash)
   - Services are deployed and running

4. **Test Components**
   - Backend health endpoint
   - Frontend loading
   - Database connection
   - API calls

---

**Last Updated**: 2026-02-01

Save this file for quick reference during deployment! ⚡
