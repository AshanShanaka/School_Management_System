# How Subject Teachers Enter Marks - Complete Guide 📝

## Overview
After an exam is created by the admin, subject teachers can enter marks for their students through a user-friendly marks entry system.

## Prerequisites

### 1. **Admin Must Create the Exam**
- Navigate to: **Exams → Create New Exam**
- Fill in exam details (title, grade, year, term)
- Add subjects with exam dates and times
- Set maximum marks for each subject
- Assign invigilators (optional)
- Publish the exam (status: PUBLISHED)

### 2. **Teachers Must Be Assigned to Subjects**
Teachers need to have **Subject Assignments** for the grade:
- A teacher must be assigned to teach a subject for a specific class/grade
- This assignment is done through the admin panel
- System checks: `SubjectAssignment` table links Teacher → Subject → Class → Grade

## How Teachers Enter Marks - Step by Step

### **Step 1: Navigate to Exams**
1. Teacher logs into the system
2. Clicks **"Exams"** from the menu (RESOURCES section)
3. Sees a list of exams for grades they teach

### **Step 2: Access Marks Entry**
Teachers have **two ways** to access marks entry:

#### **Option A: From Exam List**
1. In the exam list, each exam row has action buttons
2. Click the **yellow pencil icon** (✏️ Marks Entry button)
3. System redirects to: `/teacher/marks-entry/[examId]`

#### **Option B: Direct Link**
- URL format: `http://localhost:3000/teacher/marks-entry/[examId]`
- Replace `[examId]` with the actual exam ID

### **Step 3: Select Subject (If Teaching Multiple)**
If the teacher teaches multiple subjects for this exam:
1. System shows all subjects they're assigned to
2. Each subject card displays:
   - Subject name
   - Maximum marks
   - Completion status (✓ Completed or pending)
3. Click on a subject to enter marks for it

**Auto-Selection**: If the teacher teaches only ONE subject, it's automatically selected.

### **Step 4: Enter Student Marks**
The marks entry interface shows:

#### **Header Information**
- Exam title
- Grade level
- Progress: "X / Y subjects completed"

#### **Subject Information Panel** (Green)
- Subject name
- Maximum marks allowed
- Completion status
- Date when marks were previously entered (if applicable)

#### **Search Functionality**
- Search bar to filter students by name or username
- Real-time filtering as you type

#### **Marks Entry Grid**
A table with columns:
| Student | Username | Marks (Max: 100) | Grade |
|---------|----------|------------------|-------|
| John Doe | john.doe | [Input] | A+ |
| Jane Smith | jane.smith | [Input] | B+ |

**For each student:**
1. Enter marks in the input field (0 to max marks)
2. Grade is automatically calculated:
   - **A+**: 90-100%
   - **A**: 80-89%
   - **B+**: 70-79%
   - **B**: 60-69%
   - **C+**: 50-59%
   - **C**: 40-49%
   - **D**: 30-39%
   - **F**: Below 30%

#### **Live Statistics Panel**
As you enter marks, see real-time stats:
- **Students**: Number entered / Total students
- **Average**: Mean marks
- **Highest**: Maximum marks entered
- **Lowest**: Minimum marks entered

### **Step 5: Submit Marks**
1. Review all entered marks
2. Click **"Submit Marks"** button (green, bottom-right)
3. System validates:
   - All marks are between 0 and max marks
   - Marks format is correct
4. Success message appears
5. Subject is marked as "Completed" ✓

### **Step 6: Complete Other Subjects (If Applicable)**
1. Select another subject from the subject cards
2. Repeat marks entry process
3. Continue until all subjects are completed

## Backend Process Flow

### **When Teacher Accesses Marks Entry:**

```typescript
GET /api/marks-entry/[examId]
```

**System checks:**
1. ✅ Is user authenticated?
2. ✅ Is user a teacher?
3. ✅ Does exam exist?
4. ✅ Is teacher assigned to teach subjects for this exam's grade?

