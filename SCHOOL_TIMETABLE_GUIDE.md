# School Timetable System - Implementation Guide

## Overview
A comprehensive school timetable management system that allows admins to create, edit, and manage class timetables with proper validation and conflict detection.

## Features Implemented

### 1. School Hours Configuration
- **Assembly**: 07:30-07:40 (not schedulable)
- **8 Periods** (40 minutes each):
  - Period 1: 07:40-08:20
  - Period 2: 08:20-09:00
  - Period 3: 09:00-09:40
  - Period 4: 09:40-10:20
  - **Interval**: 10:20-10:40 (blocked)
  - Period 5: 10:40-11:20
  - Period 6: 11:20-12:00
  - Period 7: 12:00-12:40
  - Period 8: 12:40-13:20
- **Pack-up**: 13:20-13:30 (not schedulable)
- **Days**: Monday to Friday

### 2. Database Schema

#### SchoolTimetable Model
```prisma
model SchoolTimetable {
  id            String              @id @default(cuid())
  classId       Int                 @unique
  academicYear  String
  term          String?
  isActive      Boolean             @default(true)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  createdBy     String?
  
  class         Class               @relation(...)
  slots         TimetableSlot[]
}
```

#### TimetableSlot Model
```prisma
model TimetableSlot {
  id            String              @id @default(cuid())
  timetableId   String
  day           TimetableDay
  period        Int                 // 1-8
  startTime     String
  endTime       String
  slotType      SlotType            @default(REGULAR)
  subjectId     Int?
  teacherId     String?
  roomNumber    String?
  notes         String?
}
```

#### Holiday Model
```prisma
model Holiday {
  id            String              @id @default(cuid())
  name          String
  date          DateTime
  type          HolidayType         @default(PUBLIC)
  description   String?
  isRecurring   Boolean             @default(false)
}
```

### 3. Admin Functions

#### Create Timetable
- **Route**: `/admin/timetable/create`
- **API**: `POST /api/timetable`
- **Features**:
  - Select target class
  - Interactive weekly grid (Mon-Fri, 8 periods/day)
  - Click cells to assign subject and teacher
  - Real-time validation
  - Saves timetable for that class only

#### Edit/Update Timetable
- **Route**: `/admin/timetable/edit?id={timetableId}`
- **API**: `PUT /api/timetable/[id]`
- **Features**:
  - Pre-filled with existing data
  - Modify any cell
  - Support for double periods (manual)
  - Validation prevents conflicts

#### Delete Timetable
- **API**: `DELETE /api/timetable/[id]`
- **Features**:
  - Removes class timetable only
  - Other classes unaffected
  - Confirmation dialog

#### View All Timetables
- **Route**: `/admin/timetable`
- **Features**:
  - List all class timetables
  - Statistics dashboard
  - Quick actions (view, edit, delete, activate/deactivate)

### 4. Validation Rules

#### Implemented Validations
1. **Class Constraints**: ≤ 1 subject per period per class
2. **Teacher Conflicts**: Teacher cannot be in 2 classes simultaneously
3. **Blocked Times**: No scheduling in Assembly, Interval, or Pack-up
4. **Holiday Validation**: Days marked as holidays are fully blocked
5. **Double Periods**: Must be consecutive, same subject/teacher, cannot span interval

#### Validation Service
Location: `src/lib/timetableValidation.ts`

Functions:
- `validateTimetableSlot()` - Validates single slot
- `validateCompleteTimetable()` - Validates entire timetable
- `validateDoublePeriod()` - Validates double period rules
- `getTeacherSchedule()` - Checks teacher availability
- `getTeacherConflicts()` - Finds teacher conflicts

### 5. Viewing Access

#### Teachers
- **Route**: `/teacher/school-timetable`
- **API**: `GET /api/timetable/teacher/[id]`
- **Features**:
  - View by Class: See all classes they teach
  - My Week View: Personal weekly schedule
  - Highlights their periods
  - Class teacher sees complete class timetable

#### Students
- **Route**: `/student/timetable`
- **API**: `GET /api/timetable/student/[id]`
- **Features**:
  - View only their own class timetable
  - Desktop: Full weekly grid
  - Mobile: Day-by-day view
  - Shows teachers and room numbers

