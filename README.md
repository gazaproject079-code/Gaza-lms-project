# SkillSphere - Learning Management System

A comprehensive Learning Management System (LMS) built with React Native Web and Express.js, featuring course management, progress tracking, quizzes, certificates, and AI-powered chat assistance.

---

## 🚀 Features

### For Students
- 📚 Browse and enroll in courses
- 📖 Access learning materials (videos, PDFs, articles)
- ✅ Take quizzes and track progress
- 🏆 Earn certificates upon course completion
- 💬 AI-powered chat assistance for learning
- 🔔 Real-time notifications
- 📊 Personal learning dashboard

### For Admins
- 👥 User management (students and admins)
- 📝 Course and content management
- 🎨 Certificate template designer
- 📈 Analytics and reporting
- ✉️ Email notifications (OTP, welcome emails)
- 🔐 Role-based access control

### Technical Features
- 🌐 Cross-platform (Web, Android, iOS via React Native)
- 🔒 JWT-based authentication
- 📧 Email OTP verification
- 🔑 Google OAuth integration
- 📱 Responsive design
- 🎨 Dark/Light theme support
- 💾 MySQL database with Sequelize ORM
- 🚀 Production-ready deployment configs

---

## 📁 Project Structure

```
skillsphere_app/
│
├── AppAndroidSS/              # Frontend (React Native Web)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── screens/          # Screen components
│   │   ├── navigation/       # React Navigation setup
│   │   ├── services/         # API client and services
│   │   ├── context/          # React Context (Auth, Data, Theme)
│   │   └── assets/           # Images, fonts, etc.
│   ├── web/                  # Web-specific files
│   ├── webpack.config.js     # Webpack configuration
│   ├── vercel.json          # Vercel deployment config
│   └── package.json
│
├── backend/                  # Backend (Express.js)
│   ├── config/              # Database configuration
│   ├── models/              # Sequelize models (17 models)
│   ├── controllers/         # Route controllers
│   ├── routes/              # API routes
│   ├── middleware/          # Authentication middleware
│   ├── services/            # Email, certificate services
│   ├── uploads/             # File upload storage
│   ├── railway.json         # Railway deployment config
│   ├── Procfile            # Process file for deployment
│   └── package.json
│
├── DEPLOYMENT_GUIDE.md      # Complete deployment guide
├── DEPLOYMENT_CHECKLIST.md  # Step-by-step checklist
└── README.md               # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0
- **React Native** 0.72.6
- **React Native Web** 0.19.13
- **React Navigation** 6.x
- **Webpack** 5.88.2
- **Context API** for state management

### Backend
- **Node.js** 18+
- **Express.js** 4.18.2
- **Sequelize** 6.35.2 (ORM)
- **MySQL** 8.0+
- **JWT** for authentication
- **Nodemailer** for emails
- **Firebase Admin** for Google OAuth
- **Multer** for file uploads

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- MySQL 8.0 or higher
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/skillsphere-app.git
   cd skillsphere_app
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

   Backend will run on `http://localhost:5000`

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd AppAndroidSS
   npm install
   npm run web:dev
   ```

   Frontend will run on `http://localhost:3000`

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/health

5. **Login with Super Admin**
   - Email: (set in .env SUPER_ADMIN_EMAIL)
   - Password: (set in .env SUPER_ADMIN_PASSWORD)

---

## 🌐 Deployment

This project is configured for easy deployment on:
- **Frontend**: Vercel (Free tier)
- **Backend**: Railway (Free tier with $5 credit)

### Quick Deployment Steps

1. **Read the complete guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Follow the checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### Summary
1. Push code to GitHub
2. Deploy backend on Railway with MySQL database
3. Deploy frontend on Vercel
4. Configure environment variables
5. Test the deployment

**Estimated time**: 30-45 minutes

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/send-otp` - Send OTP for signup
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/google-auth` - Google OAuth login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Course Endpoints
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)

