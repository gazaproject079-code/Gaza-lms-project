# SkillSphere API Endpoints Documentation

Base URL: `http://localhost:5000`

---

## Health Check

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/health`|-|No|Check if server is running|

---

## Authentication Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5000/api/auth/login`|`{"email": "test@example.com", "password": "password123"}`|No|Login with email \& password|
|POST|`http://localhost:5000/api/auth/register`|`{"name": "John Doe", "email": "john@example.com", "password": "password123", "role": "student"}`|No|Register new user|
|GET|`http://localhost:5000/api/auth/profile`|-|Yes|Get current user profile|
|POST|`http://localhost:5000/api/auth/send-otp`|`{"email": "test@example.com", "name": "John Doe"}`|No|Send OTP for signup|
|POST|`http://localhost:5000/api/auth/verify-otp`|`{"email": "test@example.com", "otp": "123456"}`|No|Verify OTP|
|POST|`http://localhost:5000/api/auth/resend-otp`|`{"email": "test@example.com"}`|No|Resend OTP|
|POST|`http://localhost:5000/api/auth/complete-registration`|`{"email": "test@example.com", "password": "password123", "name": "John Doe"}`|No|Complete registration after OTP|
|POST|`http://localhost:5000/api/auth/send-login-otp`|`{"email": "test@example.com"}`|No|Send OTP for passwordless login|
|POST|`http://localhost:5000/api/auth/login-with-otp`|`{"email": "test@example.com", "otp": "123456"}`|No|Login using OTP|
|POST|`http://localhost:5000/api/auth/forgot-password`|`{"email": "test@example.com"}`|No|Request password reset OTP|
|POST|`http://localhost:5000/api/auth/reset-password`|`{"email": "test@example.com", "otp": "123456", "newPassword": "newpass123"}`|No|Reset password with OTP|
|POST|`http://localhost:5000/api/auth/verify-signup-otp`|`{"email": "test@example.com", "otp": "123456"}`|No|Verify signup OTP \& auto-login|
|POST|`http://localhost:5000/api/auth/google-auth`|`{"idToken": "google\_id\_token\_here"}`|No|Google OAuth authentication|

---

## Course Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/courses`|-|No|Get all courses|
|GET|`http://localhost:5000/api/courses/:id`|-|No|Get course by ID|
|POST|`http://localhost:5000/api/courses`|`{"name": "Python Basics", "description": "Learn Python", "categoryId": 1}`|Yes|Create new course|
|PUT|`http://localhost:5000/api/courses/:id`|`{"name": "Updated Name", "description": "Updated desc", "categoryId": 1}`|Yes|Update course|
|DELETE|`http://localhost:5000/api/courses/:id`|-|Yes|Delete course|
|PATCH|`http://localhost:5000/api/courses/:id/publish`|`{"isPublished": true}`|Yes|Publish/unpublish course|

---

## Category Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/categories`|-|No|Get all categories|
|GET|`http://localhost:5000/api/categories/:id`|-|No|Get category by ID|
|POST|`http://localhost:5000/api/categories`|`{"name": "Programming", "description": "Programming courses"}`|Yes (Admin)|Create category|
|PUT|`http://localhost:5000/api/categories/:id`|`{"name": "Updated Name", "description": "Updated desc"}`|Yes (Admin)|Update category|
|DELETE|`http://localhost:5000/api/categories/:id`|-|Yes (Admin)|Delete category|

---

## Topic Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5000/api/topics`|`{"name": "Introduction", "description": "Intro topic", "courseId": 1, "order": 1}`|Yes|Create topic|
|GET|`http://localhost:5000/api/topics/course/:courseId`|-|Yes|Get topics by course ID|
|PUT|`http://localhost:5000/api/topics/:id`|`{"name": "Updated Topic", "description": "Updated desc", "order": 2}`|Yes|Update topic|
|DELETE|`http://localhost:5000/api/topics/:id`|-|Yes|Delete topic|

---

## Material Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/materials`|-|Yes|Get all materials|
|POST|`http://localhost:5000/api/materials`|`{"name": "Video 1", "type": "video", "url": "https://...", "topicId": 1, "order": 1}`|Yes|Create material|
|PUT|`http://localhost:5000/api/materials/:id`|`{"name": "Updated Material", "type": "pdf", "url": "https://..."}`|Yes|Update material|
|DELETE|`http://localhost:5000/api/materials/:id`|-|Yes|Delete material|

