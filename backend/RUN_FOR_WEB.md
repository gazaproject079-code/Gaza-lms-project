# Running Backend for Web

## Quick Start Commands

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies (First Time Only)
```bash
npm install
```

### 3. Create and Configure .env File

Create a `.env` file in the `backend` directory:

**Windows PowerShell:**
```powershell
New-Item -Path .env -ItemType File
```

**Linux/Mac:**
```bash
touch .env
```

Add the following content to `.env`:
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

### 4. Ensure MySQL is Running

Make sure your MySQL server is running before starting the backend.

### 5. Create Super Admin (First Time Only)
```bash
npm run seed
```

### 6. Start the Backend Server

**For Development (Recommended - with auto-reload):**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

## Server Information

Once started, the backend will be available at:
- **Base URL:** `http://localhost:5000`
- **API Base:** `http://localhost:5000/api`
- **Health Check:** `http://localhost:5000/health`

## Testing the Server

### Test Health Endpoint
Open your browser and visit:
```
http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Test Login Endpoint
You can test the login using curl or Postman:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"skillsphereadmin@admin.com\",\"password\":\"skillsphere@123\"}"
```

**Using PowerShell (Windows):**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"skillsphereadmin@admin.com","password":"skillsphere@123"}'
```

## Connecting Frontend to Backend

### For React Native Web / React Web App

Update your API configuration in the frontend to point to:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### CORS Configuration

The backend already has CORS enabled, so it will accept requests from:
- `http://localhost:3000` (React default)
- `http://localhost:8080` (Webpack dev server)
- Any other origin (configured in `server.js`)

If you need to restrict CORS, edit `backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
```

## Running Both Frontend and Backend

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd AppAndroidSS
npm run web
# or
npm run web:dev
```

## Common Issues

### Port Already in Use
If port 5000 is already in use, change it in `.env`:
```env
PORT=5001
```

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists or MySQL user has CREATE DATABASE permission

### Module Not Found
Run:
```bash
npm install
```

## Production Deployment

For production, you'll need to:
1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name skillsphere-backend
   ```
3. Configure a reverse proxy (nginx/Apache)
4. Use environment-specific database credentials
5. Set a strong `JWT_SECRET`

## API Endpoints Summary

All endpoints are prefixed with `/api`:

- **Auth:** `/api/auth/login`, `/api/auth/profile`
- **Admins:** `/api/admins` (super admin only)
- **Categories:** `/api/categories`
- **Courses:** `/api/courses`
- **Topics:** `/api/topics`
- **Materials:** `/api/materials`
- **Feedback:** `/api/feedback`

## Example Frontend API Call

```javascript
// Login example
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data;
};

// Get courses (with auth token)
const getCourses = async (token) => {
  const response = await fetch('http://localhost:5000/api/courses', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data;
};
```

## Next Steps

1. ✅ Backend is running on `http://localhost:5000`
2. Update frontend API service to use `http://localhost:5000/api`
3. Replace static data calls with API calls
4. Test all endpoints with your frontend



