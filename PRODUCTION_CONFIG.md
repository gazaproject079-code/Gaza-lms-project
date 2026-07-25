# Production Configuration Guide

This guide lists all the critical configurations needed for production deployment.

---

## ✅ Already Configured

### 1. Google OAuth Service
**File**: `AppAndroidSS/src/services/googleAuthService.js`

✅ **Auto-detects environment** - Works for both:
- Development: `http://localhost:3000`
- Production: Automatically uses your Vercel domain

**What was updated**:
- Added `getRedirectUri()` function that automatically detects the current domain
- Works seamlessly in both development and production
- No manual changes needed when deploying!

**Google Cloud Console Setup** (One-time):
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project: `skillsphere-f3701`
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for development)
   - `https://your-vercel-domain.vercel.app` (after deployment)
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000` (for development)
   - `https://your-vercel-domain.vercel.app` (after deployment)
6. Click **Save**

---

### 2. JWT Secret
**File**: `backend/.env` (local only, not committed)

✅ **Configured**: `b45d03da1ee1079c7609cc536c7069be78df0dbe03568f312c42a413ec5696961c75c9a4167352c8fb5fd24e9624e69afb29af587408b3bae2f7bda89d20c7be`

**⚠️ IMPORTANT**:
- Use the **SAME** JWT secret in Railway deployment
- This ensures tokens work across environments
- Never share this secret publicly

**Railway Setup**:
When deploying to Railway, add this environment variable:
```
JWT_SECRET=b45d03da1ee1079c7609cc536c7069be78df0dbe03568f312c42a413ec5696961c75c9a4167352c8fb5fd24e9624e69afb29af587408b3bae2f7bda89d20c7be
```

---

## 📋 Environment Variables Checklist

### Backend (Railway)

Copy these to Railway environment variables:

