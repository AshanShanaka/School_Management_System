import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../models/user.dart' as user_model;

class TeacherMarksScreen extends StatefulWidget {
  const TeacherMarksScreen({super.key});

  @override
  State<TeacherMarksScreen> createState() => _TeacherMarksScreenState();
}

class _TeacherMarksScreenState extends State<TeacherMarksScreen> {
  final ApiService _apiService = ApiService();
  List<user_model.Student> _students = [];
  Map<String, TextEditingController> _markControllers = {};
  Map<String, String> _grades = {};
  bool _isLoading = false;
  bool _isSubmitting = false;
  int? _selectedSubjectId;
  String _selectedTerm = '1';

  final List<String> _terms = ['1', '2', '3'];

  @override
  void dispose() {
    for (var controller in _markControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadStudents(int classId) async {
    setState(() => _isLoading = true);
    final students = await _apiService.getStudentsByClass(classId);
    setState(() {
      _students = students.cast<user_model.Student>();
      _markControllers = {
        for (var s in _students) s.id: TextEditingController()
      };
      _grades = {for (var s in _students) s.id: 'S'};
      _isLoading = false;
    });
  }

  String _calculateGrade(int mark) {
    if (mark >= 75) return 'A';
    if (mark >= 65) return 'B';
    if (mark >= 50) return 'C';
    if (mark >= 35) return 'S';
    return 'F';
  }

  void _updateGrade(String studentId, String markText) {
    final mark = int.tryParse(markText);
    if (mark != null && mark >= 0 && mark <= 100) {
      setState(() {
        _grades[studentId] = _calculateGrade(mark);
      });
    }
  }

  Future<void> _submitMarks() async {
    if (_students.isEmpty || _selectedSubjectId == null) return;

    setState(() => _isSubmitting = true);
    try {
      for (var student in _students) {
        final markText = _markControllers[student.id]?.text ?? '';
        final mark = int.tryParse(markText);
        if (mark != null && mark >= 0 && mark <= 100) {
          await _apiService.saveExamMark(
            studentId: student.id,
            subjectId: _selectedSubjectId!,
            term: _selectedTerm,
            mark: mark,
            grade: _grades[student.id] ?? 'F',
          );
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Marks saved successfully'),
            backgroundColor: AppColors.gradeA,
          ),
        );
        setState(() {
          _students = [];
          _markControllers.forEach((key, controller) => controller.clear());
          _grades = {};
          _selectedSubjectId = null;
        });
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

  Color _getGradeColor(String grade) {
    switch (grade) {
      case 'A':
        return AppColors.gradeA;
      case 'B':
        return AppColors.gradeB;
      case 'C':
        return AppColors.gradeC;
      case 'S':
        return AppColors.gradeS;
      case 'F':
        return AppColors.gradeF;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Selection Panel
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter Marks',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              // Term Selector
              DropdownButtonFormField<String>(
                value: _selectedTerm,
                decoration: const InputDecoration(
                  labelText: 'Term',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                items: _terms.map((term) {
                  return DropdownMenuItem(
                    value: term,
                    child: Text('Term $term'),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedTerm = value ?? '1');
                },
              ),
              const SizedBox(height: 12),
              // Class Selector (Placeholder - should load from API)
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Class ID',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.class_),
                  hintText: 'Enter class ID (e.g., 1)',
                ),
                keyboardType: TextInputType.number,
                onSubmitted: (value) {
                  final classId = int.tryParse(value);
                  if (classId != null) {
                    _loadStudents(classId);
                  }
                },
              ),
              const SizedBox(height: 12),
              // Subject Selector (Placeholder)
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Subject ID',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.subject),
                  hintText: 'Enter subject ID (e.g., 1)',
                ),
                keyboardType: TextInputType.number,
                onChanged: (value) {
                  final subjectId = int.tryParse(value);
                  setState(() => _selectedSubjectId = subjectId);
                },
              ),
            ],
          ),
        ),

        // Students Marks Entry
        if (_students.isNotEmpty)
          Expanded(
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  color: AppColors.teacher.withOpacity(0.1),
                  child: Row(
                    children: [
                      const Expanded(
                        flex: 3,
                        child: Text(
                          'Student',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Expanded(
                        flex: 2,
                        child: Text(
                          'Mark',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Expanded(
                        child: Text(
                          'Grade',
                          style: TextStyle(fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                ),

                // Students List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _students.length,
                    itemBuilder: (context, index) {
                      final student = _students[index];
                      final grade = _grades[student.id] ?? 'S';
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              // Student Info
                              Expanded(
                                flex: 3,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      student.fullName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      student.username,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Mark Input
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: _markControllers[student.id],
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    hintText: '0-100',
                                    border: OutlineInputBorder(),
                                    contentPadding: EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 8,
                                    ),
                                  ),
                                  onChanged: (value) {
                                    _updateGrade(student.id, value);
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Grade Display
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color:
                                        _getGradeColor(grade).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: _getGradeColor(grade),
                                      width: 2,
                                    ),
                                  ),
                                  child: Text(
                                    grade,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: _getGradeColor(grade),
                                    ),
                                  ),
                                ),
                              ),
                            ],
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
                      onPressed: _isSubmitting ? null : _submitMarks,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save Marks'),
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

        if (_students.isEmpty && !_isLoading)
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.grading_outlined,
                    size: 64,
                    color: AppColors.textSecondary.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Select class and subject to enter marks',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      'Grading Scale:\nA: 75-100 | B: 65-74 | C: 50-64 | S: 35-49 | F: 0-34',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