---

## Enrollment Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/enrollments/my`|-|Yes|Get my enrollments|
|POST|`http://localhost:5000/api/enrollments`|`{"courseId": 1}`|Yes|Enroll in a course|
|DELETE|`http://localhost:5000/api/enrollments/:courseId`|-|Yes|Unenroll from course|
|GET|`http://localhost:5000/api/enrollments/check/:courseId`|-|Yes|Check enrollment status|

---

## Progress Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/progress/my`|-|Yes|Get my learning progress|
|POST|`http://localhost:5000/api/progress/topic`|`{"topicId": 1, "courseId": 1, "completed": true}`|Yes|Mark topic as completed|
|GET|`http://localhost:5000/api/progress/stats`|-|Yes|Get learning statistics|
|DELETE|`http://localhost:5000/api/progress/reset/:courseId`|-|Yes|Reset course progress|

---

## Quiz Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/quizzes/course/:courseId`|-|Yes|Get quizzes for a course|
|GET|`http://localhost:5000/api/quizzes/:id`|-|Yes|Get quiz by ID|
|POST|`http://localhost:5000/api/quizzes/submit`|`{"quizId": 1, "answers": {"q1": "answer1", "q2": "answer2"}, "timeTaken": 300}`|Yes|Submit quiz answers|
|GET|`http://localhost:5000/api/quizzes/results/my`|-|Yes|Get my quiz results|

---

## Certificate Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/certificates/my`|-|Yes|Get my certificates|
|POST|`http://localhost:5000/api/certificates`|`{"courseId": 1}`|Yes|Generate certificate|
|GET|`http://localhost:5000/api/certificates/verify/:certificateNumber`|-|No|Verify certificate (public)|

---

## Certificate Template Endpoints (Admin Only)

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/certificate-templates`|-|Yes (Admin)|Get all templates|
|GET|`http://localhost:5000/api/certificate-templates/stats`|-|Yes (Admin)|Get certificate statistics|
|GET|`http://localhost:5000/api/certificate-templates/active`|-|Yes (Admin)|Get active template|
|GET|`http://localhost:5000/api/certificate-templates/active-per-course`|-|Yes (Admin)|Get active templates per course|
|GET|`http://localhost:5000/api/certificate-templates/for-course/:courseId`|-|Yes (Admin)|Get template for specific course|
|GET|`http://localhost:5000/api/certificate-templates/preview`|-|Yes (Admin)|Preview certificate|
|GET|`http://localhost:5000/api/certificate-templates/preview/:id`|-|Yes (Admin)|Preview certificate with template|
|GET|`http://localhost:5000/api/certificate-templates/:id`|-|Yes (Admin)|Get template by ID|
|POST|`http://localhost:5000/api/certificate-templates`|`{"name": "Template 1", "design": {}, "isActive": true}`|Yes (Admin)|Create template|
|PUT|`http://localhost:5000/api/certificate-templates/:id`|`{"name": "Updated Template", "design": {}, "isActive": true}`|Yes (Admin)|Update template|
|PUT|`http://localhost:5000/api/certificate-templates/:id/activate`|-|Yes (Admin)|Activate template as default|
|PUT|`http://localhost:5000/api/certificate-templates/:id/activate-for-courses`|`{"courseIds": \[1, 2, 3]}`|Yes (Admin)|Activate template for courses|
|DELETE|`http://localhost:5000/api/certificate-templates/:id`|-|Yes (Admin)|Delete template|
|POST|`http://localhost:5000/api/certificate-templates/:id/upload/background`|form-data: `background` (File)|Yes (Admin)|Upload background image|
|POST|`http://localhost:5000/api/certificate-templates/:id/upload/signature`|form-data: `signature` (File)|Yes (Admin)|Upload admin signature|

---

## Notification Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/notifications/my`|-|Yes|Get my notifications|
|PUT|`http://localhost:5000/api/notifications/read/:id`|-|Yes|Mark notification as read|
|PUT|`http://localhost:5000/api/notifications/read-all`|-|Yes|Mark all as read|
|DELETE|`http://localhost:5000/api/notifications/:id`|-|Yes|Delete notification|
|DELETE|`http://localhost:5000/api/notifications/clear/all`|-|Yes|Clear all notifications|

---

