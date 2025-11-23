# Teacher App - Technical Specification & Features

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Feature Details](#feature-details)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [User Workflows](#user-workflows)
7. [Error Handling](#error-handling)

---

## 🎯 Overview

### Application: Teacher Management Mobile App
**Type:** Native Flutter Mobile Application  
**Platform:** iOS & Android  
**Target Users:** School Teachers  
**Primary Language:** Dart  
**Build Optimization:** 82% reduction in compilation issues (208 → 37)

### Cleaned Architecture:
- **Removed:** 20+ unused screen files
- **Deleted Folders:** `/screens/student/`, `/screens/parent/`
- **Remaining Screens:** 8 essential teacher-only screens
- **Build Performance:** Significantly improved

---

## 🏗️ System Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Flutter UI Widgets & Screens)       │
├─────────────────────────────────────────┤
│         State Management Layer           │
│      (Provider, Auth Provider)          │
├─────────────────────────────────────────┤
│         Business Logic Layer             │
│    (Services: Auth, API, etc.)          │
├─────────────────────────────────────────┤
│         Data Layer                       │
│  (HTTP Client, SharedPreferences)       │
├─────────────────────────────────────────┤
│         Backend API (Server)            │
│   (Node.js/Express API Endpoints)       │
└─────────────────────────────────────────┘
```

### Component Diagram

```
main.dart
    ↓
AuthWrapper (Consumer<AuthProvider>)
    ├─→ LoginScreen (auth/login_screen.dart)
    │      └─→ AuthService → API
    │
    └─→ TeacherMain (teacher/teacher_main.dart)
           ├─→ TeacherDashboard
           ├─→ TeacherStudents
           ├─→ TeacherParents
           ├─→ TeacherLessons
           │      └─→ AttendanceScreen
           │      └─→ MarksScreen
           └─→ TeacherTimetable
```

---

## 🎓 Feature Details

### Feature 1: Dashboard (teacher_dashboard.dart)

**UI Components:**
```
┌──────────────────────────────────┐
│   Welcome Header (Gradient)      │
│   "Welcome, [Teacher Name]"      │
├──────────────────────────────────┤
│    Statistics Row 1               │
│  [Classes] [Students] [Subjects] │
├──────────────────────────────────┤
│    Statistics Row 2               │
│  [Supervised] [Lessons]          │
├──────────────────────────────────┤
│    Quick Actions (Horizontal)    │
│  Attendance | Timetable | Marks  │
├──────────────────────────────────┤
│    Today's Lessons Section       │
│  [Lesson Cards]                  │
├──────────────────────────────────┤
│    My Classes Section            │
│  [Class Cards]                   │
├──────────────────────────────────┤
│    Announcements Section         │
│  [Announcement Items]            │
└──────────────────────────────────┘
```

**Data Model:**
```dart
class Dashboard {
  String teacherName;
  DashboardStats stats;
  List<Lesson> todayLessons;
  List<Class> myClasses;
  List<Announcement> announcements;
}

class DashboardStats {
  int classes;
  int students;
  int subjects;
  int supervised;
  int lessons;
}
```

**API Endpoints:**
```
GET /api/teacher/dashboard
Headers: { 'auth-token': token }
Response: { stats, lessons, classes, announcements }
```

---

### Feature 2: Attendance Marking (attendance_screen.dart)

**Process Flow:**
```
1. Select Lesson ↓
2. Load Students ↓
3. Mark Attendance ↓
4. Calculate Stats ↓
5. Save Records
```

**UI Layout:**
```
┌──────────────────────────────────┐
│  Lesson Dropdown Selector        │
├──────────────────────────────────┤
│  Attendance Summary              │
│  Present: 25 | Absent: 3         │
├──────────────────────────────────┤
│  Student List                    │
│  ┌────────────────────────────┐  │
│  │ [✓] Student Name          │  │
│  │ [✗] Student Name          │  │
│  │ [○] Student Name (Leave)  │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  [Bulk Mark Present] [Save]      │
└──────────────────────────────────┘
```

**Data Model:**
```dart
class Attendance {
  String lessonId;
  String studentId;
  AttendanceStatus status; // PRESENT, ABSENT, LEAVE
  DateTime date;
  DateTime timestamp;
}

enum AttendanceStatus { PRESENT, ABSENT, LEAVE }
```

**Business Logic:**
```
Attendance Percentage = (Present Count / Total Days) × 100

Status Indicators:
- ✓ Green = Present
- ✗ Red = Absent
- ○ Yellow = Leave
```

**API Endpoints:**
```
POST /api/teacher/attendance/mark
Body: {
  lessonId: string,
  attendance: [{ studentId, status }]
}

GET /api/teacher/attendance/:lessonId
Response: { lesson, students[], attendance[] }
```

---

### Feature 3: Lessons Management (teacher_lessons.dart)

**CRUD Operations:**

| Operation | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| Create | /api/teacher/lessons | POST | Add new lesson |
| Read | /api/teacher/lessons | GET | View all lessons |
| Read | /api/teacher/lessons/:id | GET | View specific lesson |
| Update | /api/teacher/lessons/:id | PUT | Modify lesson |
| Delete | /api/teacher/lessons/:id | DELETE | Remove lesson |

**Lesson Data Structure:**
```dart
class Lesson {
  String id;
  String name;
  String subject;
  String className;
  DateTime date;
  Time startTime;
  Time endTime;
  String description;
  List<String> resources; // Attachment URLs
  String classId;
  String teacherId;
}
```

**UI Components:**
```
Lesson List View:
┌─────────────────────────────────┐
│ Lesson: Mathematics             │
│ Class: 10-A | Subject: Algebra  │
│ Date: Nov 23, 2025              │
│ Time: 09:00 - 10:00             │
│ [Edit] [Delete] [View]          │
└─────────────────────────────────┘
```

---

### Feature 4: Marks Management (marks_screen.dart)

**Grade Calculation:**
```
Score Range → Grade
80-100      → A (Excellent)
70-79       → B (Very Good)
60-69       → C (Good)
50-59       → D (Satisfactory)
Below 50    → F (Needs Improvement)
```

**Marks Entry Form:**
```
┌──────────────────────────────────┐
│ Select Assessment/Exam           │
├──────────────────────────────────┤
│ Student Name | Marks (0-100)     │
├──────────────────────────────────┤
│ Student 1    | [___] Grade: A    │
│ Student 2    | [___] Grade: B    │
│ Student 3    | [___] Grade: C    │
├──────────────────────────────────┤
│ [Calculate] [Save]               │
└──────────────────────────────────┘
```

**Data Model:**
```dart
class StudentMarks {
  String studentId;
  String assessmentId;
  int marks; // 0-100
  String grade; // A, B, C, D, F
  DateTime submittedDate;
}
```

**API Endpoints:**
```
POST /api/teacher/marks
Body: {
  assessmentId: string,
  marks: [{ studentId, marks }]
}

GET /api/teacher/marks/:assessmentId
Response: { students[], marks[] }
```

---

### Feature 5: Timetable View (teacher_timetable.dart)

**Weekly View:**
```
        Mon    Tue    Wed    Thu    Fri
09:00 [Math] [Eng] [Math] [Eng] [Sci]
10:00 [---] [Math] [---] [Math] [---]
11:00 [Sci] [---] [Sci] [---] [Math]
12:00 [Lunch]
13:00 [---] [Eng] [---] [Eng] [Sci]
```

**Timetable Data:**
```dart
class TimeSlot {
  String dayOfWeek; // MON, TUE, WED...
  Time startTime;
  Time endTime;
  String className;
  String subject;
  String roomNumber;
}
```

---

### Feature 6: Students Management (teacher_students.dart)

**Student Information Display:**
```
┌─────────────────────────────────┐
│ Name: John Doe                  │
│ Class: 10-A                     │
│ Roll No: 001                    │
│ Contact: 071-1234567           │
│ Email: john@example.com         │
│ Attendance: 95%                 │
│ Average: 78%                    │
│ [View Details]                  │
└─────────────────────────────────┘
```

**Student Model:**
```dart
class Student {
  String id;
  String name;
  String surname;
  String className;
  String rollNumber;
  String phone;
  String email;
  double attendancePercentage;
  double averageMarks;
  List<Lesson> enrolledLessons;
}
```

---

### Feature 7: Parents Management (teacher_parents.dart)

**Parent Contact Interface:**
```
┌─────────────────────────────────┐
│ Parent Name: Jane Doe           │
│ Student: John Doe               │
│ Relation: Mother                │
│ Phone: 071-9876543             │
│ Email: jane@example.com         │
│ [Call] [Email] [Message]        │
└─────────────────────────────────┘
```

---

## 📊 Data Models

### User Model
```dart
class User {
  String id;
  String username;
  String email;
  String name;
  String surname;
  String role; // teacher, student, parent
  String phone;
  String address;
  DateTime birthday;
  String sex;
}

class Teacher extends User {
  List<String> classIds;
  List<String> subjectIds;
  DateTime joinDate;
}
```

### Class Model
```dart
class Class {
  String id;
  String name; // e.g., "10-A"
  int gradeLevel;
  String teacherId;
  int capacity;
  List<String> studentIds;
}
```

### Subject Model
```dart
class Subject {
  String id;
  String name;
  String code;
  int creditHours;
}
```

---

## 🔌 API Specifications

### Base Configuration
```
Base URL: http://10.0.2.2:3000 (Android Emulator)
Timeout: 30 seconds
Headers: { 'Content-Type': 'application/json' }
Auth: Cookie-based with JWT token (auth-token)
```

### Authentication Endpoints

**Login:**
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "identifier": "ravi.perera@wkcc.lk",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Ravi",
    "surname": "Perera",
    "role": "teacher",
    "email": "ravi.perera@wkcc.lk"
  }
}

Headers: Set-Cookie: auth-token=eyJ0eXAi...
```

**Logout:**
```
POST /api/auth/logout
Headers: { 'Cookie': 'auth-token=...' }

Response: 200 OK
{ "success": true }
```

### Teacher Endpoints

**Get Dashboard:**
```
GET /api/teacher/dashboard
Headers: { 'Cookie': 'auth-token=...' }

Response: {
  "stats": {
    "classes": 5,
    "students": 120,
    "subjects": 3,
    "supervised": 2,
    "lessons": 15
  },
  "todayLessons": [...],
  "myClasses": [...],
  "announcements": [...]
}
```

**Lessons:**
```
GET /api/teacher/lessons
POST /api/teacher/lessons
GET /api/teacher/lessons/:id
PUT /api/teacher/lessons/:id
DELETE /api/teacher/lessons/:id
```

**Attendance:**
```
GET /api/teacher/attendance/lessons
POST /api/teacher/attendance/mark
GET /api/teacher/attendance/:lessonId
```

**Marks:**
```
GET /api/teacher/marks
POST /api/teacher/marks
GET /api/teacher/marks/:assessmentId
```

---

## 👥 User Workflows

### Workflow 1: Daily Attendance Marking

```
Start
  ↓
[Open App]
  ↓
[Login] → Authenticate
  ↓
[View Dashboard]
  ↓
[Click Attendance] → Tap "Take Attendance"
  ↓
[Select Lesson] → Choose from today's lessons
  ↓
[Load Students] → Display student list
  ↓
[Mark Status] → ✓ Present / ✗ Absent / ○ Leave
  ↓
[Review] → Check attendance summary
  ↓
[Save] → Store attendance records
  ↓
[Confirmation] → "Attendance saved successfully"
  ↓
End
```

### Workflow 2: Entering Marks

```
Start
  ↓
[Open App] → [Dashboard]
  ↓
[Marks Section] → Select assessment
  ↓
[Load Form] → Display mark entry grid
  ↓
[Enter Marks] → Input scores (0-100)
  ↓
[Auto Grade] → System calculates grades
  ↓
[Validate] → Check range and values
  ↓
[Save] → Store marks in database
  ↓
[View Report] → Show marks summary
  ↓
End
```

---

## ❌ Error Handling

### Network Errors
```dart
try {
  final response = await http.get(...).timeout(Duration(seconds: 30));
} on SocketException {
  showError('No internet connection');
} on TimeoutException {
  showError('Request timeout - please try again');
} catch (e) {
  showError('Network error: ${e.toString()}');
}
```

### Authentication Errors
```
401 Unauthorized:
- Token expired → Auto-logout, redirect to login
- Invalid token → Clear local storage, show login

403 Forbidden:
- Role mismatch → Show error, logout

400 Bad Request:
- Invalid input → Show validation error
```

### API Response Errors
```
HTTP Status Code → Action
200-299          → Success
400              → Bad request validation
401              → Re-authenticate
403              → Permission denied
500              → Server error
503              → Service unavailable
```

---

## 🎯 Performance Metrics

**Before Cleanup:**
- Compilation Issues: 208
- Screen Files: 28+
- Build Time: ~2-3 minutes
- App Size: Larger

**After Cleanup:**
- Compilation Issues: 37 (82% reduction)
- Screen Files: 8 (essential only)
- Build Time: ~1-1.5 minutes (faster)
- App Size: Reduced

**Remaining Warnings:**
- Deprecated `withOpacity()` (low impact)
- Unused theme imports (cleanup only)
- Debug print statements (removal task)

---

## ✅ Deployment Checklist

- [x] Remove student/parent modules
- [x] Simplify routing logic
- [x] Clean unused imports
- [x] Optimize build
- [ ] Remove debug print statements
- [ ] Replace deprecated API calls
- [ ] Complete API integration
- [ ] Performance testing
- [ ] Security audit
- [ ] Create release build

---

## 📞 Support & Maintenance

**Build Command:**
```bash
cd mobile
flutter clean
flutter pub get
flutter run --debug
```

**Analyze Issues:**
```bash
flutter analyze
```

**Build Release:**
```bash
flutter build apk --release
```

---

*Last Updated: November 23, 2025*  
*Version: 1.0 (Streamlined Teacher-Only)*

