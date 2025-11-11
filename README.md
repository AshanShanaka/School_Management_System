# School Management System

A comprehensive Next.js-based school management system for managing students, teachers, classes, attendance, grades, and more.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up your database
# 1. Configure your .env file with database credentials
# 2. Run Prisma migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed:test

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Documentation Hub](docs/README.md)** - Central documentation index
- **[Quick Start Guide](docs/guides/QUICK_START.md)** - Detailed setup instructions
- **[Test Credentials](docs/guides/TEST_CREDENTIALS.md)** - Login credentials for testing
- **[Features Documentation](docs/features/)** - Individual feature guides

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (configurable)
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, Lucide Icons
- **Charts**: Recharts, Chart.js

## 📁 Project Structure

```
school_management_system/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   └── ...
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── docs/                # Documentation
│   ├── features/        # Feature-specific docs
│   └── guides/          # User guides
└── ...
```

## 🔑 Features

- Student & Teacher Management
- Class & Subject Management
- Attendance Tracking
- Grade & Exam Management
- Timetable Management
- Parent-Teacher Communication
- Report Card Generation
- Messaging System
- Role-based Access Control

## 📝 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Clean up temporary files
.\cleanup.ps1
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 👨‍💻 Project Overview

For a detailed system overview, see [School_Management_System_Overview.md](School_Management_System_Overview.md)