## Feedback Endpoints

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/feedback`|-|Yes|Get all feedback|
|GET|`http://localhost:5000/api/feedback/:id`|-|Yes|Get feedback by ID|
|POST|`http://localhost:5000/api/feedback`|`{"courseId": 1, "rating": 5, "comment": "Great course!"}`|Yes|Create feedback|
|PUT|`http://localhost:5000/api/feedback/:id`|`{"rating": 4, "comment": "Updated review"}`|Yes|Update feedback|
|DELETE|`http://localhost:5000/api/feedback/:id`|-|Yes|Delete feedback|

---

## User Management Endpoints (Admin Only)

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5000/api/users/students`|-|Yes (Admin)|Get all students|
|GET|`http://localhost:5000/api/users/experts`|-|Yes (Admin)|Get all experts|
|GET|`http://localhost:5000/api/users/:id`|-|Yes (Admin)|Get user by ID|
|PATCH|`http://localhost:5000/api/users/:id/toggle-status`|-|Yes (Admin)|Toggle user active status|
|DELETE|`http://localhost:5000/api/users/:id`|-|Yes (Admin)|Delete user|

---

## Admin Management Endpoints (SuperAdmin Only)

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5000/api/admins`|`{"name": "Admin Name", "email": "admin@test.com", "password": "admin123", "permissions": {"canManageAllCourses": true}}`|Yes (SuperAdmin)|Create admin|
|GET|`http://localhost:5000/api/admins`|-|Yes (SuperAdmin)|Get all admins|
|GET|`http://localhost:5000/api/admins/:id`|-|Yes (SuperAdmin)|Get admin by ID|
|PUT|`http://localhost:5000/api/admins/:id`|`{"name": "Updated Admin", "email": "updated@test.com"}`|Yes (SuperAdmin)|Update admin|
|PATCH|`http://localhost:5000/api/admins/:id/toggle-status`|-|Yes (SuperAdmin)|Toggle admin status|
|PATCH|`http://localhost:5000/api/admins/:id/permissions`|`{"canManageAllCourses": true, "canManageCategories": true}`|Yes (SuperAdmin)|Update admin permissions|
|DELETE|`http://localhost:5000/api/admins/:id`|-|Yes (SuperAdmin)|Delete admin|

---

## File Upload Endpoints

|Method|Full URL|Body Type|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5000/api/upload/file`|form-data: `file` (File)|No|Upload single file (PDF/Image, max 10MB)|
|POST|`http://localhost:5000/api/upload/files`|form-data: `files` (Multiple Files)|No|Upload multiple files (max 10 files)|

---

## AI Chat Endpoints (Node.js Backend - Port 5000)

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5000/api/ai-chat/sessions`|`{"title": "New Chat", "courseId": 1}`|Yes|Create chat session|
|GET|`http://localhost:5000/api/ai-chat/sessions`|-|Yes|Get all sessions|
|GET|`http://localhost:5000/api/ai-chat/sessions/:id`|-|Yes|Get session by ID|
|PUT|`http://localhost:5000/api/ai-chat/sessions/:id`|`{"title": "Updated Title"}`|Yes|Update session|
|DELETE|`http://localhost:5000/api/ai-chat/sessions/:id`|-|Yes|Delete session|
|POST|`http://localhost:5000/api/ai-chat/sessions/:id/messages`|`{"content": "What is Python?"}`|Yes|Send message in session|

---

## AI Backend Endpoints (Python Flask - Port 5001)

Base URL: `http://localhost:5001`

### Health Check

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|GET|`http://localhost:5001/health`|-|No|Check if AI server is running|

### Simple Chat

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5001/api/chat`|`{"message": "What is Python?", "context": "Programming course"}`|No|Simple chat - single message/response|

### Chat Sessions (with memory)

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5001/api/chat/session`|`{"session_id": "user123_session1", "system_prompt": "You are a helpful tutor"}`|No|Create a new chat session|
|POST|`http://localhost:5001/api/chat/session/:session_id/message`|`{"message": "Explain variables"}`|No|Send message in existing session|
|GET|`http://localhost:5001/api/chat/session/:session_id/history`|-|No|Get chat history for session|
|DELETE|`http://localhost:5001/api/chat/session/:session_id`|-|No|Delete a chat session|

### Learning Tools

