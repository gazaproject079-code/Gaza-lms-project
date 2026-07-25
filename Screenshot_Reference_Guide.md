# Screenshot Reference Guide for Chapter 4.4 Software Description

## Table 4.1: Figure to Screenshot Mapping

| Figure No. | Code/Module Description | Screenshot to Paste | Screenshot Details |
|------------|------------------------|---------------------|-------------------|
| Figure 4.1 | User Authentication Module (login function) | Login Screen | Login page showing email input field, password input field, "Login" button, "Forgot Password" link, and Google OAuth sign-in option |
| Figure 4.2 | JWT Authentication Middleware | Registration/Signup Screen | Registration form displaying name field, email field, password field, confirm password field, role selection (Student/Expert), and "Sign Up" button |
| Figure 4.3 | Course Management Module (createCourse function) | Create Course Form | Admin/Expert course creation screen with course name input, description textarea, level dropdown (Beginner/Intermediate/Advanced), language selector, category picker, duration field, and thumbnail upload |
| Figure 4.4 | Enrollment and Progress Tracking Module | Course Detail Page | Course detail screen showing course thumbnail, title, description, instructor name, "Enroll Now" button, and course syllabus/topics preview |
| Figure 4.5 | File Upload and Cloud Storage Module | Add Material Modal | Material upload dialog showing file picker button, file type dropdown (PDF/Image/Video/Link), title input, description field, and upload/submit button |
| Figure 4.6 | AI Chat Assistant Module | AI Chat Interface | Chat screen with conversation bubbles showing user messages (right-aligned) and AI responses (left-aligned), message input field at bottom, and send button |
| Figure 4.7 | Certificate Generation Module | Certificate Display Screen | Generated certificate showing student name, course name, completion date, certificate number, grade/distinction badge, verification QR code, and download button |
| Figure 4.8 | Database Model Associations | Entity Relationship Diagram | ER diagram created in MySQL Workbench or dbdiagram.io showing all 16 tables (User, Course, Category, Topic, Material, Enrollment, Progress, Quiz, QuizResult, Certificate, CertificateTemplate, TemplateCourse, Notification, Feedback, AIChatSession, AIChatMessage) with relationship lines |
| Figure 4.9 | Frontend URL Resolution Utility | Course Materials List | Learning screen displaying list of course materials with PDF icons, image thumbnails, video previews, and clickable links |

---

## Table 4.2: Additional Recommended Screenshots

| Figure No. | Module/Feature | Screenshot to Paste | Screenshot Details |
|------------|----------------|---------------------|-------------------|
| Figure 4.10 | Student Dashboard | Student Home Screen | Dashboard showing "My Courses" section with enrolled course cards, progress bars, learning statistics (courses enrolled, in progress, completed), and quick action buttons |
| Figure 4.11 | Quiz Management | Quiz Taking Screen | Quiz interface displaying question text, four multiple choice options (radio buttons), question counter (e.g., "Question 3 of 10"), timer display, and "Next" button |
| Figure 4.12 | Quiz Results | Quiz Result Screen | Result display showing score percentage (e.g., "85%"), pass/fail status badge, correct answers count, total questions, time taken, and "Retake Quiz" button |
| Figure 4.13 | Admin Management | Admin Dashboard | Admin panel with statistics cards (Total Users, Total Courses, Total Enrollments, Active Students), recent activity feed, and navigation to management sections |
| Figure 4.14 | User Management | Manage Users Screen | User management table with columns for Name, Email, Role, Status (Active/Inactive), registration date, and action buttons (Edit, Activate/Deactivate) |
| Figure 4.15 | Progress Tracking | Learning Progress Screen | Topic list view showing course topics with completion checkmarks, locked/unlocked status icons, progress percentage bar, and "Mark Complete" button |
| Figure 4.16 | Category Management | Category Management Screen | Category list with category names, course count per category, "Add Category" button, and Edit/Delete action buttons |
| Figure 4.17 | Notifications | Notifications Screen | Notification list showing notification icons (info/success/warning), titles, messages, timestamps, read/unread indicators, and "Mark All Read" button |
| Figure 4.18 | OTP Verification | OTP Verification Screen | OTP input screen with 6 individual digit input boxes, "Verify" button, "Resend OTP" link, and countdown timer |
| Figure 4.19 | System Architecture | Architecture Diagram | System architecture diagram showing Client Layer (Web/Mobile), API Gateway (Express.js), Service Layer, Data Layer (MySQL), and External Services (Cloudinary, Firebase, Gmail) |

