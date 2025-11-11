# 🧪 Exam Feature - API Testing Guide

## Quick Test Scenarios

### Scenario 1: Complete Exam Lifecycle (Happy Path)

#### Step 1: Admin Creates Exam Timetable
```bash
curl -X POST http://localhost:3000/api/exam-timetable \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Mid Term Exam - Term 1 - 2025",
    "examType": "MIDTERM",
    "gradeId": 11,
    "classId": 1,
    "term": 1,
    "year": 2025,
    "subjects": [
      {
        "subjectId": 1,
        "teacherId": "teacher_math_id",
        "examDate": "2025-12-10T00:00:00Z",
        "startTime": "09:00",
        "endTime": "11:00",
        "maxMarks": 100
      },
      {
        "subjectId": 2,
        "teacherId": "teacher_science_id",
        "examDate": "2025-12-11T00:00:00Z",
        "startTime": "09:00",
        "endTime": "11:00",
        "maxMarks": 100
      }
    ],
    "marksEntryDeadline": "2025-12-15T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Exam timetable created/updated successfully",
  "exam": {
    "id": 1,
    "title": "Mid Term Exam - Term 1 - 2025",
    "status": "PUBLISHED",
    ...
  }
}
```

#### Step 2: All Users Can View Exam Timetable
```bash
# Any authenticated user
curl http://localhost:3000/api/exam-timetable?year=2025&term=1 \
  -H "Cookie: your-auth-cookie"
```

**Expected:** List of published exams with subjects and dates

#### Step 3: Teacher Gets Student List for Marks Entry
```bash
# As subject teacher
curl "http://localhost:3000/api/exam-marks-entry?examId=1&classId=1&subjectId=1" \
  -H "Cookie: teacher-auth-cookie"
```

**Expected Response:**
```json
{
  "success": true,
  "examSubject": {
    "id": 1,
    "maxMarks": 100,
    "subject": { "name": "Mathematics" }
  },
  "students": [
    {
      "studentId": "student123",
      "studentName": "Alice Smith",
      "marks": null,
      "isAbsent": false,
      "grade": null
    },
    ...
  ]
}
```

#### Step 4: Teacher Enters Marks
```bash
curl -X POST http://localhost:3000/api/exam-marks-entry \
  -H "Content-Type: application/json" \
  -H "Cookie: teacher-auth-cookie" \
  -d '{
    "examId": 1,
    "examSubjectId": 1,
    "marks": [
      {
        "studentId": "student123",
        "marks": 85,
        "isAbsent": false
      },
      {
        "studentId": "student456",
        "marks": null,
        "isAbsent": true
      },
      {
        "studentId": "student789",
        "marks": 92,
        "isAbsent": false
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Marks saved successfully for 3 students",
  "results": [...]
}
```

#### Step 5: Class Teacher Generates Report Cards
```bash
curl "http://localhost:3000/api/exam-report-card?examId=1&classId=1&generate=true" \
  -H "Cookie: class-teacher-auth-cookie"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Generated report cards for 30 students",
  "reportCards": [
    {
      "studentId": "student123",
      "studentName": "Alice Smith",
      "totalMarks": 163,
      "percentage": 81.5,
      "classRank": 1,
      "subjects": [...]
    },
    ...
  ]
}
```

#### Step 6: Student Views Their Report Card
```bash
curl "http://localhost:3000/api/exam-report-card?examId=1&studentId=student123" \
  -H "Cookie: student-auth-cookie"
```

**Expected:** Single report card with all subjects, grades, rank

#### Step 7: Parent Views Child's Report Card
```bash
curl "http://localhost:3000/api/exam-report-card?examId=1&studentId=child_student_id" \
  -H "Cookie: parent-auth-cookie"
```

**Expected:** Child's report card (verified parent-child relationship)

---

## Test Data Setup

### Required Test Data:

1. **Admin User**
   ```sql
   -- Should already exist in your system
   ```

