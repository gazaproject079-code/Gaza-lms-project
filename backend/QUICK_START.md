# Quick Start Guide - Backend Setup

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MySQL Server** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
3. **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the `backend` directory:

**On Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**On Linux/Mac:**
```bash
touch .env
```

### 4. Add Environment Variables

Open the `.env` file and add the following:

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

**Important:** 
- Update `MYSQL_USER` and `MYSQL_PASSWORD` to match your MySQL credentials
- Change `JWT_SECRET` to a secure random string (e.g., use a password generator)

### 5. Start MySQL Server

Make sure MySQL is running on your system:

**Windows:**
- Check MySQL service in Services (services.msc)
- Or start via command: `net start MySQL`

**Linux/Mac:**
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

### 6. Create Super Admin Account

Run the seed script to create the super admin:

```bash
npm run seed
```

Expected output:
```
✅ Database connection established
✅ Database synced
✅ Super admin created successfully!
   Email: skillsphereadmin@admin.com
   Password: skillsphere@123
   Role: superadmin
```

### 7. Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Expected output:
```
✅ Database connection has been established successfully.
✅ Database synced successfully
🚀 Server is running on http://localhost:5000
📚 API endpoints available at http://localhost:5000/api
```

### 8. Test the API

Open your browser or use a tool like Postman/curl:

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Login (Super Admin):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"skillsphereadmin@admin.com","password":"skillsphere@123"}'
```

## Common Commands

```bash
# Install dependencies
npm install

# Create super admin
npm run seed

# Start server (development with auto-reload)
npm run dev

# Start server (production)
npm start
```

## Troubleshooting

### Database Connection Error

**Error:** `Unable to connect to the database`

**Solutions:**
1. Verify MySQL is running
2. Check credentials in `.env` file
3. Ensure MySQL user has proper permissions
4. Check if MySQL port (3306) is correct

### Port Already in Use

**Error:** `Port 5000 is already in use`

**Solutions:**
1. Change `PORT` in `.env` file to a different port (e.g., 5001)
2. Or stop the process using port 5000

### Module Not Found

**Error:** `Cannot find module 'xxx'`

**Solution:**
```bash
npm install
```

### Database Sync Issues

If tables are not created:
1. Check database connection
2. Ensure MySQL user has CREATE TABLE permissions
3. Check console for specific error messages

## API Base URL

Once running, the API will be available at:
- **Local:** `http://localhost:5000`
- **API Base:** `http://localhost:5000/api`

## Next Steps

1. Test the API endpoints using Postman or curl
2. Integrate with your frontend application
3. Update frontend to use API endpoints instead of static data

## Super Admin Credentials

- **Email:** `skillsphereadmin@admin.com`
- **Password:** `skillsphere@123`

**⚠️ Important:** Change these credentials in production!



