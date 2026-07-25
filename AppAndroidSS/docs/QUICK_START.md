# Quick Start Guide

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the App**
   ```bash
   npm start
   ```

3. **Run on Device/Emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Test Accounts

### Admin
- Email: `admin@skillsphere.com`
- Password: `admin123`

### Expert
- Email: `expert@skillsphere.com`
- Password: `expert123`

### Student
- Email: `student@skillsphere.com`
- Password: `student123`

## Key Features to Test

### As Admin:
1. Login with admin credentials
2. Create a new course
3. Add topics to the course
4. View student list
5. Manage categories

### As Expert:
1. Login with expert credentials
2. Browse available courses
3. View course details
4. Provide feedback on courses

### As Student:
1. Login with student credentials
2. Browse courses
3. Start learning a course
4. Take quizzes
5. Use AI chat assistant
6. View progress

## Navigation Flow

- **Auth Flow**: Login → Signup → Forgot Password → OTP Verification
- **Admin Flow**: Dashboard → Courses/Students/Settings
- **Expert Flow**: Dashboard → Courses → Course Details → Feedback
- **Student Flow**: Dashboard → Browse Courses → Course Details → Learning → Quiz → AI Chat

## Notes

- All data is stored in memory (React Context)
- No backend required - fully functional frontend
- AI features are simulated with dummy responses
- OTP verification is simulated
- Payment processing is simulated

## Troubleshooting

If you encounter any issues:

1. Clear cache: `npm start -- --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Expo CLI version: `npx expo --version`