#### Parents
- **Route**: `/parent/school-timetable`
- **API**: `GET /api/timetable/parent/[id]`
- **Features**:
  - View all children's timetables
  - Switch between children
  - See class teacher contact info
  - Weekly summary

### 6. Interface Design

#### Weekly Grid
- Left column: Time/Period
- Top row: Monday to Friday
- Cells: Subject name, code, teacher
- Color-coded by subject
- Blocked cells (Assembly, Interval, Pack-up) are greyed out

#### Subject Colors
```typescript
Mathematics: Blue
Science: Green
English: Purple
Sinhala: Orange
History: Yellow
Buddhism: Pink
Religion: Indigo
ICT: Cyan
```

### 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timetable?classId={id}` | Get timetable for class |
| GET | `/api/timetable/{id}` | Get specific timetable |
| POST | `/api/timetable` | Create new timetable |
| PUT | `/api/timetable/{id}` | Update timetable |
| DELETE | `/api/timetable/{id}` | Delete timetable |
| GET | `/api/timetable/teacher/{id}` | Teacher's timetables |
| GET | `/api/timetable/student/{id}` | Student's timetable |
| GET | `/api/timetable/parent/{id}` | Parent's children's timetables |
| GET | `/api/timetable/holidays` | List holidays |
| POST | `/api/timetable/holidays` | Create holiday |
| DELETE | `/api/timetable/holidays?id={id}` | Delete holiday |

### 8. Configuration

#### Main Config File
Location: `src/lib/schoolTimetableConfig.ts`

Constants:
- `SCHOOL_HOURS` - School timing
- `PERIOD_DURATION` - Period length (40 min)
- `SCHOOL_DAYS` - Monday to Friday
- `PERIODS` - All 8 periods with times
- `BLOCKED_TIMES` - Assembly, Interval, Pack-up
- `DEFAULT_SUBJECTS` - Subject list with codes
- `SUBJECT_COLORS` - UI color mapping

## Setup Instructions

### 1. Run Database Migration

```powershell
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_school_timetable_system

# Or push schema to database
npx prisma db push
```

### 2. Seed Initial Data (Optional)

Create holidays, blocked times, etc.:

```typescript
// In prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Add blocked times
  await prisma.blockedTime.createMany({
    data: [
      {
        name: "Assembly",
        startTime: "07:30",
        endTime: "07:40",
        days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        description: "Morning assembly"
      },
      // ... more blocked times
    ]
  });

  // Add holidays
  await prisma.holiday.createMany({
    data: [
      {
        name: "Vesak Full Moon Poya Day",
        date: new Date("2025-05-12"),
        type: "POYA",
      },
      // ... more holidays
    ]
  });
}

main();
```

Run seed:
```powershell
npx prisma db seed
```

### 3. Access the System

1. **Admin**: Login and navigate to `/admin/timetable`
2. **Teacher**: Navigate to `/teacher/school-timetable`
3. **Student**: Navigate to `/student/timetable`
4. **Parent**: Navigate to `/parent/school-timetable`

## Usage Workflow

### Creating a Timetable (Admin)

1. Go to `/admin/timetable`
2. Click "Create Timetable"
3. Select class from dropdown
4. Enter academic year (e.g., "2025/2026")
5. Enter term (optional, e.g., "Term 1")
6. Click any cell in the grid
7. Select subject from dropdown
8. Select teacher from dropdown
9. Optionally add room number
10. Click "Assign"
11. Repeat for all periods
12. Click "Save Timetable"

### Editing a Timetable

1. From timetable list, click "Edit" on desired timetable
2. Click any cell to modify
3. Change subject, teacher, or room
4. Click "Assign" to update
5. Click "Save Timetable" when done

### Creating Double Periods

1. Assign same subject and teacher to consecutive periods
2. System validates:
   - Same day
   - Consecutive period numbers
   - Same subject and teacher
   - Not spanning interval (Period 4 to 5)

### Managing Holidays

1. Admin creates holiday via API or admin interface
2. System automatically blocks entire day
3. Cannot schedule any classes on holidays

