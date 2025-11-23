# 📚 Marks Entry System - Complete Guide

## ✅ System Status: READY

All components are properly configured:
- ✅ 10 teachers with subjects assigned
- ✅ 3 exams (Term 1, 2, 3) in **PUBLISHED** status
- ✅ 6 subjects per exam with ExamSubjects created
- ✅ 119 students per exam ready for marks entry
- ❌ **NO marks entered yet** - Ready for subject teachers!

---

## 👥 Teacher Login Details

### Class Teachers (Can enter marks for their assigned subject)

| Teacher | Username | Subject | Class |
|---------|----------|---------|-------|
| Ravi Perera | `raviperera` | Mathematics | 11-A |
| Kamala Senanayake | `kamalasenanayak` | Science | 11-B |
| Suresh Bandara | `sureshbandara` | Sinhala | 11-C |
| Nirmala Jayawardena | `nirmalajayaward` | English | 11-D |

### Subject Teachers (Only teach subjects, no class teacher duties)

| Teacher | Username | Subject |
|---------|----------|---------|
| Chamari Gunarathna | `chamarigunarath` | Science |
| Deepika Rajapaksha | `deepikarajapaks` | English |
| Dilan Fernando | `dilanfernando` | History |
| Mahesh Wijesinghe | `maheshwijesingh` | History |
| Sumudu Weerasinghe | `sumuduweerasing` | Buddhism |
| Thilina Silva | `thilinasilva` | English |

---

## 📝 How to Enter Marks (Step by Step)

### For Subject Teachers

1. **Login**
   - Go to: `http://localhost:3000`
   - Username: One of the above (e.g., `raviperera`)
   - Password: `password` (default)

2. **Navigate to Marks Entry**
   - From dashboard menu, click **"Marks Entry"**
   - OR go directly to: `/teacher/marks-entry`

3. **You will see:**
   - 📊 Statistics dashboard showing:
     - Total exams assigned
     - Completed vs Pending subjects
     - Progress percentage
   - 📚 List of all your assigned exams:
     - Term 1 (Year 2025) - Your Subject
     - Term 2 (Year 2025) - Your Subject
     - Term 3 (Year 2025) - Your Subject

4. **Each Exam Card Shows:**
   - 🟡 **Yellow/Orange Badge**: "Marks Entry Pending" (if not entered)
   - 🟢 **Green Badge**: "Marks Entered" (if already submitted)
   - 📖 Subject name
   - 🎓 Grade & Term info
   - 📅 Exam status

5. **Click "Enter Marks" Button**
   - This takes you to: `/teacher/marks-entry/[examId]`
   - You'll see a form with all students listed

6. **Enter Marks for Each Student**
   - Each row shows: Student name, ID number, input field
   - Enter marks (0-100)
   - System validates automatically
   - Can add notes/comments

7. **Submit Marks**
   - Click "Submit All Marks"
   - Marks are saved
   - `ExamSubject.marksEntered` = `true`
   - `ExamSubject.marksEnteredAt` = current timestamp

8. **Edit Marks Later**
   - Return to the same page
   - Button changes to "Update Marks"
   - Can modify any student's marks
   - Re-submit to save changes

---

## 🔍 CRUD Operations Available

### ✅ **CREATE** (Enter New Marks)
- When `marksEntered = false`
- Button shows: "Enter Marks"
- All fields are empty
- Submit creates new Result records

### 📖 **READ** (View Existing Marks)
- When `marksEntered = true`
- Page loads with existing marks pre-filled
- Can see who entered marks and when
- Read-only view available via "View Details"

### ✏️ **UPDATE** (Edit Existing Marks)
- When `marksEntered = true`
- Button shows: "Update Marks"
- Existing marks are loaded in form
- Can modify any field
- Re-submit to update

### 🗑️ **DELETE** (Remove Marks)
- Admin can clear marks if needed
- Teachers can edit to 0 or null
- System tracks all changes

---

## 📊 Current Exam Structure

### Term 1 (Grade 11 - Term 1)
- **Status**: PUBLISHED
- **Year**: 2025
- **Subjects**: 6 (Mathematics, Science, English, Sinhala, History, Buddhism)
- **Students**: 119
- **Marks Entered**: ❌ No (0/6 subjects)

