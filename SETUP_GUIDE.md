# SkillSphere Project Setup Guide

This document contains all the dependencies and commands needed to set up and run the SkillSphere project.

---

## backend (Node.js Express Server)

### Dependencies Installation

```bash
cd backend
npm install
```

#### All Dependencies:

```bash
npm install @react-pdf/renderer bcryptjs cloudinary cors dotenv express express-validator firebase-admin jsonwebtoken multer multer-storage-cloudinary mysql2 nodemailer react sequelize sharp
```

#### Dev Dependencies:

```bash
npm install --save-dev nodemon
```

### Environment Setup

Create a `.env` file in the `backend` folder with:

```env
MYSQL_DB=SkillSphere_Db
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_HOST=localhost
MYSQL_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Commands to Run

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Seed super admin
npm run seed

# Reset database
npm run reset:db
```

### Server URL
```
http://localhost:5000
```

---

## ai-backend (Python Flask Server)

### Dependencies Installation

```bash
cd ai-backend
pip install -r requirements.txt
```

#### Or install individually:

```bash
pip install flask==3.0.0
pip install flask-cors==4.0.0
pip install groq>=0.11.0
pip install httpx>=0.27.0,<0.28.0
pip install python-dotenv==1.0.0
```

#### For Python 3.11 specifically:

```bash
py -3.11 -m pip install flask==3.0.0 flask-cors==4.0.0 groq httpx==0.27.2 python-dotenv==1.0.0
```

### Environment Setup

Create a `.env` file in the `ai-backend` folder with:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Commands to Run

```bash
# Using Python
python app.py

# Using specific Python version
py -3.11 app.py

# Or with flask command
flask run --port 5001
```

### Server URL
```
http://localhost:5001
```

### Available API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check |
| /api/chat | POST | Simple chat |
| /api/chat/session | POST | Create chat session |
| /api/chat/session/<id>/message | POST | Send message |
| /api/chat/session/<id>/history | GET | Get history |
| /api/chat/session/<id> | DELETE | Delete session |
| /api/explain | POST | Explain a topic |
| /api/quiz/generate | POST | Generate quiz |
| /api/summarize | POST | Summarize content |

---

## AppAndroidSS (React Native / Web App)

### Dependencies Installation

```bash
cd AppAndroidSS
npm install
```

#### All Dependencies:

```bash
npm install @react-native-async-storage/async-storage @react-native-masked-view/masked-view @react-navigation/bottom-tabs @react-navigation/native @react-navigation/stack react react-dom react-native react-native-gesture-handler react-native-linear-gradient react-native-paper react-native-reanimated react-native-safe-area-context react-native-screens react-native-svg react-native-toast-message react-native-vector-icons react-native-web
```

#### Dev Dependencies:

```bash
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/runtime @react-native-community/cli @react-native/eslint-config @react-native/metro-config @tsconfig/react-native @types/react @types/react-test-renderer ajv ajv-keywords babel-jest babel-loader copy-webpack-plugin eslint file-loader html-webpack-plugin jest metro-react-native-babel-preset prettier process react-native-worklets react-scripts react-test-renderer typescript url-loader webpack webpack-cli webpack-dev-server
```

### Commands to Run

```bash
# Run Web Version (Development)
npm run web

# Run Web Version (Alternative)
npm run web:dev

# Build for Web (Production)
npm run build:web

# Run Android
npm run android

# Run iOS
npm run ios

# Start Metro Bundler
npm start

# Run Tests
npm test

# Lint Code
npm run lint
```

### Web App URL
```
http://localhost:8080
```

---

## Quick Start (Run All Servers)

Open 3 terminals and run:

### Terminal 1 - Backend Server
```bash
cd "SkillSphere final design project 1/backend"
npm run dev
```

### Terminal 2 - AI Backend Server
```bash
cd "SkillSphere final design project 1/ai-backend"
py -3.11 app.py
```

### Terminal 3 - Frontend App
```bash
cd "SkillSphere final design project 1/AppAndroidSS"
npm run web
```

---

## Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Backend (Node.js) | 5000 | http://localhost:5000 |
| AI Backend (Python) | 5001 | http://localhost:5001 |
| Frontend (Web) | 8080 | http://localhost:8080 |

---

## Troubleshooting

### Groq API Error (proxies issue)
If you get `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'`:

```bash
py -3.11 -m pip uninstall groq httpx -y
py -3.11 -m pip install groq httpx==0.27.2
```

### Node modules issues
```bash
rm -rf node_modules
npm install
```

### Python virtual environment (recommended)
```bash
cd ai-backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```
