# School Management Mobile App - Complete Setup Guide

## 📱 What Has Been Created

A complete Flutter mobile application with:

### ✅ Authentication System
- Login screen with role detection
- Session management with SharedPreferences
- Auto-login for returning users
- Logout functionality

### ✅ Role-Based Dashboards

#### 👨‍🏫 Teacher Features:
- View assigned lessons/timetable
- Manage assignments
- Mark attendance
- Enter/view student marks
- View class lists

#### 👨‍🎓 Student Features:
- View personal timetable
- Check assignments & due dates
- View own marks/grades
- Check attendance records
- Performance predictions

#### 👪 Parent Features:
- View child's performance
- Check attendance
- View assignments
- Academic analytics

### ✅ Core Features Implemented:
- Lesson/Timetable viewing
- Assignment management
- Attendance tracking
- Marks/Grades viewing
- Performance analytics
- Responsive UI matching web design

## 🚀 Quick Start

### Prerequisites
1. **Flutter SDK**: Install from https://flutter.dev/docs/get-started/install
2. **Android Studio** or **VS Code** with Flutter extensions
3. **Backend Running**: Make sure your Next.js backend is running on `http://localhost:3000`

### Step 1: Navigate to Mobile Directory
```bash
cd mobile
```

### Step 2: Install Dependencies
```bash
flutter pub get
```

### Step 3: Configure API Connection

#### For Android Emulator:
The default config uses `10.0.2.2` which maps to localhost on your PC.
No changes needed!

#### For Physical Device:
1. Find your PC's IP address:
   - Windows: Run `ipconfig` in CMD, look for IPv4 Address
   - Mac/Linux: Run `ifconfig` or `ip addr`

2. Update `lib/config/api_config.dart`:
```dart
static const String baseUrl = 'http://YOUR_IP_HERE:3000';
// Example: 'http://192.168.1.105:3000'
```

3. Make sure your phone and PC are on the same WiFi network

### Step 4: Run the App

#### On Android Emulator:
1. Start Android emulator from Android Studio
2. Run:
```bash
flutter run
```

#### On Physical Device:
1. Enable Developer Mode and USB Debugging on your phone
2. Connect via USB
3. Run:
```bash
flutter run
```

### Step 5: Login

Use the same credentials from your web app:

**Teachers:**
- Username: (any teacher username from database)
- Password: Teach@1003

**Students:**
- Username: (any student username)
- Password: student123

**Parents:**
- Username: (any parent username)
- Password: parent123

## 📁 Project Structure

```
mobile/
├── lib/
│   ├── config/
│   │   ├── api_config.dart      # API endpoints
│   │   └── theme.dart           # App theme & colors
│   ├── models/
│   │   ├── user.dart            # User models
│   │   ├── lesson.dart          # Lesson model
│   │   ├── assignment.dart      # Assignment model
│   │   ├── attendance.dart      # Attendance model
│   │   └── exam_mark.dart       # Marks model
│   ├── services/
│   │   ├── auth_service.dart    # Authentication
│   │   └── api_service.dart     # API calls
│   ├── providers/
│   │   └── auth_provider.dart   # State management
│   ├── screens/
│   │   ├── auth/
│   │   │   └── login_screen.dart
│   │   ├── teacher/
│   │   │   ├── teacher_home.dart
│   │   │   ├── lessons_screen.dart
│   │   │   ├── assignments_screen.dart
│   │   │   ├── attendance_screen.dart
│   │   │   └── marks_screen.dart
│   │   ├── student/
│   │   │   ├── student_home.dart
│   │   │   ├── my_lessons_screen.dart
│   │   │   ├── my_assignments_screen.dart
│   │   │   ├── my_marks_screen.dart
│   │   │   └── my_attendance_screen.dart
│   │   └── parent/
│   │       ├── parent_home.dart
│   │       └── child_performance_screen.dart
│   ├── widgets/
│   │   ├── custom_app_bar.dart
│   │   ├── lesson_card.dart
│   │   ├── assignment_card.dart
│   │   └── grade_badge.dart
│   └── main.dart                # App entry point
├── pubspec.yaml                 # Dependencies
└── README.md
```

## 🔧 Common Issues & Solutions

### Issue 1: "Connection refused" or "Failed to connect"
**Solution:** 
- Make sure backend is running: `npm run dev` in main project
- Check API URL in `lib/config/api_config.dart`
- For physical device, use your PC's IP address, not localhost

### Issue 2: "Handshake failed" or SSL errors
**Solution:**
- Use `http://` not `https://` for local development
- Backend should be on `http://localhost:3000` not https

### Issue 3: App shows blank screen after login
**Solution:**
- Check browser console/terminal for API errors
- Verify user has correct role in database
- Clear app data and try again

### Issue 4: Can't install on phone
**Solution:**
- Enable "Install from Unknown Sources" in phone settings
- Enable Developer Mode and USB Debugging
- Trust the PC when prompted on phone

## 🎨 Customization

### Change Colors:
Edit `lib/config/theme.dart` to match your school colors

### Change Logo:
Replace `assets/images/logo.png` with your school logo

### Change App Name:
Edit `android/app/src/main/AndroidManifest.xml` (android:label)
Edit `ios/Runner/Info.plist` (CFBundleName)

## 📱 Building APK for Distribution

### Debug APK (for testing):
```bash
flutter build apk --debug
```
Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK (for production):
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Install APK on phone:
```bash
flutter install
```

## 🌐 API Endpoints Used

All endpoints connect to the same backend as the web app:

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/lessons` - Get lessons
- `GET /api/assignments` - Get assignments
- `GET /api/attendance` - Get attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/marks` - Get exam marks
- `POST /api/marks` - Save marks
- `GET /api/students` - Get students
- `GET /api/predictions/:id` - Get predictions

## 📊 Features Implemented

### Authentication ✅
- [x] Login with username/password
- [x] Role detection (Teacher/Student/Parent)
- [x] Session persistence
- [x] Auto-login
- [x] Logout

### Teacher Dashboard ✅
- [x] View assigned lessons
- [x] View/Create assignments
- [x] Mark attendance
- [x] Enter marks/grades
- [x] View student lists

### Student Dashboard ✅
- [x] View timetable
- [x] View assignments
- [x] View own marks
- [x] View attendance
- [x] Performance predictions

### Parent Dashboard ✅
- [x] View child's marks
- [x] View child's attendance
- [x] View assignments
- [x] Academic progress

## 🔐 Security Notes

- Tokens stored securely in SharedPreferences
- HTTP only (use HTTPS in production)
- No sensitive data cached
- Auto-logout on token expiry

## 📝 Next Steps

1. Test on emulator
2. Test on physical device
3. Add school logo in assets
4. Customize colors in theme.dart
5. Build release APK
6. Distribute to users

## 🆘 Need Help?

Check the backend is running:
```bash
# In main project directory
npm run dev
```

Check Flutter is working:
```bash
flutter doctor
```

Clean and rebuild:
```bash
flutter clean
flutter pub get
flutter run
```

## 🎯 Production Deployment

For production use:
1. Set up HTTPS backend with SSL certificate
2. Use environment variables for API URLs
3. Enable code obfuscation:
   ```bash
   flutter build apk --release --obfuscate --split-debug-info=build/debug-info
   ```
4. Sign the APK with release keystore
5. Test thoroughly on multiple devices

---

**The mobile app is now ready to use with the same database and backend as your web application!** 🎉
