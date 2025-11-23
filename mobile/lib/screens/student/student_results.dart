import 'package:flutter/material.dart';

class StudentResults extends StatelessWidget {
  const StudentResults({super.key});

  @override
  Widget build(BuildContext context) {
    // Hardcoded sample results data
    final exams = [
      {
        'subject': 'Mathematics',
        'examType': 'Mid Term',
        'marks': '85',
        'total': '100',
        'grade': 'A',
      },
      {
        'subject': 'Science',
        'examType': 'Mid Term',
        'marks': '78',
        'total': '100',
        'grade': 'B+',
      },
      {
        'subject': 'English',
        'examType': 'Mid Term',
        'marks': '92',
        'total': '100',
        'grade': 'A+',
      },
      {
        'subject': 'History',
        'examType': 'Mid Term',
        'marks': '76',
        'total': '100',
        'grade': 'B',
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Card
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green.shade400, Colors.green.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.all(24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildSummaryItem('Total\nExams', '4', Icons.assignment),
                  Container(width: 1, height: 40, color: Colors.white30),
                  _buildSummaryItem(
                      'Average\nScore', '82.8%', Icons.trending_up),
                  Container(width: 1, height: 40, color: Colors.white30),
                  _buildSummaryItem('Highest\nGrade', 'A+', Icons.star),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Results Header
          const Text(
            'Exam Results',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          // Results List
          ...exams.map((exam) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exam['subject']!,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  exam['examType']!,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: _getGradeColor(exam['grade']!),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              exam['grade']!,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Score:',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                          Text(
                            '${exam['marks']} / ${exam['total']}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  Color _getGradeColor(String grade) {
    if (grade.startsWith('A')) return Colors.green.shade600;
    if (grade.startsWith('B')) return Colors.blue.shade600;
    if (grade.startsWith('C')) return Colors.orange.shade600;
    return Colors.red.shade600;
  }
}
