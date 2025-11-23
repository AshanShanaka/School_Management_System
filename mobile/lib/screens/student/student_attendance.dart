import 'package:flutter/material.dart';

class StudentAttendance extends StatelessWidget {
  const StudentAttendance({super.key});

  @override
  Widget build(BuildContext context) {
    // Hardcoded sample attendance data
    final attendanceRate = 92.5;
    final presentDays = 37;
    final totalDays = 40;
    final absentDays = 3;

    final recentAttendance = [
      {'date': '2024-01-20', 'status': 'Present', 'subject': 'Mathematics'},
      {'date': '2024-01-19', 'status': 'Present', 'subject': 'Science'},
      {'date': '2024-01-18', 'status': 'Absent', 'subject': 'English'},
      {'date': '2024-01-17', 'status': 'Present', 'subject': 'History'},
      {'date': '2024-01-16', 'status': 'Present', 'subject': 'Geography'},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats Card
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue.shade400, Colors.blue.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(Icons.calendar_today,
                      size: 48, color: Colors.white),
                  const SizedBox(height: 16),
                  Text(
                    '${attendanceRate.toStringAsFixed(1)}%',
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Attendance Rate',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatItem(
                          'Present', '$presentDays', Colors.green.shade200),
                      _buildStatItem(
                          'Absent', '$absentDays', Colors.red.shade200),
                      _buildStatItem('Total', '$totalDays', Colors.white70),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Recent Attendance Header
          const Text(
            'Recent Attendance',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          // Attendance Records
          ...recentAttendance.map((record) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: record['status'] == 'Present'
                        ? Colors.green.shade100
                        : Colors.red.shade100,
                    child: Icon(
                      record['status'] == 'Present' ? Icons.check : Icons.close,
                      color: record['status'] == 'Present'
                          ? Colors.green.shade700
                          : Colors.red.shade700,
                    ),
                  ),
                  title: Text(
                    record['subject']!,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(record['date']!),
                  trailing: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: record['status'] == 'Present'
                          ? Colors.green.shade50
                          : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      record['status']!,
                      style: TextStyle(
                        color: record['status'] == 'Present'
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: color,
          ),
        ),
      ],
    );
  }
}