2. **Teachers** (with role="teacher")
   ```sql
   -- Math teacher
   -- Science teacher
   -- etc.
   ```

3. **Students** (in specific classes)
   ```sql
   -- At least 3-5 students per class for testing
   ```

4. **Subjects**
   ```sql
   -- Mathematics (id: 1)
   -- Science (id: 2)
   -- English (id: 3)
   -- etc.
   ```

5. **Classes & Grades**
   ```sql
   -- Grade 11, Class 11-A (classId: 1, gradeId: 11)
   ```

---

## Error Test Cases

### 1. Unauthorized Access
```bash
# Student trying to create exam (should fail)
curl -X POST http://localhost:3000/api/exam-timetable \
  -H "Content-Type: application/json" \
  -H "Cookie: student-auth-cookie" \
  -d '{...}'
```
**Expected:** `403 Forbidden` - "Unauthorized. Admin access required."

### 2. Student Viewing Another Student's Report
```bash
curl "http://localhost:3000/api/exam-report-card?examId=1&studentId=other_student_id" \
  -H "Cookie: student-auth-cookie"
```
**Expected:** `403 Forbidden` - "You can only view your own report card."

### 3. Parent Viewing Non-Child Report
```bash
curl "http://localhost:3000/api/exam-report-card?examId=1&studentId=not_my_child_id" \
  -H "Cookie: parent-auth-cookie"
```
**Expected:** `403 Forbidden` - "You can only view your children's report cards."

### 4. Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/exam-timetable \
  -H "Content-Type: application/json" \
  -H "Cookie: admin-auth-cookie" \
  -d '{
    "title": "Test Exam"
    // Missing: examType, gradeId, term, year, subjects
  }'
```
**Expected:** `400 Bad Request` - "Missing required fields: ..."

### 5. Invalid Exam Type
```bash
curl -X POST http://localhost:3000/api/exam-timetable \
  -H "Content-Type: application/json" \
  -H "Cookie: admin-auth-cookie" \
  -d '{
    "title": "Test",
    "examType": "INVALID_TYPE",
    ...
  }'
```
**Expected:** `400 Bad Request` - "Invalid exam type. Must be one of: MIDTERM, FINAL, ..."

---

## Validation Checks

### Exam Timetable Creation:
- ✅ Only admin can create
- ✅ Required fields validated
- ✅ Exam type enum validated
- ✅ Subjects array not empty
- ✅ Each subject has date, times, subjectId
- ✅ Updates existing exam if already exists for year/term/grade/type

### Marks Entry:
- ✅ Only teachers can enter marks
- ✅ Teacher must be assigned to that exam subject
- ✅ All students must have entry (marks or absent)
- ✅ Marks cannot exceed maxMarks
- ✅ Absent students get marks=0, grade="AB"
- ✅ Non-absent must have marks value

### Report Card Generation:
- ✅ Only teachers can generate
- ✅ Teacher must be class teacher
- ✅ All subjects must have marks entered
- ✅ Ranks calculated correctly (sorted by total)
- ✅ Percentage = (totalMarks/totalMaxMarks) * 100
- ✅ Average = totalMarks / subject count (excluding absent)

### Report Card Viewing:
- ✅ Students see only their own
- ✅ Parents see only their children's
- ✅ Teachers see all in their class
- ✅ Admin sees all

---

## Quick Postman Collection

### 1. Create Environment Variables:
```
BASE_URL = http://localhost:3000
ADMIN_COOKIE = session=...
TEACHER_COOKIE = session=...
STUDENT_COOKIE = session=...
PARENT_COOKIE = session=...
EXAM_ID = 1
CLASS_ID = 1
SUBJECT_ID = 1
STUDENT_ID = student123
```

### 2. Import These Requests:

#### Collection: "Exam Feature"

**Folder: Admin**
- POST Create Exam Timetable
- GET View All Exams

**Folder: Teacher**
- GET My Exams
- GET Students for Marks Entry
- POST Save Marks
- GET Generate Report Cards

**Folder: Student**
- GET My Exams
- GET Exam Timetable
- GET My Report Card

**Folder: Parent**
- GET My Children's Exams
- GET Child Report Card

---

## Database Inspection Queries

### Check Created Exam:
```sql
SELECT * FROM "Exam" WHERE year = 2025 AND term = 1;
```

### Check Exam Subjects (Timetable):
```sql
SELECT 
  es.*,
  s.name as subject_name,
  t.name as teacher_name