## Validation Examples

### Valid Timetable
```
Monday Period 1: Mathematics - Teacher A
Monday Period 2: English - Teacher B
Tuesday Period 1: Science - Teacher C
```

### Invalid - Teacher Conflict
```
Monday Period 1: Mathematics - Teacher A (Class 10A)
Monday Period 1: Science - Teacher A (Class 10B)  ❌ Teacher A in two places
```

### Invalid - Blocked Time
```
Assembly Time (07:30-07:40): Mathematics  ❌ Cannot schedule during assembly
```

### Invalid - Double Period Spanning Interval
```
Period 4 (09:40-10:20): Mathematics
Interval (10:20-10:40): BLOCKED
Period 5 (10:40-11:20): Mathematics  ❌ Cannot span interval
```

### Valid Double Period
```
Period 6 (11:20-12:00): Science Lab
Period 7 (12:00-12:40): Science Lab  ✅ Consecutive, same subject/teacher
```

## File Structure

```
src/
├── lib/
│   ├── schoolTimetableConfig.ts      # Constants and configuration
│   └── timetableValidation.ts        # Validation logic
├── app/
│   ├── api/
│   │   └── timetable/
│   │       ├── route.ts               # Main CRUD endpoints
│   │       ├── [id]/route.ts          # Update/Delete
│   │       ├── teacher/[id]/route.ts  # Teacher view
│   │       ├── student/[id]/route.ts  # Student view
│   │       ├── parent/[id]/route.ts   # Parent view
│   │       └── holidays/route.ts      # Holiday management
│   └── (dashboard)/
│       ├── admin/
│       │   └── timetable/
│       │       ├── page.tsx           # List all timetables
│       │       ├── create/page.tsx    # Create timetable
│       │       └── edit/page.tsx      # Edit timetable
│       ├── teacher/
│       │   └── school-timetable/page.tsx
│       ├── student/
│       │   └── timetable/page.tsx
│       └── parent/
│           └── school-timetable/page.tsx
└── prisma/
    └── schema.prisma                  # Database schema
```

## Success Criteria ✅

1. ✅ Admin can build/modify class timetable in minutes
2. ✅ Manual double-periods supported
3. ✅ Validation prevents teacher/class conflicts
4. ✅ Blocked times (Assembly, Interval, Pack-up) enforced
5. ✅ Holiday system blocks entire days
6. ✅ Deleting affects only selected class
7. ✅ Teachers see their classes + "My Week" view
8. ✅ Students see only their class timetable
9. ✅ Parents see their children's timetables
10. ✅ Subject cells color-coded
11. ✅ Weekly grid with clear time display

## Future Enhancements

1. **Automatic Timetable Generation**: AI-powered timetable creation
2. **Conflict Dashboard**: Visual display of all conflicts
3. **Print/Export**: PDF export of timetables
4. **Mobile App**: Native mobile application
5. **Notifications**: Notify teachers/students of changes
6. **Room Management**: Track room availability
7. **Substitute Teachers**: Handle teacher absences
8. **Period Swapping**: Quick swap functionality
9. **Analytics**: Usage statistics and patterns
10. **Multi-Language**: Support for other languages

## Troubleshooting

### Migration Issues
```powershell
# Reset database (development only)
npx prisma migrate reset

# Force push schema
npx prisma db push --force-reset
```

### TypeScript Errors
```powershell
# Regenerate Prisma Client
npx prisma generate

# Check for TypeScript errors
npm run type-check
```

### API Issues
- Check `/api/auth/me` returns correct user data
- Verify user roles (admin, teacher, student, parent)
- Check database connections
- Review server logs

## Support

For issues or questions:
1. Check validation errors in API responses
2. Review browser console for client-side errors
3. Check server logs for backend issues
4. Verify database schema matches Prisma schema
5. Ensure all dependencies are installed

---

## Summary

This implementation provides a complete school timetable management system with:
- Easy-to-use admin interface
- Comprehensive validation
- Role-based viewing
- Manual double-period support
- Holiday management
- Teacher conflict prevention
- Clean, responsive UI

The system is production-ready and meets all specified requirements.
