# SkillSphere API Documentation

## Overview
This document describes the complete API for the SkillSphere learning management system, including authentication and student features.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user (student, expert, admin, or superadmin)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",  // Optional: student, expert, admin, superadmin (default: student)
  "phone": "1234567890"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "phone": "1234567890"
  }
}
```

### POST /auth/login
Login with email and password (supports all user types)

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "phone": "1234567890"
  }
}
```

### GET /auth/profile
Get current user profile (requires authentication)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "phone": "1234567890",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Enrollment Endpoints

### GET /enrollments/my
Get all enrollments for the authenticated student

**Response:**
```json
{
  "success": true,
  "enrollments": [
    {
      "id": 1,
      "userId": 1,
      "courseId": 1,
      "status": "in-progress",
      "progressPercentage": 45.5,
      "enrolledAt": "2025-01-01T00:00:00.000Z",
      "course": {
        "id": 1,
        "name": "Introduction to Programming",
        "description": "Learn programming basics",
        "topics": [...]
      }
    }
  ]
}
```

### POST /enrollments
Enroll in a course

**Request Body:**
```json
{
  "courseId": 1
}
```

**Response:**
```json
{
  "success": true,
  "enrollment": {
    "id": 1,
    "userId": 1,
    "courseId": 1,
    "status": "enrolled",
    "progressPercentage": 0
  }
}
```

### DELETE /enrollments/:courseId
Unenroll from a course

**Response:**
```json
{
  "success": true,
  "message": "Unenrolled successfully"
}
```

### GET /enrollments/check/:courseId
Check if enrolled in a course

**Response:**
```json
{
  "success": true,
  "enrolled": true,
  "enrollment": {...}
}
```

---

## Progress Endpoints

### GET /progress/my
Get all progress for authenticated student

**Response:**
```json
{
  "success": true,
  "progress": [
    {
      "id": 1,
      "userId": 1,
      "courseId": 1,
      "topicId": 1,
      "completed": true,
      "completedAt": "2025-01-01T00:00:00.000Z",
      "timeSpent": 3600,
      "topic": {...},
      "course": {...}
    }
  ]
}
```

### POST /progress/topic
Update topic progress (mark as completed)

**Request Body:**
```json
{
  "courseId": 1,
  "topicId": 1,
  "completed": true,
  "timeSpent": 3600
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "id": 1,
    "userId": 1,
    "courseId": 1,
    "topicId": 1,
    "completed": true,
    "completedAt": "2025-01-01T00:00:00.000Z",
    "timeSpent": 3600
  }
}
```

### GET /progress/stats
Get learning statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "enrolled": 5,
    "completed": 2,
    "inProgress": 3,
    "topicsCompleted": 45
  }
}
```

### DELETE /progress/reset/:courseId
Reset course progress

**Response:**
```json
{
  "success": true,
  "message": "Course progress reset successfully"
}
```

---

## Quiz Endpoints

### GET /quizzes/course/:courseId
Get all quizzes for a course

**Response:**
```json
{
  "success": true,
  "quizzes": [
    {
      "id": 1,
      "courseId": 1,
      "title": "Introduction Quiz",
      "description": "Test your knowledge",
      "questions": [
        {
          "id": "q1",
          "question": "What is 2+2?",
          "options": ["3", "4", "5", "6"]
        }
      ],
      "passingScore": 70,
      "timeLimit": 30
    }
  ]
}
```

### GET /quizzes/:id
Get quiz by ID

**Response:**
```json
{
  "success": true,
  "quiz": {
    "id": 1,
    "title": "Introduction Quiz",
    "questions": [...]
  }
}
```

### POST /quizzes/submit
Submit quiz answers

**Request Body:**
```json
{
  "quizId": 1,
  "answers": {
    "q1": "4",
    "q2": "answer2"
  },
  "timeTaken": 1800
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "id": 1,
    "score": 85,
    "correctAnswers": 17,
    "totalQuestions": 20,
    "passed": true,
    "attemptNumber": 1
  }
}
```

### GET /quizzes/results/my
Get all quiz results for authenticated student

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "quizId": 1,
      "score": 85,
      "passed": true,
      "submittedAt": "2025-01-01T00:00:00.000Z",
      "quiz": {...},
      "course": {...}
    }
  ]
}
```

---

## Certificate Endpoints

### GET /certificates/my
Get all certificates for authenticated student

**Response:**
```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "userId": 1,
      "courseId": 1,
      "certificateNumber": "CERT-1-1-1735689600000-A1B2C3D4",
      "issuedDate": "2025-01-01T00:00:00.000Z",
      "grade": "Pass",
      "verificationUrl": "http://localhost:5000/api/certificates/verify/...",
      "course": {
        "id": 1,
        "name": "Introduction to Programming"
      }
    }
  ]
}
```

### POST /certificates
Generate certificate for completed course

**Request Body:**
```json
{
  "courseId": 1,
  "grade": "A+"
}
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "id": 1,
    "certificateNumber": "CERT-1-1-1735689600000-A1B2C3D4",
    "issuedDate": "2025-01-01T00:00:00.000Z",
    "verificationUrl": "http://localhost:5000/api/certificates/verify/..."
  }
}
```

### GET /certificates/verify/:certificateNumber
Verify certificate (public endpoint, no auth required)

**Response:**
```json
{
  "success": true,
  "valid": true,
  "certificate": {
    "certificateNumber": "CERT-1-1-1735689600000-A1B2C3D4",
    "studentName": "John Doe",
    "courseName": "Introduction to Programming",
    "issuedDate": "2025-01-01T00:00:00.000Z",
    "grade": "A+"
  }
}
```

---

## Notification Endpoints

### GET /notifications/my
Get all notifications for authenticated user

**Query Parameters:**
- `unreadOnly` (optional): "true" to get only unread notifications

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "userId": 1,
      "title": "New Course Available",
      "message": "Check out the new Python course!",
      "type": "course",
      "isRead": false,
      "relatedId": 5,
      "relatedType": "course",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### PUT /notifications/read/:id
Mark notification as read

**Response:**
```json
{
  "success": true,
  "notification": {...}
}
```

### PUT /notifications/read-all
Mark all notifications as read

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### DELETE /notifications/:id
Delete a notification

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### DELETE /notifications/clear/all
Clear all notifications

**Response:**
```json
{
  "success": true,
  "message": "All notifications cleared"
}
```

---

## User Roles

The system supports 4 user roles:

1. **student** (default) - Can enroll in courses, track progress, take quizzes, earn certificates
2. **expert** - Can create courses and manage their own content
3. **admin** - Can manage users, courses, and all content
4. **superadmin** - Full system access

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
