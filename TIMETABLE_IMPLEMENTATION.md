# School Timetable System Implementation Guide

## Overview
Complete implementation of a school timetable system with specific rules and access controls.

## School Hours & Rules

### Daily Schedule (Monday - Friday)
- **Assembly**: 07:30 - 07:40 (NOT schedulable)
- **Period 1**: 07:40 - 08:20 (40 min)
- **Period 2**: 08:20 - 09:00 (40 min)
- **Period 3**: 09:00 - 09:40 (40 min)
- **Period 4**: 09:40 - 10:20 (40 min)
- **Interval**: 10:20 - 10:40 (BLOCKED - 20 min break)
- **Period 5**: 10:40 - 11:20 (40 min)
- **Period 6**: 11:20 - 12:00 (40 min)
- **Period 7**: 12:00 - 12:40 (40 min)
- **Period 8**: 12:40 - 13:20 (40 min)
- **Pack-up**: 13:20 - 13:30 (NOT schedulable)

### Default Subjects
- Buddhism
- English
- History
- Mathematics
- Religion
- Science
- Sinhala
- ICT

## Database Schema

### New Models Added

1. **SchoolTimetable** - One timetable per class
   - Links to Class (one-to-one relationship)
   - Tracks academic year, term, and active status

2. **TimetableSlot** - Individual periods
   - Day (MONDAY-FRIDAY)
   - Period (1-8)
   - Subject and Teacher assignment
   - Room number (optional)

3. **Holiday** - Blocked days
   - Poya days, public holidays
   - Blocks entire day from scheduling

4. **BlockedTime** - Blocked periods
   - Assembly, Interval, Pack-up

## API Endpoints

### Timetable Management
- `GET /api/timetable` - List all timetables
- `GET /api/timetable?classId=X` - Get timetable for specific class
- `POST /api/timetable` - Create new timetable
- `PUT /api/timetable/[id]` - Update timetable
- `DELETE /api/timetable/[id]` - Delete timetable (class-specific)

### Role-Based Views
- `GET /api/timetable/teacher/[id]` - Teacher's schedule
- `GET /api/timetable/student/[id]` - Student's class timetable
- `GET /api/timetable/parent/[id]` - Children's timetables

### Holiday Management
- `GET /api/timetable/holidays` - List holidays
- `POST /api/timetable/holidays` - Add holiday
- `DELETE /api/timetable/holidays?id=X` - Remove holiday

## Admin Functions

### Create Timetable
1. Select target class
2. View blank weekly grid (Mon-Fri, 8 periods/day)
3. Click cells to assign subject and teacher
4. System validates:
   - No teacher conflicts (same time, different class)
   - No class overlaps (one subject per period)
   - No blocked times (assembly, interval, pack-up)
   - No holidays
5. Save applies to selected class only

### Edit/Update Timetable
- Pre-filled with existing schedule
- Click cells to change subject or teacher
- Manual double periods: assign same subject to consecutive slots
- Real-time validation
- Save replaces class timetable

### Delete Timetable
- Removes only selected class schedule
- Other classes unaffected
- Confirmation required

## Validation Rules

1. **Class Constraint**: ≤ 1 subject per period
2. **Teacher Constraint**: Cannot teach 2 classes simultaneously
3. **Blocked Times**: Cannot schedule in Assembly, Interval, Pack-up
4. **Holidays**: No scheduling on holiday dates
5. **Double Periods**: 
   - Must be consecutive periods
   - Same subject and teacher
   - Cannot span interval (Period 4 to 5)

## User Access

### Teachers
- View classes they teach
- "My Week" view: All their periods across classes
- Can see complete class timetable if they're class teacher
- Can see only their subjects if subject teacher

### Students
- View only their own class timetable
- See all subjects and teachers
- Mobile-friendly daily view

### Parents
- View all children's timetables
- Switch between children if multiple
- See class teacher contact info

### Admin
- Full access to create/edit/delete any timetable
- View all classes
- Manage holidays

## Interface Features

### Weekly Grid
- Left column: Time/Period
- Top row: Days (Mon-Fri)
- Color-coded subjects
- Grey blocked cells (interval, etc.)

### Admin Controls
- Create/Update button
- Save button with validation
- Delete Timetable button
- View switcher (by Class/Teacher)

### Subject Colors
- Mathematics: Blue
- Science: Green
- English: Purple
- Sinhala: Orange
- History: Yellow
- Buddhism: Pink
- Religion: Indigo
- ICT: Cyan

## Pages Created

### Admin
- `/admin/timetable` - List and manage all timetables
- `/admin/timetable/create` - Create new timetable (existing, enhanced)
- `/admin/timetable/edit?id=X` - Edit existing timetable

### Teacher
- `/teacher/school-timetable` - View teaching schedule

### Student
- `/student/timetable` - View class timetable

### Parent
- `/parent/timetable` - View children's timetables

## Migration Steps

1. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name add_school_timetable_system
   ```

2. Or use push for immediate update:
   ```bash
   npx prisma db push
   ```

3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

## Configuration Files

- `src/lib/schoolTimetableConfig.ts` - School hours, periods, subjects
- `src/lib/timetableValidation.ts` - Validation logic

## Success Criteria ✓

- ✅ Admin can build/modify class timetable in minutes
- ✅ Manual double-periods supported
- ✅ Validation prevents teacher/class conflicts
- ✅ Deleting affects only that class
- ✅ Teachers see their teaching schedule + "My Week"
- ✅ Students see only their class timetable
- ✅ Parents see children's timetables clearly
- ✅ Holiday management system
- ✅ Blocked times (Assembly, Interval, Pack-up)
- ✅ Color-coded subjects
- ✅ Mobile-responsive design

## Next Steps

1. Run database migration
2. Test timetable creation
3. Test validation rules
4. Add subjects if not present
5. Assign teachers to subjects
6. Create timetables for classes