|Method|Full URL|Body (raw JSON)|Auth|Description|
|-|-|-|-|-|
|POST|`http://localhost:5001/api/explain`|`{"topic": "Machine Learning", "level": "beginner"}`|No|Explain a topic at specified level|
|POST|`http://localhost:5001/api/quiz/generate`|`{"topic": "Python Basics", "num_questions": 5, "difficulty": "medium"}`|No|Generate quiz questions for a topic|
|POST|`http://localhost:5001/api/summarize`|`{"content": "Long text to summarize...", "max_points": 5}`|No|Summarize learning content|

---

## User Roles

|Role|Access Level|
|-|-|
|student|Can enroll, take quizzes, earn certificates|
|expert|Can create and manage courses|
|admin|Can manage users, courses, and content|
|superadmin|Full system access|

---

## Test Credentials

**SuperAdmin:**

* Email: `skillspherefyp@gmail.com`
* Password: `skillsphere@123`

---

# How to Use Postman

## Method 1: Bearer Token (Recommended)

This is the easiest way to add authorization in Postman.

### Step 1: Get Your Token

1. Create a new request
2. Set method to **POST**
3. Enter URL: `http://localhost:5000/api/auth/login`
4. Go to **Body** tab
5. Select **raw** and choose **JSON**
6. Enter:

```json
{
  "email": "skillspherefyp@gmail.com",
  "password": "skillsphere@123"
}
```

7. Click **Send**
8. Copy the `token` value from the response

### Step 2: Add Token to Request

1. Open the request that requires authentication
2. Go to **Authorization** tab
3. Select **Type**: `Bearer Token`
4. Paste your token in the **Token** field
5. Click **Send**

!\[Bearer Token Method](https://i.imgur.com/bearer-token.png)

```
Authorization Tab:
┌─────────────────────────────────────────────────────┐
│ Type: \[Bearer Token ▼]                              │
│                                                     │
│ Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     │
└─────────────────────────────────────────────────────┘
```

---

## Method 2: Manual Header

Add the Authorization header manually.

### Steps:

1. Go to **Headers** tab
2. Add a new row:

   * **Key**: `Authorization`
   * **Value**: `Bearer YOUR\_TOKEN\_HERE`

3. Click **Send**

```
Headers Tab:
┌──────────────────┬─────────────────────────────────────┐
│ Key              │ Value                               │
├──────────────────┼─────────────────────────────────────┤
│ Content-Type     │ application/json                    │
│ Authorization    │ Bearer eyJhbGciOiJIUzI1NiIs...      │
└──────────────────┴─────────────────────────────────────┘
```

---

## Method 3: Using Environment Variables (Best Practice)

Save your token as a variable to reuse across all requests.

### Step 1: Create Environment

1. Click the **gear icon** (top right) or go to **Environments**
2. Click **Add** to create new environment
3. Name it: `SkillSphere Local`
4. Add variables:

|Variable|Initial Value|Current Value|
|-|-|-|
|base\_url|http://localhost:5000|http://localhost:5000|
|token||(leave empty)|

5. Click **Save**
6. Select `SkillSphere Local` from the environment dropdown (top right)

### Step 2: Auto-Save Token After Login

1. Open your login request
2. Go to **Scripts** tab (or **Tests** tab in older versions)
3. Add this script:

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("Token saved successfully!");
}
```

4. Click **Save**
5. Click **Send** to login

Now your token is automatically saved!

### Step 3: Use Variables in Requests

In your requests, use:

* **URL**: `{{base\_url}}/api/courses`
* **Authorization**: Bearer Token → `{{token}}`

```
URL Field:
┌─────────────────────────────────────────────────────┐
│ GET  │ {{base\_url}}/api/auth/profile               │
└─────────────────────────────────────────────────────┘

