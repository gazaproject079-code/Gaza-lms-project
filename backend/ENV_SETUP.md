# Environment Variables Configuration

## File Location
Create a `.env` file in the `backend` directory (same level as `package.json`)

## Required Environment Variables

Copy the following content into your `.env` file:

```env
# Database Configuration
MYSQL_DB=SkillSphere_Db
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (Change this to a secure random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Super Admin Credentials (Initial setup - will be created by seed script)
SUPER_ADMIN_EMAIL=skillsphereadmin@admin.com
SUPER_ADMIN_PASSWORD=skillsphere@123
```

## Setup Instructions

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create the `.env` file:
   ```bash
   # On Windows PowerShell
   New-Item -Path .env -ItemType File
   
   # On Linux/Mac
   touch .env
   ```

3. Copy the environment variables above into the `.env` file

4. Make sure MySQL is running and the database credentials are correct

5. Install dependencies:
   ```bash
   npm install
   ```

6. Run the seed script to create the super admin:
   ```bash
   npm run seed
   ```

7. Start the server:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

## Important Notes

- **Never commit the `.env` file to version control**
- Change `JWT_SECRET` to a secure random string in production
- Ensure MySQL server is running before starting the backend
- The database will be created automatically if it doesn't exist (if MySQL user has CREATE DATABASE privileges)



