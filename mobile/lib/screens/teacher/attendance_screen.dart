import 'package:flutter/material.dart';
import '../../config/theme.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/api_config.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() =>
      _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  List<dynamic> _lessons = [];
  List<dynamic> _students = [];
  Map<String, bool> _attendanceMap = {}; // studentId -> present
  bool _isLoading = true;
  bool _isSubmitting = false;
  dynamic _selectedLesson;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadLessons();
  }

  Future<void> _loadLessons() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      final url = '${ApiConfig.baseUrl}/api/teacher/dashboard';

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=$token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          _lessons = data['lessons'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadStudents(String classId) async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/teacher/dashboard'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=$token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final allStudents = data['students'] ?? [];

        final filteredStudents = allStudents.where((s) {
          final studentClassId = s['class']?['id'];
          return studentClassId == classId;
        }).toList();

        setState(() {
          _students = filteredStudents;
          // Initialize all as present
          _attendanceMap = {
            for (var s in filteredStudents) s['id'].toString(): true
          };
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitAttendance() async {
    if (_selectedLesson == null || _students.isEmpty) return;

    setState(() => _isSubmitting = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      final attendanceData = _students
          .map((student) => {
                'studentId': student['id'],
                'lessonId': _selectedLesson['id'].toString(),
                'date': _selectedDate.toIso8601String(),
                'present': _attendanceMap[student['id'].toString()] ?? false,
              })
          .toList();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/attendance'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=$token',
        },
        body: jsonEncode({'attendance': attendanceData}),
      );

      if (mounted) {
        if (response.statusCode == 200 || response.statusCode == 201) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Attendance marked successfully'),
              backgroundColor: AppColors.gradeA,
            ),
          );
          setState(() {
            _selectedLesson = null;
            _students = [];
            _attendanceMap = {};
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${response.statusCode}'),
              backgroundColor: AppColors.gradeF,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.gradeF,
          ),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Date Picker
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => _selectDate(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          DateFormat('MMM dd, yyyy').format(_selectedDate),
                          style: const TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Lesson Selector
        if (_selectedLesson == null && !_isLoading)
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _lessons.length,
              itemBuilder: (context, index) {
                final lesson = _lessons[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.teacher.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.class_,
                        color: AppColors.teacher,
                      ),
                    ),
                    title: Text(
                      lesson['name']?.toString() ?? 'Unknown Lesson',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '${lesson['class']?['name'] ?? 'N/A'} - ${lesson['subject']?['name'] ?? 'N/A'}',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      setState(() => _selectedLesson = lesson);
                      if (lesson['classId'] != null) {
                        _loadStudents(lesson['classId'].toString());
                      }
                    },
                  ),
                );
              },
            ),
          ),

        // Student Attendance List
        if (_selectedLesson != null && !_isLoading)
          Expanded(
            child: Column(
              children: [
                // Selected Lesson Info
                Container(
                  padding: const EdgeInsets.all(16),
                  color: AppColors.teacher.withValues(alpha: 0.1),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedLesson!['name']?.toString() ?? 'Unknown',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${_selectedLesson!['class']?['name'] ?? ''} - ${_selectedLesson!['subject']?['name'] ?? ''}',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          setState(() {
                            _selectedLesson = null;
                            _students = [];
                            _attendanceMap = {};
                          });
                        },
                      ),
                    ],
                  ),
                ),

                // Quick Actions
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            setState(() {
                              for (var s in _students) {
                                _attendanceMap[s['id'].toString()] = true;
                              }
                            });
                          },
                          icon: const Icon(Icons.check_circle),
                          label: const Text('Mark All Present'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            setState(() {
                              for (var s in _students) {
                                _attendanceMap[s['id'].toString()] = false;
                              }
                            });
                          },
                          icon: const Icon(Icons.cancel),
                          label: const Text('Mark All Absent'),
                        ),
                      ),
                    ],
                  ),
                ),

                // Students List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _students.length,
                    itemBuilder: (context, index) {
                      final student = _students[index];
                      final studentId = student['id'].toString();
                      final isPresent = _attendanceMap[studentId] ?? false;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isPresent
                                ? AppColors.gradeA.withValues(alpha: 0.2)
                                : AppColors.gradeF.withValues(alpha: 0.2),
                            child: Icon(
                              isPresent ? Icons.check : Icons.close,
                              color: isPresent
                                  ? AppColors.gradeA
                                  : AppColors.gradeF,
                            ),
                          ),
                          title: Text(student['name']?.toString() ?? 'Unknown'),
                          subtitle:
                              Text('ID: ${student['studentId'] ?? studentId}'),
                          trailing: Switch(
                            value: isPresent,
                            onChanged: (value) {
                              setState(() => _attendanceMap[studentId] = value);
                            },
                            activeColor: AppColors.gradeA,
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Submit Button
                Container(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitAttendance,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Submit Attendance'),
                    ),
                  ),
                ),
              ],
            ),
          ),

        if (_isLoading)
          const Expanded(
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }
}