### Term 2 (Grade 11- Term 2)
- **Status**: PUBLISHED
- **Year**: 2025
- **Subjects**: 6 (Mathematics, Science, English, Sinhala, History, Buddhism)
- **Students**: 119
- **Marks Entered**: ❌ No (0/6 subjects)

### Term 3 (Grade 11 - Term 3)
- **Status**: PUBLISHED
- **Year**: 2025
- **Subjects**: 6 (Mathematics, Science, English, Sinhala, History, Buddhism)
- **Students**: 119
- **Marks Entered**: ❌ No (0/6 subjects)

---

## 🎯 Example: Login as Ravi Perera (Mathematics Teacher)

1. **Login**: `raviperera` / `password`
2. **Go to**: `/teacher/marks-entry`
3. **You'll see**: 3 exam cards
   - Grade 11 - Term 1 → Mathematics → "Marks Entry Pending"
   - Grade 11- Term 2 → Mathematics → "Marks Entry Pending"
   - Grade 11 - Term 3 → Mathematics → "Marks Entry Pending"
4. **Click**: "Enter Marks" on any exam
5. **See**: List of 119 students (all from Grade 11)
6. **Enter**: Marks for each student (0-100)
7. **Submit**: Click "Submit All Marks"
8. **Result**: Status changes to "Marks Entered" ✅

---

## 🔐 Access Control

### What Teachers Can See:
- ✅ Only THEIR assigned subjects
- ✅ Only Grade 11 exams (current year)
- ✅ Only exams in PUBLISHED/MARKS_ENTRY/CLASS_REVIEW status
- ❌ Cannot see other teachers' subjects
- ❌ Cannot see historical grades (9, 10)
- ❌ Cannot see DRAFT exams

### What Admins Can See:
- ✅ ALL exams for all grades
- ✅ All subjects and all teachers
- ✅ Complete marks overview
- ✅ Can edit any marks
- ✅ Can change exam status

---

## 🐛 Troubleshooting

### "No Assigned Exams" Message?

**Possible Reasons:**
1. ❌ Teacher not assigned to any subject
   - **Fix**: Run `npx tsx scripts/check-teacher-subject-assignments.ts`
2. ❌ Exams not in PUBLISHED status
   - **Fix**: Admin must publish exams
3. ❌ No ExamSubjects created
   - **Fix**: Admin must create exam with subjects
4. ❌ Teacher subject doesn't match exam subjects
   - **Fix**: Verify teacher teaches that subject

### "Marks Entry Pending" Forever?

**This is NORMAL!** It means marks haven't been entered yet.
- Click "Enter Marks" button to start
- Fill in the form
- Submit to mark as complete

### Can't See Exams?

**Check:**
1. Logged in as teacher (not admin/student)?
2. Teacher has subjects assigned?
3. Exams are for Grade 11?
4. Exams are PUBLISHED?

**Run diagnostic:**
```powershell
npx tsx scripts/check-teacher-subject-assignments.ts
npx tsx scripts/check-existing-marks.ts
```

---

## 📈 Progress Tracking

The system automatically tracks:
- ✅ How many subjects completed per exam
- ✅ Overall completion percentage
- ✅ Which teachers entered marks
- ✅ When marks were entered/updated
- ✅ Number of students with marks

---

## 🚀 Quick Start

1. **Login as a teacher** (any from the table above)
2. **Go to Marks Entry** from menu
3. **Click "Enter Marks"** on any exam
4. **Fill in marks** for all students
5. **Submit** to mark as complete
6. **Done!** Status updates automatically

---

## 📝 Notes

- Default password for all users: `password`
- Marks range: 0-100
- System validates input automatically
- Can edit marks multiple times
- All changes are tracked
- Teachers can only see their subjects
- Admins can see everything

---

**Status**: ✅ System Ready for Marks Entry
**Last Updated**: November 22, 2025
**Total Teachers**: 10
**Total Exams**: 3 (Term 1, 2, 3)
**Total Subjects**: 6
**Marks Entered**: 0/18 (0%)

**Next Step**: Login as a teacher and start entering marks! 🎓