Authorization Tab:
┌─────────────────────────────────────────────────────┐
│ Type: \[Bearer Token ▼]                              │
│                                                     │
│ Token: {{token}}                                    │
└─────────────────────────────────────────────────────┘
```

---

## How to Add Request Body

### For JSON Body (POST, PUT, PATCH):

1. Go to **Body** tab
2. Select **raw**
3. Choose **JSON** from the dropdown
4. Enter your JSON data:

```json
{
  "name": "Course Name",
  "description": "Course description",
  "categoryId": 1
}
```

```
Body Tab:
┌─────────────────────────────────────────────────────┐
│ ○ none  ○ form-data  ○ x-www-form-urlencoded       │
│ ● raw   ○ binary     ○ GraphQL                      │
│                                          \[JSON ▼]   │
├─────────────────────────────────────────────────────┤
│ {                                                   │
│   "name": "Python Basics",                          │
│   "description": "Learn Python programming",        │
│   "categoryId": 1                                   │
│ }                                                   │
└─────────────────────────────────────────────────────┘
```

---

## How to Upload Files

### For Single File Upload:

1. Go to **Body** tab
2. Select **form-data**
3. Enter key: `file`
4. Change type from **Text** to **File** (hover over the key field to see the dropdown)
5. Click **Select Files** and choose your file
6. Click **Send**

```
Body Tab (form-data):
┌──────────────┬──────────┬─────────────────────────────┐
│ Key          │ Type     │ Value                       │
├──────────────┼──────────┼─────────────────────────────┤
│ file         │ \[File ▼] │ \[Select Files] document.pdf │
└──────────────┴──────────┴─────────────────────────────┘
```

### For Multiple Files Upload:

1. Go to **Body** tab
2. Select **form-data**
3. Enter key: `files`
4. Change type to **File**
5. Select multiple files
6. Click **Send**

---

## Quick Reference: HTTP Methods

|Method|Purpose|Has Body?|
|-|-|-|
|GET|Retrieve data|No|
|POST|Create new resource|Yes|
|PUT|Update entire resource|Yes|
|PATCH|Partial update|Yes|
|DELETE|Remove resource|No|

---

## Common Response Status Codes

|Code|Meaning|
|-|-|
|200|Success|
|201|Created successfully|
|400|Bad request (invalid data)|
|401|Unauthorized (missing/invalid token)|
|403|Forbidden (no permission)|
|404|Not found|
|500|Server error|

---

## Troubleshooting

### Error: "Access token required"

* You need to add the Authorization header
* Use Bearer Token method described above

### Error: "Route not found"

* Check if the URL is correct
* Make sure the HTTP method (GET/POST/PUT/DELETE) matches the endpoint

### Error: "Invalid token"

* Your token may have expired (tokens expire in 7 days)
* Login again to get a new token

### Error: "Could not send request"

* Make sure your backend server is running
* Check the URL includes `http://localhost:5000`

---

# How to Run AI Backend (Python Flask)

## Prerequisites

1. Install Python 3.8 or higher
2. Install pip (Python package manager)

## Setup Steps

### Step 1: Open Terminal in AI Backend Folder

```bash
cd "D:\skillsphere\AppAndroidSS\SkillSphere\SkillSphere final design project 1\ai-backend"
```

### Step 2: Create Virtual Environment (Recommended)

```bash
python -m venv venv
```

### Step 3: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 5: Run the Server

```bash
python app.py
```

Server will start at: `http://localhost:5001`

## Quick Start (Copy & Paste)

**Windows (PowerShell):**
```powershell
cd "D:\skillsphere\AppAndroidSS\SkillSphere\SkillSphere final design project 1\ai-backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Test AI Backend in Postman

### 1. Health Check
```
GET http://localhost:5001/health
```

### 2. Simple Chat
```
POST http://localhost:5001/api/chat
Body (raw JSON):
{
  "message": "What is Python programming?",
  "context": "Programming basics"
}
```

### 3. Create Chat Session
```
POST http://localhost:5001/api/chat/session
Body (raw JSON):
{
  "session_id": "my_session_1",
  "system_prompt": "You are a helpful programming tutor"
}
```

### 4. Send Message in Session
```
POST http://localhost:5001/api/chat/session/my_session_1/message
Body (raw JSON):
{
  "message": "Explain what a variable is"
}
```

### 5. Explain Topic
```
POST http://localhost:5001/api/explain
Body (raw JSON):
{
  "topic": "Machine Learning",
  "level": "beginner"
}
```

### 6. Generate Quiz
```
POST http://localhost:5001/api/quiz/generate
Body (raw JSON):
{
  "topic": "Python Basics",
  "num_questions": 5,
  "difficulty": "easy"
}
```

### 7. Summarize Content
```
POST http://localhost:5001/api/summarize
Body (raw JSON):
{
  "content": "Python is a high-level programming language known for its simplicity and readability. It was created by Guido van Rossum and first released in 1991. Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
  "max_points": 3
}
```

## Running Both Servers

You need to run both servers for full functionality:

| Server | Port | Command |
|--------|------|---------|
| Node.js Backend | 5000 | `cd backend && npm start` |
| Python AI Backend | 5001 | `cd ai-backend && python app.py` |

Open two terminal windows and run each server in a separate terminal