**System returns:**
- Exam details (title, grade, year, term)
- Teacher's assigned subjects (from `SubjectAssignment`)
- All students in the exam's grade
- Existing marks (if previously entered)
- Completion status for each subject

### **When Teacher Submits Marks:**

```typescript
POST /api/marks-entry/[examId]
```

**Request Body:**
```json
{
  "subjectId": 5,
  "marks": [
    { "studentId": "student-uuid-1", "marksObtained": 85 },
    { "studentId": "student-uuid-2", "marksObtained": 92 },
    { "studentId": "student-uuid-3", "marksObtained": 78 }
  ]
}
```

**System process:**
1. ✅ Validates user authorization
2. ✅ Verifies teacher is assigned to this subject
3. ✅ Gets or creates `ExamSubject` record
4. ✅ **Transaction begins:**
   - Creates/updates `ExamResult` for each student
   - Marks subject as completed (`marksEntered: true`)
   - Records submission timestamp
   - Records who entered marks (`marksEnteredBy`)
5. ✅ Checks if ALL subjects completed
6. ✅ If all complete, updates exam status to "CLASS_REVIEW"
7. ✅ **Transaction commits**
8. ✅ Returns success message

## Database Tables Involved

### **ExamSubject**
Links exams to subjects with scheduling:
```prisma
model ExamSubject {
  id              Int
  examId          Int
  subjectId       Int
  teacherId       String?     // Invigilator
  maxMarks        Int
  examDate        DateTime
  startTime       String
  endTime         String
  marksEntered    Boolean     // Completion flag
  marksEnteredAt  DateTime?   // When submitted
  marksEnteredBy  String?     // Who submitted (teacher ID)
}
```

### **ExamResult**
Stores individual student marks:
```prisma
model ExamResult {
  id            Int
  examId        Int
  examSubjectId Int
  studentId     String
  marks         Int
  grade         String?
  createdAt     DateTime
  updatedAt     DateTime
}
```

### **SubjectAssignment**
Links teachers to subjects for classes:
```prisma
model SubjectAssignment {
  id         Int
  teacherId  String
  subjectId  Int
  classId    Int
  // This determines which teachers can enter marks
}
```

## Key Features

### **1. Auto-Creation of Exam Subjects**
If a teacher is assigned to teach a subject but the exam doesn't have that `ExamSubject` record:
- System automatically creates it with default max marks (100)
- Teacher can still enter marks
- No manual intervention needed

### **2. Edit Previously Entered Marks**
- Teachers can re-access completed subjects
- Shows message: "Marks Already Entered (Date)"
- Can modify and re-submit marks
- System uses `UPSERT` operation (update if exists, create if not)

### **3. Validation**
- ✅ Marks cannot be negative
- ✅ Marks cannot exceed max marks
- ✅ Only assigned teachers can enter marks
- ✅ Students must be in the correct grade

### **4. Progress Tracking**
- Header shows: "3 / 5 subjects completed"
- Each subject card shows completion status
- Teachers know what's left to do

### **5. Grade Calculation**
- Automatic grade assignment based on percentage
- Real-time display as marks are entered
- Color-coded badges (green for A, yellow for C, red for F)

## Exam Status Workflow

```
DRAFT → PUBLISHED → CLASS_REVIEW → APPROVED → COMPLETED
         ↑                ↑
         |                |
    Admin publishes   All subjects completed
```

**Status Changes:**
1. **DRAFT**: Admin creates exam
2. **PUBLISHED**: Admin publishes (students/parents can see timetable)
3. **CLASS_REVIEW**: All teachers submit marks (auto-triggered)
4. **APPROVED**: Admin reviews and approves
5. **COMPLETED**: Exam finalized

## Common Scenarios