FROM "ExamSubject" es
JOIN "Subject" s ON es."subjectId" = s.id
LEFT JOIN "Teacher" t ON es."teacherId" = t.id
WHERE es."examId" = 1
ORDER BY es."examDate", es."startTime";
```

### Check Marks Entry:
```sql
SELECT 
  er.*,
  st.name || ' ' || st.surname as student_name,
  s.name as subject_name
FROM "ExamResult" er
JOIN "Student" st ON er."studentId" = st.id
JOIN "ExamSubject" es ON er."examSubjectId" = es.id
JOIN "Subject" s ON es."subjectId" = s.id
WHERE er."examId" = 1
ORDER BY st.name;
```

### Check Report Summaries:
```sql
SELECT 
  esm.*,
  st.name || ' ' || st.surname as student_name,
  e.title as exam_title
FROM "ExamSummary" esm
JOIN "Student" st ON esm."studentId" = st.id
JOIN "Exam" e ON esm."examId" = e.id
WHERE esm."examId" = 1
ORDER BY esm."classRank";
```

---

## Expected Console Logs

### Successful Exam Creation:
```
📥 Creating exam timetable: Mid Term Exam - Term 1 - 2025
✅ Created exam with 2 subjects
✅ Published exam (status: PUBLISHED)
```

### Marks Entry:
```
📝 Saving marks for 3 students
✅ ExamResult created/updated: student123 → 85 (Grade: A)
✅ ExamResult created/updated: student456 → 0 (Grade: AB - Absent)
✅ ExamResult created/updated: student789 → 92 (Grade: A)
✅ Marked ExamSubject as marksEntered
```

### Report Card Generation:
```
📊 Generating report cards for class 1
✅ Collected results for 30 students
✅ Calculated ranks: 1st (95%), 2nd (93%), 3rd (91%)...
✅ Created/updated 30 ExamSummary records
```

---

## Performance Metrics

### Expected Response Times:
- Create Exam Timetable: < 500ms
- Get Exam Timetable: < 200ms
- Get Students for Marks Entry: < 300ms
- Save Marks (30 students): < 1000ms
- Generate Report Cards (30 students): < 2000ms
- Get Single Report Card: < 300ms

### Database Queries:
- Exam creation: 1 INSERT + N subject INSERTs (transaction)
- Marks entry: N UPSERT operations (transaction)
- Report generation: 1 query + N summary UPSERTs (transaction)
- Report viewing: 2-3 SELECT queries with joins

---

## 🎉 Success Criteria

✅ Admin can create exam timetable
✅ All users see exam timetable immediately
✅ Teachers can enter marks
✅ Grades auto-calculated correctly
✅ Report cards generated with accurate ranks
✅ Students see only their data
✅ Parents see only children's data
✅ No unauthorized access possible
✅ All API responses under 2 seconds
✅ Database constraints enforced

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" on all requests
**Solution:** Ensure you're passing the correct authentication cookie

### Issue: "Exam subject not found"
**Solution:** Verify examId and subjectId are correct and exam is published

### Issue: "Student not found in class"
**Solution:** Check classId matches the student's actual class

### Issue: Grades not calculating
**Solution:** Ensure maxMarks is set correctly (default 100)

### Issue: Report card shows 0 rank
**Solution:** Generate report cards first using the generate endpoint

---

**All APIs are ready for testing!** 🚀