```env
# Database (Railway provides these automatically)
MYSQL_URL=${{MySQL.DATABASE_URL}}
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DB=${{MySQL.MYSQLDATABASE}}

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (CRITICAL - Use the same one)
JWT_SECRET=b45d03da1ee1079c7609cc536c7069be78df0dbe03568f312c42a413ec5696961c75c9a4167352c8fb5fd24e9624e69afb29af587408b3bae2f7bda89d20c7be

# Super Admin Credentials
SUPER_ADMIN_EMAIL=skillspherefyp@gmail.com
SUPER_ADMIN_PASSWORD=skillsphere@123
SUPER_ADMIN_NAME=Super Admin

# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=skillspherefyp@gmail.com
SMTP_PASS=zgqg ajah zxdc zltb

# Firebase Configuration (for Google OAuth)
FIREBASE_PROJECT_ID=skillsphere-f3701
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@skillsphere-f3701.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+fkLzJVOQXNdU\nwtwV7X+KNtwCEDGXyLSEFqwE3R8Dgd2L2uGdGNS6kAciqFBZKTXhrra/XAgNSGvO\n6J+BdW2AfvflpdFjh9LGtzIaT+hy/rga4JQJPAVdURYaTwL42MD51VqCepm7OhX6\nPRl/w3jaS/OCDTk0xK1Wj0iDa4+TtHXFa8grySPPpPKvjGVDHPspsvMVykKO5Iwr\nVYEyDdNVWIFQNWR8wLufpNALfwmTTWfm049HatcPIBe54HtJRL/qi3XvxrmG4mej\nrlQzG8lci0dU7R8lOjM+SYhtqbvInelO7bnjUshsXSoj71AaGva/day9BAsbco3c\nQPBJRHePAgMBAAECggEAAakuKKdZqPeP23a7eBsS/2YZ2V0n+yMBcYL7fitc+tw/\nmnMoTNG+zd81mlEnXWLYZZ67vyosc8xlP2+UL6SR3Aq/Wvds8bycbNkdQB3hClrU\n/H8BK2qkWiG72wAQ9MR6O9nNXGsSbg+qlpaNY1zIvMNOwzW3gV55ntIu/d5XnFN0\nzOXmqaUoIN5RRjZFVQltIEATs0f/lXPefe5sOoaLBB30bI/eFZaxcP1+M6rrcKyB\nVpCLTFsb31pk/WvkdsKKLJIkUcT3HGgSz4M5v5mZRtLnfUnmb9sI1IogiR9Pw/+s\nK4jQ3JSRowEOBSMu3midMON5CTXH7hVqf9aQLlbi0QKBgQDxZmLdX2zBMjQDMbw9\nSBmAS5Aqzu07oriyh6luef944mKOUYO0spkLN2fQLghJOe5V1eWxDCDn/NhuYVUV\nW+lIiUW4HdSoxE9b9go7BKoISmaIGAincq7RvV3uetwM+S0Iw5iixZvnyaRS38C6\nVgvG4fG/Y+1oiTBgFh0OLSCY5wKBgQDKA66z/AWSASZ/9ymEUIPPa4fJ6I4lXX9L\n+XY9IAKNOlgAvd532e9+Xtv2HaflW9CvBZomOpGa0L/BzP5SjJUzf/RuBbLyqmNe\nTMMp7Q6HFi8uFO78ECYt0D1JdiR4XvhfgryV0Ylwu1KAcW5KgHXftoJCKpN7Hcv/\ng4k3ouAPGQKBgGE8GoqMy2OucyDuQaJ1jkANL87udsRUsQzIdEjZvzvUBFrLHsAE\nSH0qHhjO0euc+BF/DPwZpI+NWyhq8DigQwFCueCFs4kfOdAS9N/86vhX76DV/XZl\nTWGSY2mR910KaUdkcfDuo/PjVttC4YCs9CVyEUxEVfaLe/7YKW/yYXT1AoGAHxYj\n+zRsEwS0TPrW27KcJf4RHkP4I83YefOAe3WCjwMMacjOBDl4PkUQqjX0ETpoyZYe\nG4XlxCIdcBBAjqltiEhHb+rWl7saoXdEjR4anzUNu5SjFgzSIzipRbW1dQSASgpP\nROrCsKNS1csewr4z5WIrd00f9tEmBELUicg5nHkCgYEAiMfXQvY88Ow/ofgUsTC5\nJB6FB21Up/YR9ntxpmfcLxLvw95V1eF1ewPQSG01ftPw5nqCVPybFQNqRTYlflxq\nixZmbG7fnXml18U9/CTM/8Dis75TXnYqpNNGBw1qXA7ZrFFOrBHkP5mvvoK4+U3A\npd/7CyHqmranp31dArHKICY=\n-----END PRIVATE KEY-----\n"

# Frontend URL (Add after Vercel deployment)
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

---

### Frontend (Vercel)

Add this environment variable in Vercel dashboard:

```env
REACT_APP_API_URL=https://your-railway-domain.up.railway.app
```

---

## 🔐 Security Notes

### ✅ Protected Files (Not in Git)
- `backend/.env` - Contains secrets, never committed
- `backend/node_modules/` - Dependencies
- `AppAndroidSS/node_modules/` - Dependencies
- `AppAndroidSS/web-build/` - Build output

### ⚠️ Keep These Secret
1. **JWT_SECRET** - Never share publicly
2. **SMTP_PASS** - Gmail app password
3. **FIREBASE_PRIVATE_KEY** - Firebase credentials
4. **SUPER_ADMIN_PASSWORD** - Change after first login

### 📝 Safe to Share
- Repository code (already public)
- Configuration files (.env.example)
- Documentation files

---

## 🚀 Deployment Steps Summary

### 1. Deploy Backend (Railway)
```bash
1. Push code to GitHub ✅ (Already done!)
2. Connect Railway to GitHub repo
3. Add MySQL database
4. Copy environment variables from above
5. Deploy and get Railway URL
```

### 2. Deploy Frontend (Vercel)
```bash
1. Connect Vercel to GitHub repo
2. Set root directory: AppAndroidSS
3. Add REACT_APP_API_URL environment variable
4. Deploy and get Vercel URL
```

### 3. Post-Deployment
```bash
1. Update FRONTEND_URL in Railway
2. Update Google OAuth redirect URIs
3. Test the application
4. Change Super Admin password
```

---

## 📱 Google OAuth - Final Setup

After deploying to Vercel, add your domain to Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select OAuth 2.0 Client ID: `1027771061-5gdm8g72cimck7bjpgknspaqkisfme4g.apps.googleusercontent.com`
3. Add your Vercel URL to:
   - **Authorized JavaScript origins**
   - **Authorized redirect URIs**
4. Save changes

**No code changes needed** - the app will automatically detect and use your production domain!

---

## ✅ Configuration Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Google OAuth Auto-Detection | ✅ Configured | Works in dev & prod automatically |
| JWT Secret | ✅ Set | Use same secret in Railway |
| Backend .env | ✅ Ready | Copy to Railway variables |
| Frontend API URL | ⏳ After Railway | Set in Vercel after backend deployed |
| CORS Configuration | ✅ Ready | Auto-configured for production |
| Database Config | ✅ Ready | Supports Railway MySQL |

---

## 🎯 Next Steps

1. **Deploy Backend to Railway**
   - See: `DEPLOYMENT_GUIDE.md`
   - Copy environment variables from this file

2. **Deploy Frontend to Vercel**
   - See: `DEPLOYMENT_GUIDE.md`
   - Add REACT_APP_API_URL with Railway URL

3. **Update Google OAuth**
   - Add Vercel domain to Google Cloud Console

4. **Test Everything**
   - Login with Super Admin
   - Test Google OAuth
   - Create test course
   - Send test email

---

**All configurations are ready for production deployment!** 🚀

Follow the `DEPLOYMENT_GUIDE.md` for step-by-step deployment instructions.