---

## Table 4.3: Screenshot Capture Specifications

| Figure No. | Resolution | Format | File Naming Convention |
|------------|------------|--------|----------------------|
| Figure 4.1 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_1_login_screen.png |
| Figure 4.2 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_2_signup_screen.png |
| Figure 4.3 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_3_create_course.png |
| Figure 4.4 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_4_course_detail.png |
| Figure 4.5 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_5_upload_material.png |
| Figure 4.6 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_6_ai_chat.png |
| Figure 4.7 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_7_certificate.png |
| Figure 4.8 | 1920x1080 or higher | PNG | fig_4_8_er_diagram.png |
| Figure 4.9 | 1920x1080 or 1280x720 | PNG/JPG | fig_4_9_materials_list.png |

---

## Table 4.4: Screenshot Content Checklist

| Figure No. | Required Elements | Do NOT Include |
|------------|-------------------|----------------|
| Figure 4.1 | Email field, Password field, Login button, Google OAuth button | Real user credentials, error messages |
| Figure 4.2 | Name, Email, Password, Confirm Password, Role selector | Real personal information |
| Figure 4.3 | All form fields filled with sample data, Category dropdown expanded | Empty form fields |
| Figure 4.4 | Course image, Course title, Enroll button visible | Enrolled state (show pre-enrollment) |
| Figure 4.5 | File picker, File type options, Upload button | Actual sensitive file names |
| Figure 4.6 | 2-3 message exchanges, User and AI messages differentiated | Personal/sensitive conversations |
| Figure 4.7 | Student name, Course name, Certificate number, Date, QR code | Real student personal details |
| Figure 4.8 | All 16 tables, Primary keys, Foreign keys, Relationship lines | Incomplete diagram |
| Figure 4.9 | PDF icon, Image thumbnail, Video icon, Material titles | Broken image placeholders |

---

## Instructions for Creating ER Diagram (Figure 4.8)

Use one of the following tools to create the Entity Relationship Diagram:

### Option 1: dbdiagram.io (Recommended - Free Online Tool)

```dbml
Table User {
  id int [pk]
  name varchar
  email varchar
  password varchar
  phone varchar
  role enum
  isActive boolean
  profilePicture varchar
}

Table Course {
  id int [pk]
  name varchar
  description text
  level enum
  language enum
  duration varchar
  status enum
  categoryId int [ref: > Category.id]
  userId int [ref: > User.id]
  thumbnailImage varchar
}

Table Category {
  id int [pk]
  name varchar
}

Table Topic {
  id int [pk]
  title varchar
  status enum
  completed boolean
  courseId int [ref: > Course.id]
  order int
}

Table Material {
  id int [pk]
  type enum
  title varchar
  uri varchar
  description text
  courseId int [ref: > Course.id]
  topicId int [ref: > Topic.id]
}

Table Enrollment {
  id int [pk]
  userId int [ref: > User.id]
  courseId int [ref: > Course.id]
  status enum
  progressPercentage int
  enrolledAt datetime
  completedAt datetime
}

Table Progress {
  id int [pk]
  userId int [ref: > User.id]
  courseId int [ref: > Course.id]
  topicId int [ref: > Topic.id]
  completed boolean
  timeSpent int
  completedAt datetime
}

Table Quiz {
  id int [pk]
  courseId int [ref: > Course.id]
  topicId int [ref: > Topic.id]
  title varchar
  questions json
  passingScore int
  timeLimit int
  isActive boolean
}

Table QuizResult {
  id int [pk]
  userId int [ref: > User.id]
  quizId int [ref: > Quiz.id]
  courseId int [ref: > Course.id]
  score int
  passed boolean
  timeTaken int
  attemptNumber int
}

Table Certificate {
  id int [pk]
  userId int [ref: > User.id]
  courseId int [ref: > Course.id]
  certificateNumber varchar
  issuedDate datetime
  grade varchar
}

Table Notification {
  id int [pk]
  userId int [ref: > User.id]
  title varchar
  message text
  type enum
  isRead boolean
}

Table AIChatSession {
  id int [pk]
  userId int [ref: > User.id]
  title varchar
  lastMessageAt datetime
}

Table AIChatMessage {
  id int [pk]
  sessionId int [ref: > AIChatSession.id]
  content text
  sender enum
  timestamp datetime
}
```

