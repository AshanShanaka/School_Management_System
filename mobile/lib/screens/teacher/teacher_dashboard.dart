import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../models/user.dart';

class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final userDataString = prefs.getString('user_data');

      print('📊 [TeacherDashboard] Loading dashboard data...');
      print('📊 [TeacherDashboard] Token: $token');
      print('📊 [TeacherDashboard] User data: $userDataString');

      try {
        final response = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/api/teacher/dashboard'),
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'auth-token=$token',
          },
        ).timeout(const Duration(seconds: 8));

        if (response.statusCode == 200) {
          print('✅ [TeacherDashboard] API data loaded successfully');
          setState(() {
            _data = jsonDecode(response.body);
            _isLoading = false;
          });
          return;
        } else {
          print(
              '⚠️ [TeacherDashboard] API returned status ${response.statusCode}');
        }
      } catch (e) {
        print('⚠️ [TeacherDashboard] API Error: $e');
      }

      // Use mock data as fallback with actual logged-in user
      print('📝 [TeacherDashboard] Using mock data with logged-in user info');
      setState(() {
        _data = _getMockData(context);
        _isLoading = false;
      });
    } catch (e) {
      print('❌ [TeacherDashboard] Error: $e');
      setState(() {
        _data = _getMockData(context);
        _isLoading = false;
      });
    }
  }

  Map<String, dynamic> _getMockData(BuildContext context) {
    // Get the actual logged-in user
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final teacher = authProvider.user as Teacher?;

    return {
      'teacher': {
        'name': teacher?.name ?? 'Teacher',
        'surname': teacher?.surname ?? '',
        'email': teacher?.email ?? 'teacher@school.com',
        'subject': 'Mathematics',
      },
      'stats': {
        'totalStudents': 45,
        'classesTeached': 3,
        'attendanceRate': 92.5,
        'averageMarks': 78.0,
      },
      'classes': [
        {
          'id': 1,
          'name': 'Grade 10A',
          'grade': {'level': 10},
          'studentCount': 15
        },
        {
          'id': 2,
          'name': 'Grade 10B',
          'grade': {'level': 10},
          'studentCount': 15
        },
        {
          'id': 3,
          'name': 'Grade 11A',
          'grade': {'level': 11},
          'studentCount': 15
        },
      ],
      'todayLessons': [
        {
          'id': 1,
          'startTime': '09:00',
          'endTime': '10:00',
          'subject': {'name': 'Mathematics'},
          'class': {'name': 'Grade 10A'},
          'room': 'Room 101',
        },
        {
          'id': 2,
          'startTime': '10:15',
          'endTime': '11:15',
          'subject': {'name': 'Mathematics'},
          'class': {'name': 'Grade 10B'},
          'room': 'Room 102',
        },
      ],
    };
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_data == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text('Failed to load dashboard'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final teacher = _data!['teacher'];
    final stats = _data!['stats'];
    final classes = _data!['classes'] ?? [];
    final todayLessons = _data!['todayLessons'] ?? [];

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome Card
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF16A34A), Color(0xFF2563EB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.person, color: Colors.white, size: 32),
                    SizedBox(width: 12),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Welcome, ${teacher['name']} ${teacher['surname']}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Teacher Dashboard',
                  style: TextStyle(
                    color: Color(0xFFD1FAE5),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Statistics Cards - 5 Cards
          const Text(
            'Overview',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),

          // Row 1: Classes & Students
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Classes',
                  '${classes.length}',
                  Icons.class_,
                  const Color(0xFF2563EB),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Students',
                  '${stats['totalStudents'] ?? 0}',
                  Icons.people,
                  const Color(0xFF16A34A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Row 2: Subjects & Supervised Classes & Lessons
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Subjects',
                  '1',
                  Icons.book,
                  const Color(0xFF9333EA),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Supervised',
                  '${stats['supervisedClasses'] ?? 0}',
                  Icons.supervisor_account,
                  const Color(0xFFF59E0B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Single row for Lessons
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Lessons',
                  '${todayLessons.length}',
                  Icons.schedule,
                  const Color(0xFF6366F1),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(child: Container()), // Empty space for balance
            ],
          ),
          const SizedBox(height: 24),

          // Quick Actions
          const Text(
            'Quick Actions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              _buildQuickActionCard(
                'Take Attendance',
                'Mark student attendance',
                Icons.check_circle,
                Colors.green,
                () {
                  // Navigate to attendance screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Attendance feature coming soon')),
                  );
                },
              ),
              _buildQuickActionCard(
                'View Timetable',
                'Check your schedule',
                Icons.calendar_today,
                Colors.blue,
                () {
                  // Navigate to timetable screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Timetable feature coming soon')),
                  );
                },
              ),
              _buildQuickActionCard(
                'Manage Assignments',
                'Create and grade assignments',
                Icons.assignment,
                Colors.purple,
                () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Assignments feature coming soon')),
                  );
                },
              ),
              _buildQuickActionCard(
                'Exam Management',
                'Schedule and manage exams',
                Icons.quiz,
                Colors.red,
                () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Exam management coming soon')),
                  );
                },
              ),
              _buildQuickActionCard(
                'Messages',
                'Communicate with students',
                Icons.message,
                Colors.indigo,
                () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Messages feature coming soon')),
                  );
                },
              ),
              Container(), // Empty space for odd number of items
            ],
          ),
          const SizedBox(height: 24),

          // Today's Schedule & Classes
          const Text(
            "Today's Schedule & Classes",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),

          // Two column layout for Today's Lessons and My Classes
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Today's Lessons (Left Column)
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.calendar_today,
                                  size: 20, color: Color(0xFF2563EB)),
                              SizedBox(width: 8),
                              Text(
                                "Today's Lessons",
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (todayLessons.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Text(
                                  'No lessons today',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )
                          else
                            ...todayLessons.map<Widget>((lesson) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        lesson['startTime'] ?? '',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF16A34A),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            lesson['subject']?['name'] ??
                                                'Subject',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w500,
                                              fontSize: 14,
                                            ),
                                          ),
                                          Text(
                                            lesson['class']?['name'] ?? '',
                                            style: TextStyle(
                                              color: Colors.grey[600],
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // My Classes (Right Column)
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.class_,
                                  size: 20, color: Color(0xFF2563EB)),
                              SizedBox(width: 8),
                              Text(
                                'My Classes',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (classes.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Text(
                                  'No classes assigned',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )
                          else
                            ...classes.map<Widget>((cls) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            cls['name'] ?? 'Class',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w500,
                                              fontSize: 14,
                                            ),
                                          ),
                                          Text(
                                            'Grade ${cls['grade']?['level'] ?? ''}',
                                            style: TextStyle(
                                              color: Colors.grey[600],
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '${cls['studentCount'] ?? 0} students',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF2563EB),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Supervised Classes Section (if any)
          if ((stats['supervisedClasses'] ?? 0) > 0) ...[
            const Text(
              'Classes I Supervise',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            // This would show supervised classes with attendance rates
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Text(
                    'Supervised classes with attendance tracking',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          gradient: LinearGradient(
            colors: [color, color.withValues(alpha: 0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 28, color: Colors.white),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard(String title, String description, IconData icon,
      Color color, VoidCallback onTap) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