### **Scenario 1: Teacher Teaches One Subject**
```
Teacher: Mr. Smith teaches Math for Grade 10
Exam: Grade 10 Term 1 Exam

Flow:
1. Mr. Smith clicks "Exams"
2. Clicks marks entry on "Grade 10 Term 1 Exam"
3. Math is auto-selected (only subject)
4. Enters marks for all 30 students
5. Clicks "Submit Marks"
6. Done! ✓
```

### **Scenario 2: Teacher Teaches Multiple Subjects**
```
Teacher: Mrs. Johnson teaches English, History for Grade 9
Exam: Grade 9 Mid-Year Exam

Flow:
1. Mrs. Johnson clicks "Exams"
2. Clicks marks entry on "Grade 9 Mid-Year Exam"
3. Sees 2 subject cards: English, History
4. Clicks "English" → Enters marks → Submits
5. Clicks "History" → Enters marks → Submits
6. Done! Both subjects show ✓ Completed
```

### **Scenario 3: Teacher Needs to Edit Marks**
```
Teacher: Mr. Lee needs to correct marks he entered yesterday

Flow:
1. Mr. Lee clicks "Exams"
2. Clicks marks entry on the exam
3. Selects the subject (shows "✓ Completed")
4. Sees previously entered marks in input fields
5. Modifies incorrect marks
6. Clicks "Submit Marks" again
7. Success! Updated marks saved
```

### **Scenario 4: Multiple Teachers, Same Exam**
```
Exam: Grade 11 Final Exam
Subjects:
- Math (Mr. Ahmed)
- Science (Dr. Williams)
- English (Ms. Brown)

Flow:
1. Mr. Ahmed enters Math marks → 1/3 complete
2. Dr. Williams enters Science marks → 2/3 complete
3. Ms. Brown enters English marks → 3/3 complete
4. System auto-updates exam status to "CLASS_REVIEW"
5. Admin can now review and approve
```

## Troubleshooting

### **Issue 1: Teacher Can't See Exam**
**Cause**: Teacher not assigned to any subject for that grade
**Solution**: 
- Admin must create `SubjectAssignment` record
- Link: Teacher → Subject → Class → Grade
- Path: Admin Panel → Subject Assignments

### **Issue 2: "You are not assigned to teach any subjects"**
**Cause**: No `SubjectAssignment` exists for this teacher + grade
**Solution**: 
- Contact admin
- Admin creates subject assignment
- Refresh page

### **Issue 3: Marks Not Saving**
**Possible causes**:
- Marks exceed max marks (validation fails)
- Network issue
- Session expired
**Solution**: 
- Check marks are within range
- Check browser console for errors
- Re-login if needed

### **Issue 4: Can't Edit Previously Entered Marks**
**Cause**: This is actually allowed! No issue.
**Note**: Teachers CAN edit marks after submission by re-accessing the same subject.

## Best Practices for Teachers

### **Before Entering Marks:**
1. ✅ Have all student marks prepared (paper/spreadsheet)
2. ✅ Double-check marks are accurate
3. ✅ Note any absent students (enter 0 or appropriate mark)
4. ✅ Ensure good internet connection

### **While Entering Marks:**
1. ✅ Use search to find students quickly
2. ✅ Watch the live statistics for anomalies
3. ✅ Enter marks systematically (top to bottom)
4. ✅ Use Tab key to move between fields quickly
5. ✅ Check grade calculation makes sense

### **After Submitting:**
1. ✅ Wait for success message
2. ✅ Verify subject shows "✓ Completed"
3. ✅ Review statistics one more time
4. ✅ Can re-edit if mistakes found

## Admin View vs Teacher View

### **Admin Can:**
- ✅ Create exams with subjects
- ✅ Enter marks for ANY subject (not just assigned)
- ✅ View all teachers' progress
- ✅ Edit exam details
- ✅ Approve completed exams

### **Teachers Can:**
- ✅ Enter marks for ASSIGNED subjects only
- ✅ View exams for grades they teach
- ✅ Edit their own marks entries
- ✅ See completion status
- ❌ Cannot create/delete exams
- ❌ Cannot enter marks for other teachers' subjects

