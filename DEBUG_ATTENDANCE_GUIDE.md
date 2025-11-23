# 🐛 Debug Attendance Screen - Complete Guide

## Current Status
✅ Debug logging added to attendance screen  
✅ Backend API fixed to include `classId` in lessons  
✅ Flutter app running with debug mode  

---

## 📱 How to Debug

### Step 1: Login
In the emulator, login with:
- **Email**: `ravi.perera@wkcc.lk`
- **Password**: `password`

### Step 2: Navigate to Attendance
From Teacher Dashboard → Click **Attendance**

### Step 3: Watch Debug Console
Look for these logs in the terminal:

```
🔍 [ATTENDANCE] Starting to load lessons...
🔍 [ATTENDANCE] Token: eyJ0eXAiOiJKV1QiLCJh...
🔍 [ATTENDANCE] Fetching from: http://10.0.2.2:3000/api/teacher/dashboard
🔍 [ATTENDANCE] Response status: 200
🔍 [ATTENDANCE] Response data keys: [teacher, stats, classes, subjects, lessons, students, ...]
🔍 [ATTENDANCE] Lessons count: X
🔍 [ATTENDANCE] First lesson: {id: ..., name: ..., classId: ...}
🔍 [ATTENDANCE] Lessons loaded successfully: X lessons
```

### Step 4: Select a Lesson
When you click a lesson, watch for:

```
🔍 [ATTENDANCE] Loading students for class ID: cmi...
🔍 [ATTENDANCE] Students response status: 200
🔍 [ATTENDANCE] Total students: X
🔍 [ATTENDANCE] Student Name: classId=cmi..., matching=cmi...
🔍 [ATTENDANCE] Filtered students: X
🔍 [ATTENDANCE] Students loaded successfully
```

---

## 🔍 Debug Logs Explained

| Log | Meaning |
|-----|---------|
| `🔍 [ATTENDANCE]` | Normal debug info |
| `❌ [ATTENDANCE]` | Error occurred |
| `Starting to load lessons...` | Function called |
| `Response status: 200` | API call successful |
| `Lessons count: 0` | **PROBLEM**: No lessons returned |
| `Lessons count: 5` | **SUCCESS**: 5 lessons loaded |
| `Filtered students: 0` | **PROBLEM**: No students in class |
| `Filtered students: 25` | **SUCCESS**: 25 students found |

---

## 🔧 Fixes Applied

### 1. Backend API Fix
**File**: `src/app/api/teacher/dashboard/route.ts`

**Added**: `classId` and `subjectId` directly to lesson objects

**Before**:
```typescript
lessons: teacher.lessons.map((lesson) => ({
  id: lesson.id,
  name: lesson.name,
  // classId was missing!
  class: { id: lesson.class.id, ... }
}))
```

**After**:
```typescript
lessons: teacher.lessons.map((lesson) => ({
  id: lesson.id,
  name: lesson.name,
  classId: lesson.classId, // ✅ Added!
  subjectId: lesson.subjectId, // ✅ Added!
  class: { id: lesson.class.id, ... }
}))
```

### 2. Flutter Debug Logging
**File**: `mobile/lib/screens/teacher/attendance_screen.dart`

**Added**:
- Detailed logging in `_loadLessons()`
- Detailed logging in `_loadStudents()`
- Stack trace on errors
- Response data inspection

---

## 🚨 Common Issues & Solutions

### Issue 1: Lessons count: 0
**Cause**: Teacher has no lessons assigned  
**Solution**: 
1. Check web app → Admin → Lessons
2. Assign lessons to Ravi Perera teacher
3. Reload attendance screen

### Issue 2: Response status: 401
**Cause**: Not authenticated  
**Solution**: Logout and login again

### Issue 3: Filtered students: 0
**Cause**: Class ID mismatch  
**Debug**: Look for logs like:
```
Student Name: classId=abc123, matching=xyz456
```
If IDs don't match, the classId in lesson is wrong.

### Issue 4: Error loading lessons: SocketException
**Cause**: Backend not running  
**Solution**: 
```powershell
cd c:\Users\User\OneDrive\Desktop\Projects\Final Year\FYP\school_management_system
npm run dev
```

---

## 📊 Expected Output (Success)

```
I/flutter (17067): 🔍 [ATTENDANCE] Starting to load lessons...
I/flutter (17067): 🔍 [ATTENDANCE] Token: eyJ0eXAiOiJKV1QiLCJh...
I/flutter (17067): 🔍 [ATTENDANCE] Fetching from: http://10.0.2.2:3000/api/teacher/dashboard
I/flutter (17067): 🔍 [ATTENDANCE] Response status: 200
I/flutter (17067): 🔍 [ATTENDANCE] Response data keys: (teacher, stats, classes, subjects, lessons, todayLessons, upcomingExams, announcements, students)
I/flutter (17067): 🔍 [ATTENDANCE] Lessons count: 8
I/flutter (17067): 🔍 [ATTENDANCE] First lesson: {id: cmi..., name: Mathematics - Grade 11A, classId: cmi..., subjectId: cmi..., day: MONDAY, startTime: 08:00, endTime: 09:30, subject: {id: cmi..., name: Mathematics}, class: {id: cmi..., name: 11A, grade: {id: cmi..., level: 11}}}
I/flutter (17067): 🔍 [ATTENDANCE] Lessons loaded successfully: 8 lessons
```

---

## 🎯 Next Steps

1. **Login** to the app
2. **Navigate** to Attendance screen
3. **Watch terminal** for debug logs
4. **Copy** any error messages
5. **Report** findings

If you see `Lessons count: 0`, we need to check the database to ensure the teacher has lessons assigned.

---

## 💡 Tips

- Keep the terminal visible while testing
- Use `Ctrl+F` in terminal to search for `[ATTENDANCE]`
- If logs are too fast, use `Ctrl+C` to pause terminal
- Hot reload won't reset state - use `R` for hot restart if needed

---

## 🔗 Related Files

- Flutter Screen: `mobile/lib/screens/teacher/attendance_screen.dart`
- Backend API: `src/app/api/teacher/dashboard/route.ts`
- This Guide: `DEBUG_ATTENDANCE_GUIDE.md`

---

**Now test the attendance screen and watch the debug console!** 🚀
