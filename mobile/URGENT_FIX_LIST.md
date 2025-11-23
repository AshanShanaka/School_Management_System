# 🔥 URGENT FIX LIST - As Expert SE

## Problem: Screens Not Loading Data

### Root Causes Identified:
1. ❌ Index out of bounds (19 > 14) - State preservation issue
2. ❌ Some screens not fetching data properly
3. ❌ Timetable screen missing entirely
4. ❌ Dashboard shows placeholder data

---

## 🎯 SOLUTION PLAN

### Phase 1: Fix Navigation (BUILDING NOW)
- Clean restart removes stale state
- App will start at index 0 (Dashboard)
- All 14 screens properly mapped

### Phase 2: Implement Missing Screens
**Timetable Screen** - Show weekly schedule
- Fetch lessons grouped by day
- Calendar view with time slots
- Color-coded by subject

### Phase 3: Fix Data Loading
**Dashboard:**
```dart
- Fetch students count: GET /api/students
- Fetch lessons count: GET /api/lessons
- Fetch today's attendance: GET /api/attendance
- Fetch upcoming exams: GET /api/exams
```

**Attendance:**
```dart
- Already implemented
- Verify API endpoints work
```

**Exams:**
```dart
- Fetch: GET /api/exams
- Show list with dates
- Add filters
```

**Exam Results:**
```dart
- Fetch: GET /api/results
- Show scores by student
- Grade charts
```

**Report Cards:**
```dart
- Fetch: GET /api/students
- Generate report view
- Print/download option
```

### Phase 4: Polish UI
- Consistent loading states
- Error handling with retry
- Pull-to-refresh everywhere
- Empty states with icons
- Professional spacing

---

## 📱 MENU STRUCTURE (FINAL)

Index | Screen | Status | Data Source
------|--------|--------|------------
0 | Dashboard | ⏳ Needs data | `/api/students`, `/api/lessons`, `/api/exams`
1 | Students | ✅ Working | `/api/students`
2 | Parents | ✅ Working | `/api/parents`
3 | Lessons | ✅ Working | `/api/lessons`
4 | Exams | ⏳ Needs data | `/api/exams`
5 | Exam Results | ⏳ Needs data | `/api/results`
6 | Timetable | ❌ Missing | `/api/lessons`
7 | Attendance | ✅ Working | `/api/attendance`
8 | Report Cards | ⏳ Needs data | `/api/students`
9 | Parent Meetings | ⏳ Needs data | `/api/meetings`
10 | Messages | ⏳ Needs data | `/api/messages`
11 | Assignments | ✅ Working | `/api/assignments`
12 | Analytics | ⏳ Needs data | `/api/analytics`
13 | Events | ⏳ Needs data | `/api/events`
14 | Announcements | ⏳ Needs data | `/api/announcements`

---

## ⏰ TIMELINE

1. **Now (Building):** Fresh app start - fixes index error
2. **Next 5 min:** Create Timetable screen
3. **Next 10 min:** Fix all data loading
4. **Next 5 min:** Polish UI and test

**Total: ~20 minutes to complete everything!**

---

**Building now... (~30 seconds remaining)**