### Option 2: MySQL Workbench
1. Open MySQL Workbench
2. Go to File > New Model
3. Add tables using the EER Diagram tool
4. Define relationships using the connector tool
5. Export as PNG: File > Export > Export as PNG

### Option 3: Draw.io (diagrams.net)
1. Go to https://app.diagrams.net
2. Select "Create New Diagram"
3. Choose "Entity Relationship" template
4. Add entities and relationships
5. Export as PNG

---

## Instructions for Creating System Architecture Diagram (Figure 4.19)

Create a layered architecture diagram with the following components:

```
+------------------------------------------------------------------+
|                         CLIENT LAYER                              |
|  +----------------+  +----------------+  +----------------+       |
|  |    Web App     |  |  Android App   |  |    iOS App     |       |
|  | (React Native  |  |    (Expo)      |  |    (Expo)      |       |
|  |     Web)       |  |                |  |                |       |
|  +-------+--------+  +-------+--------+  +-------+--------+       |
|          |                   |                   |                |
|          +-------------------+-------------------+                |
|                              |                                    |
+------------------------------+------------------------------------+
                               | HTTPS/REST API
+------------------------------+------------------------------------+
|                         API LAYER                                 |
|  +------------------------------------------------------------+  |
|  |              Express.js Server (Node.js 18+)                |  |
|  |  +----------+ +----------+ +----------+ +----------+        |  |
|  |  |   Auth   | |  Course  | |   Quiz   | |   Cert   |        |  |
|  |  |  Routes  | |  Routes  | |  Routes  | |  Routes  |        |  |
|  |  +----+-----+ +----+-----+ +----+-----+ +----+-----+        |  |
|  |       |            |            |            |              |  |
|  |  +----+-----+ +----+-----+ +----+-----+ +----+-----+        |  |
|  |  |   Auth   | |  Course  | |   Quiz   | |   Cert   |        |  |
|  |  |Controller| |Controller| |Controller| |Controller|        |  |
|  |  +----------+ +----------+ +----------+ +----------+        |  |
|  +------------------------------------------------------------+  |
+------------------------------+------------------------------------+
                               |
+------------------------------+------------------------------------+
|                       SERVICE LAYER                               |
|  +----------------+  +----------------+  +----------------+       |
|  |     Email      |  |  Certificate   |  |    Gemini      |       |
|  |    Service     |  |    Service     |  |   AI Service   |       |
|  |  (Nodemailer)  |  | (React-PDF)    |  | (Google API)   |       |
|  +----------------+  +----------------+  +----------------+       |
+------------------------------+------------------------------------+
                               |
+------------------------------+------------------------------------+
|                        DATA LAYER                                 |
|  +------------------------------------------------------------+  |
|  |                    Sequelize ORM                            |  |
|  |  +------+ +------+ +------+ +------+ +------+ +------+      |  |
|  |  | User | |Course| | Quiz | | Cert | |Enroll| |Progrs|      |  |
|  |  +------+ +------+ +------+ +------+ +------+ +------+      |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|  +------------------------------------------------------------+  |
|  |                    MySQL Database                           |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                               |
+------------------------------+------------------------------------+
|                    EXTERNAL SERVICES                              |
|  +----------------+  +----------------+  +----------------+       |
|  |   Cloudinary   |  |    Firebase    |  |     Gmail      |       |
|  | (File Storage) |  |    (OAuth)     |  |    (SMTP)      |       |
|  +----------------+  +----------------+  +----------------+       |
+------------------------------------------------------------------+
```

Use Draw.io or Lucidchart to create a professional version of this diagram.