## Security & Permissions

### **Authorization Checks:**
```typescript
// Server-side checks on every request
1. Is user logged in? (getCurrentUser())
2. Is user role = "teacher"?
3. Does SubjectAssignment exist for:
   - This teacher
   - This subject
   - This grade
4. Only then: Allow marks entry
```

### **Data Integrity:**
- Transactions ensure all-or-nothing updates
- Marks validated before saving
- Audit trail: `marksEnteredBy` and `marksEnteredAt`
- Cannot delete marks, only update

## API Endpoints Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/marks-entry/[examId]` | GET | Get marks entry interface | Teacher/Admin |
| `/api/marks-entry/[examId]` | POST | Submit marks for subject | Teacher/Admin |
| `/list/exams` | GET | View exam list | All roles |
| `/teacher/marks-entry/[examId]` | GET | Marks entry page | Teacher |

## Summary Checklist

For a teacher to successfully enter marks:
- [ ] ✅ Exam is created by admin
- [ ] ✅ Exam status is PUBLISHED (or any status after)
- [ ] ✅ Teacher has SubjectAssignment for this grade
- [ ] ✅ Teacher logs in successfully
- [ ] ✅ Teacher navigates to Exams → Marks Entry
- [ ] ✅ Teacher selects subject
- [ ] ✅ Teacher enters marks for all students
- [ ] ✅ Teacher clicks Submit Marks
- [ ] ✅ Success message appears
- [ ] ✅ Subject shows "✓ Completed"

## Complete Example Walkthrough

```
Scenario: Mrs. Garcia enters marks for Grade 8 English

1. LOGIN
   URL: http://localhost:3000
   Login as: mrs.garcia@school.com
   Role: Teacher

2. NAVIGATE TO EXAMS
   Menu: RESOURCES → Exams
   URL: http://localhost:3000/list/exams
   
3. FIND EXAM
   List shows: "Grade 8 - Term 1 Exam 2025"
   Status: PUBLISHED
   Subjects: 6 subjects
   
4. CLICK MARKS ENTRY
   Click: Yellow pencil icon ✏️
   URL changes to: /teacher/marks-entry/15
   
5. SUBJECT SELECTION
   See subjects:
   - English (Max: 100) [Assigned to me]
   - Math (Max: 100) [Not my subject - hidden]
   
   Auto-selected: English (only one for me)
   
6. STUDENTS LIST LOADS
   See: 28 students in Grade 8
   Columns: Student | Username | Marks | Grade
   
7. ENTER MARKS
   Student 1: John Doe → Enter 85 → Grade shows "A"
   Student 2: Jane Smith → Enter 92 → Grade shows "A+"
   Student 3: Mike Johnson → Enter 78 → Grade shows "B+"
   ... continue for all 28 students
   
8. CHECK STATISTICS
   Students: 28/28
   Average: 76.5
   Highest: 98
   Lowest: 45
   
9. SUBMIT
   Click: "Submit Marks" button
   Loading: "Submitting..."
   Success: "Marks submitted successfully!"
   
10. CONFIRMATION
    Subject card now shows: "✓ Completed"
    Date shows: "11/11/2025"
    
11. DONE
    Can now:
    - View exam results
    - Edit marks if needed
    - Move to next subject (if teaching more)
```

## Conclusion

The marks entry system for teachers is:
- ✅ **User-friendly**: Simple, intuitive interface
- ✅ **Secure**: Role-based access control
- ✅ **Efficient**: Real-time validation and statistics
- ✅ **Flexible**: Can edit marks after submission
- ✅ **Automated**: Auto-creates subjects, calculates grades
- ✅ **Auditable**: Tracks who entered what and when

Teachers can focus on entering accurate marks while the system handles all the complex logic, validation, and progress tracking automatically!
