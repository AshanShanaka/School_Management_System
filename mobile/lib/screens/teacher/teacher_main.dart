import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';
import '../../models/user.dart';
import 'teacher_dashboard.dart';
import 'teacher_students.dart';
import 'teacher_parents.dart';
import 'teacher_lessons.dart';
import 'teacher_timetable.dart';

class TeacherMain extends StatefulWidget {
  const TeacherMain({super.key});

  @override
  State<TeacherMain> createState() => _TeacherMainState();
}

class _TeacherMainState extends State<TeacherMain> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const TeacherDashboard(),
    const TeacherStudents(),
    const TeacherParents(),
    const TeacherLessons(),
    const TeacherTimetable(),
  ];

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final teacher = authProvider.user as Teacher?;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Welcome, ${teacher?.name ?? "Teacher"}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.teacher,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications - Coming Soon')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
            },
          ),
        ],
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.teacher,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Students',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.family_restroom),
            label: 'Parents',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.book),
            label: 'Lessons',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Timetable',
          ),
        ],
      ),
    );
  }
}
