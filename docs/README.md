# School Management System - Documentation

Welcome to the School Management System documentation. This system is a comprehensive Next.js-based application for managing school operations.

## 📁 Documentation Structure

### Quick Start
- **[Quick Start Guide](guides/QUICK_START.md)** - Get up and running quickly
- **[Seed Instructions](guides/SEED_INSTRUCTIONS.md)** - Database seeding guide
- **[Test Credentials](guides/TEST_CREDENTIALS.md)** - Login credentials for testing
- **[UI Quick Reference](guides/UI_QUICK_REFERENCE.md)** - UI component reference

### Features Documentation

#### Core Systems
- **[Class Teacher System](features/CLASS_TEACHER_SYSTEM_COMPLETE.md)** - Class teacher assignment and management
- **[Subjects CRUD](features/SUBJECTS_CRUD_COMPLETE.md)** - Subject management system

#### Attendance & Tracking
- **[Student Attendance Dashboard](features/STUDENT_ATTENDANCE_DASHBOARD.md)** - Student attendance tracking
- **[Teacher Attendance Guide](features/TEACHER_ATTENDANCE_GUIDE.md)** - Teacher attendance management

#### Communication & Reporting
- **[Messaging System](features/MESSAGING_SYSTEM_DOCS.md)** - Internal messaging system
- **[Parent Meetings Guide](features/PARENT_MEETINGS_GUIDE.md)** - Parent-teacher meetings
- **[Report Card Demo](features/REPORT_CARD_DEMO_GUIDE.md)** - Student report cards

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your database (see [Seed Instructions](guides/SEED_INSTRUCTIONS.md))
4. Run development server: `npm run dev`
5. Access at `http://localhost:3000`

## 📚 Main Project Documentation

Refer to the root [README.md](../README.md) and [School_Management_System_Overview.md](../School_Management_System_Overview.md) for project overview.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL/MySQL (via Prisma)
- **Authentication**: NextAuth.js
- **Charts**: Recharts, Chart.js

## 📝 Contributing

When adding new features, please document them in the appropriate folder:
- New features → `docs/features/`
- User guides → `docs/guides/`
