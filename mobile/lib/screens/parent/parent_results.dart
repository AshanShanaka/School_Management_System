import 'package:flutter/material.dart';

class ParentResults extends StatelessWidget {
  const ParentResults({super.key});

  @override
  Widget build(BuildContext context) {
    // Hardcoded sample results data for children
    final childrenResults = [
      {
        'childName': 'Amila Rathnayaka',
        'childId': '1',
        'grade': 'Grade 11',
        'class': '11-A',
        'totalExams': 4,
        'averageMark': 82.8,
        'highestGrade': 'A+',
        'exams': [
          {
            'subject': 'Mathematics',
            'marks': 85,
            'total': 100,
            'grade': 'A',
            'date': '2024-11-15',
          },
          {
            'subject': 'Science',
            'marks': 78,
            'total': 100,
            'grade': 'B+',
            'date': '2024-11-10',
          },
          {
            'subject': 'English',
            'marks': 92,
            'total': 100,
            'grade': 'A+',
            'date': '2024-11-05',
          },
          {
            'subject': 'History',
            'marks': 76,
            'total': 100,
            'grade': 'B',
            'date': '2024-10-28',
          },
        ],
      },
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
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
                padding: const EdgeInsets.all(20),
                child: const Row(
                  children: [
                    Icon(
                      Icons.assessment,
                      size: 48,
                      color: Colors.white,
                    ),
                    SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Children Results',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'View your children\'s exam results',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Children Results Cards
            ...childrenResults
                .map((child) => _buildChildResultsCard(child))
                .toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildChildResultsCard(Map<String, dynamic> child) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Child Header
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.green.shade100,
                  child: Text(
                    child['childName']
                        .toString()
                        .split(' ')
                        .map((e) => e[0])
                        .join(),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade700,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        child['childName'].toString(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${child['grade']} • ${child['class']}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.purple.shade400, Colors.purple.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildSummaryItem(
                      'Total Exams', child['totalExams'].toString()),
                  Container(
                    height: 40,
                    width: 1,
                    color: Colors.white30,
                  ),
                  _buildSummaryItem('Average', '${child['averageMark']}%'),
                  Container(
                    height: 40,
                    width: 1,
                    color: Colors.white30,
                  ),
                  _buildSummaryItem(
                      'Highest', child['highestGrade'].toString()),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Exam Results
            const Text(
              'Recent Exams',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...((child['exams'] as List).map((exam) {
              return _buildExamCard(
                exam['subject'].toString(),
                exam['marks'] as int,
                exam['total'] as int,
                exam['grade'].toString(),
                exam['date'].toString(),
              );
            }).toList()),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  Widget _buildExamCard(
      String subject, int marks, int total, String grade, String date) {
    Color gradeColor;
    if (grade.startsWith('A')) {
      gradeColor = Colors.green;
    } else if (grade.startsWith('B')) {
      gradeColor = Colors.blue;
    } else if (grade.startsWith('C')) {
      gradeColor = Colors.orange;
    } else {
      gradeColor = Colors.red;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: gradeColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  grade,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: gradeColor,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    date,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '$marks/$total',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${((marks / total) * 100).toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
