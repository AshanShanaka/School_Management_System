import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/teacher/teacher_main.dart';
import 'screens/student/student_main.dart';
import 'screens/parent/parent_main.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(
        title: 'School Management System',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    // Force clear any cached auth data on app start
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!_initialized) {
        _initialized = true;
        final authProvider = context.read<AuthProvider>();
        // Always clear on app start to prevent cached user issues
        await authProvider.clearAuthState();
        print('🔐 App started - auth state cleared, showing fresh login');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        print(
            '🎯 AuthWrapper build - isLoading: ${authProvider.isLoading}, isAuth: ${authProvider.isAuthenticated}, user: ${authProvider.user?.name}');

        // Show loading ONLY while checking initial status AND not authenticated
        if (authProvider.isLoading && !authProvider.isAuthenticated) {
          print('🎯 Showing loading spinner');
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // If not logged in, show login screen
        if (!authProvider.isAuthenticated || authProvider.user == null) {
          print(
              '🎯 Showing login screen - auth: ${authProvider.isAuthenticated}, user: ${authProvider.user}');
          return const LoginScreen();
        }

        // Route based on role - all authenticated users go to teacher main for now
        final role = authProvider.user!.role.toLowerCase();
        print('🎯 Authenticated user role: $role');

        // Route based on user role
        switch (role) {
          case 'teacher':
            print('🎯 Routing to TeacherMain');
            return TeacherMain(
                key: ValueKey('teacher_${authProvider.user!.id}'));
          case 'student':
            print('🎯 Routing to StudentMain');
            return StudentMain(
                key: ValueKey('student_${authProvider.user!.id}'));
          case 'parent':
            print('🎯 Routing to ParentMain');
            return ParentMain(key: ValueKey('parent_${authProvider.user!.id}'));
          default:
            print('🎯 Unknown role: $role - showing login');
            return const LoginScreen();
        }
      },
    );
  }
}
