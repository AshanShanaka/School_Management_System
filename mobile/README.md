# School Management System - Mobile App

A Flutter mobile application for teachers, students, and parents to access the school management system.

## Features

### For Teachers
- View assigned classes and subjects
- Manage lessons and assignments
- Take attendance
- Enter and view marks/grades
- View student performance analytics

### For Students
- View timetable and lessons
- Check assignments and due dates
- View own marks and grades
- View attendance records
- Performance predictions

### For Parents
- View child's academic performance
- Check attendance records
- View assignments and progress
- Performance analytics

## Setup

### Prerequisites
- Flutter SDK (>=3.0.0)
- Dart SDK (>=3.0.0)
- Android Studio / Xcode for emulators
- Access to the backend API

### Installation

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Configure API endpoint in `lib/config/api_config.dart`

4. Run the app:
```bash
flutter run
```

## Project Structure
```
lib/
├── config/          # API and app configuration
├── models/          # Data models
├── services/        # API services
├── providers/       # State management
├── screens/         # UI screens
│   ├── auth/        # Login screens
│   ├── teacher/     # Teacher dashboards
│   ├── student/     # Student dashboards
│   └── parent/      # Parent dashboards
├── widgets/         # Reusable widgets
└── main.dart        # App entry point
```

## Backend Connection
This app connects to the same Next.js backend at `http://localhost:3000/api`

Make sure the backend is running before starting the mobile app.

## Building for Production

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```
