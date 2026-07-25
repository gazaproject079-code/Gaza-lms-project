# SuperAdmin Credentials

## Default SuperAdmin Account

The seed script creates a default superadmin account with the following credentials:

### Credentials
- **Email**: `skillspheresuperadmin@admin.com`
- **Password**: `skillsphere@123`
- **Role**: `superadmin`

## How to Create SuperAdmin

### Method 1: Using Seed Script (Recommended)

```bash
cd backend
npm run seed
```

This will:
1. Create the `users` table if it doesn't exist
2. Check if superadmin already exists
3. Create a new superadmin account with the above credentials

### Method 2: Manual Database Insert

```sql
INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt)
VALUES (
  'Super Admin',
  'skillspheresuperadmin@admin.com',
  '$2a$10$hashedPasswordHere',  -- Use bcrypt to hash 'skillsphere@123'
  'superadmin',
  1,
  NOW(),
  NOW()
);
```

## Environment Variables

The credentials are configured in `.env`:

```env
SUPER_ADMIN_EMAIL=skillspheresuperadmin@admin.com
SUPER_ADMIN_PASSWORD=skillsphere@123
```

## Login

Use these credentials to login via:

### API Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "skillspheresuperadmin@admin.com",
    "password": "skillsphere@123"
  }'
```

### Frontend:
Simply use the login screen with the above email and password.

## Security Notes

⚠️ **IMPORTANT**: Change these credentials in production!

1. Update the `.env` file with secure credentials
2. Delete the existing superadmin account
3. Run the seed script again to create a new superadmin with secure credentials

## Troubleshooting

### SuperAdmin already exists
If you see this message when running the seed script:
```
ℹ️  Super admin already exists
   Email: skillspheresuperadmin@admin.com
   Role: superadmin
```

The superadmin account has already been created. You can login with the credentials above.

### Cannot login
1. Verify the superadmin exists in the database:
   ```sql
   SELECT * FROM users WHERE email = 'skillspheresuperadmin@admin.com';
   ```

2. Check if the account is active:
   ```sql
   SELECT isActive FROM users WHERE email = 'skillspheresuperadmin@admin.com';
   ```

3. Reset the password:
   ```bash
   npm run seed  # Will show message if already exists
   ```

### Change SuperAdmin Password

To change the password, update in database:
```sql
-- First, hash the new password using bcrypt with 10 rounds
-- Then update:
UPDATE users
SET password = '$2a$10$yourNewHashedPassword'
WHERE email = 'skillspheresuperadmin@admin.com';
```

Or delete and recreate:
```sql
DELETE FROM users WHERE email = 'skillspheresuperadmin@admin.com';
-- Then run: npm run seed
```