### Enrollment Endpoints
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/my` - Get my enrollments
- `DELETE /api/enrollments/:id` - Unenroll from course

### More Endpoints
See [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for complete API reference.

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=SkillSphere_Db

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret

# Admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=admin123

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

For production deployment, see [.env.example](./.env.example) files.

---

## 🎯 Key Features Walkthrough

### 1. Course Management
- Create courses with multiple topics
- Add learning materials (videos, PDFs, links)
- Organize content hierarchically
- Publish/unpublish courses

### 2. Progress Tracking
- Automatic progress calculation
- Topic completion tracking
- Course completion percentage
- Learning statistics

### 3. Quiz System
- Create quizzes with multiple choice questions
- Automatic grading
- Pass/fail threshold
- Quiz results history

### 4. Certificate Generation
- Customizable certificate templates
- Automatic generation on course completion
- PDF download
- Certificate verification system

### 5. AI Chat Assistant
- Context-aware chat sessions
- Learning assistance
- Course-specific help
- Chat history

---

## 🧪 Testing

### Test Super Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed super admin
- `npm run migrate:permissions` - Add permissions column
- `npm run reset:db` - Reset database

### Frontend
- `npm start` - Start React Native metro bundler
- `npm run web` - Start web server (production mode)
- `npm run web:dev` - Start web dev server (development mode)
- `npm run build:web` - Build for web production
- `npm run vercel-build` - Build for Vercel deployment
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS

---

## 🐛 Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify database credentials in .env
- Check port 5000 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check REACT_APP_API_URL in .env
- For Android emulator, use http://10.0.2.2:5000

### Email not sending
- Verify SMTP credentials
- For Gmail, use App Password not regular password
- Check spam folder

### Database errors
- Run `npm run reset:db` to reset database
- Ensure MySQL version is 8.0 or higher
- Check database user has proper permissions

---

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [API Documentation](./backend/API_DOCUMENTATION.md) - Full API reference
- [Setup Requirements](./SETUP_REQUIREMENTS.txt) - System requirements
- [Migration Guide](./backend/MIGRATION_GUIDE.md) - Database migrations

---

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Email verification via OTP
- Role-based access control (RBAC)
- CORS configuration
- SQL injection prevention (Sequelize ORM)
- XSS protection

---

## 📊 Database Schema

The application uses 17 database models:

1. **User** - User accounts (students, admins, superadmin)
2. **Category** - Course categories
3. **Course** - Course information
4. **Topic** - Course topics
5. **Material** - Learning materials
6. **Enrollment** - Student enrollments
7. **Progress** - Learning progress
8. **Quiz** - Quiz information
9. **QuizResult** - Quiz results
10. **Certificate** - Generated certificates
11. **CertificateTemplate** - Certificate templates
12. **TemplateCourse** - Template-course associations
13. **Feedback** - Course feedback
14. **Notification** - User notifications
15. **AIChatSession** - AI chat sessions
16. **AIChatMessage** - Chat messages

For detailed schema, see [backend/models/](./backend/models/)

---

## 🎨 Customization

### Change Theme Colors
Edit `AppAndroidSS/src/context/ThemeContext.js`

### Modify Certificate Templates
Use the admin dashboard to create custom certificate templates

### Update Email Templates
Edit `backend/services/emailService.js`

### Add New API Endpoints
1. Create controller in `backend/controllers/`
2. Create routes in `backend/routes/`
3. Add routes to `backend/server.js`

---

## 📱 Mobile App Build

### Android
```bash
cd AppAndroidSS
npm run android
```

### iOS
```bash
cd AppAndroidSS
npm run ios
```

### Build APK
```bash
cd AppAndroidSS/android
./gradlew assembleRelease
```

---

## 🌟 Future Enhancements

- [ ] Video streaming support
- [ ] Live classes integration
- [ ] Payment gateway integration
- [ ] Mobile app store deployment
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Discussion forums
- [ ] Peer-to-peer learning features

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Authors

- Your Name - Initial work

---

## 🙏 Acknowledgments

- React Native community
- Express.js team
- Sequelize ORM
- All open source contributors

---

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@skillsphere.com
- Documentation: See /docs folder

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using React Native and Express.js**
