import 'package:flutter/material.dart';

class StudentTimetable extends StatelessWidget {
  const StudentTimetable({super.key});

  @override
  Widget build(BuildContext context) {
    // Hardcoded sample timetable data
    final timetable = {
      'Monday': [
        {
          'time': '08:00 - 08:40',
          'subject': 'Mathematics',
          'teacher': 'Mr. Silva'
        },
        {
          'time': '08:40 - 09:20',
          'subject': 'Science',
          'teacher': 'Mrs. Perera'
        },
        {
          'time': '09:20 - 10:00',
          'subject': 'English',
          'teacher': 'Ms. Fernando'
        },
        {'time': '10:20 - 11:00', 'subject': 'History', 'teacher': 'Mr. Dias'},
      ],
      'Tuesday': [
        {
          'time': '08:00 - 08:40',
          'subject': 'Science',
          'teacher': 'Mrs. Perera'
        },
        {
          'time': '08:40 - 09:20',
          'subject': 'Mathematics',
          'teacher': 'Mr. Silva'
        },
        {
          'time': '09:20 - 10:00',
          'subject': 'Geography',
          'teacher': 'Mr. Ranasinghe'
        },
        {
          'time': '10:20 - 11:00',
          'subject': 'English',
          'teacher': 'Ms. Fernando'
        },
      ],
      'Wednesday': [
        {'time': '08:00 - 08:40', 'subject': 'ICT', 'teacher': 'Mr. Kumar'},
        {
          'time': '08:40 - 09:20',
          'subject': 'Mathematics',
          'teacher': 'Mr. Silva'
        },
        {
          'time': '09:20 - 10:00',
          'subject': 'Science',
          'teacher': 'Mrs. Perera'
        },
        {
          'time': '10:20 - 11:00',
          'subject': 'Physical Education',
          'teacher': 'Coach Mendis'
        },
      ],
      'Thursday': [
        {
          'time': '08:00 - 08:40',
          'subject': 'English',
          'teacher': 'Ms. Fernando'
        },
        {'time': '08:40 - 09:20', 'subject': 'History', 'teacher': 'Mr. Dias'},
        {
          'time': '09:20 - 10:00',
          'subject': 'Mathematics',
          'teacher': 'Mr. Silva'
        },
        {
          'time': '10:20 - 11:00',
          'subject': 'Science',
          'teacher': 'Mrs. Perera'
        },
      ],
      'Friday': [
        {
          'time': '08:00 - 08:40',
          'subject': 'Geography',
          'teacher': 'Mr. Ranasinghe'
        },
        {
          'time': '08:40 - 09:20',
          'subject': 'English',
          'teacher': 'Ms. Fernando'
        },
        {'time': '09:20 - 10:00', 'subject': 'ICT', 'teacher': 'Mr. Kumar'},
        {
          'time': '10:20 - 11:00',
          'subject': 'Mathematics',
          'teacher': 'Mr. Silva'
        },
      ],
    };

    return DefaultTabController(
      length: 5,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              isScrollable: true,
              labelColor: Colors.blue.shade700,
              unselectedLabelColor: Colors.grey,
              indicatorColor: Colors.blue.shade700,
              tabs: timetable.keys.map((day) => Tab(text: day)).toList(),
            ),
          ),
          Expanded(
            child: TabBarView(
              children: timetable.entries.map((entry) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Card(
                        color: Colors.blue.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Icon(Icons.calendar_today,
                                  color: Colors.blue.shade700, size: 28),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    entry.key,
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue.shade700,
                                    ),
                                  ),
                                  Text(
                                    '${entry.value.length} Classes',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ...entry.value.map((slot) => Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: _getSubjectColor(slot['subject']!),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(
                                  child: Icon(
                                    _getSubjectIcon(slot['subject']!),
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              title: Text(
                                slot['subject']!,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.access_time,
                                          size: 14, color: Colors.grey[600]),
                                      const SizedBox(width: 4),
                                      Text(slot['time']!),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.person,
                                          size: 14, color: Colors.grey[600]),
                                      const SizedBox(width: 4),
                                      Text(slot['teacher']!),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          )),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Color _getSubjectColor(String subject) {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return Colors.blue.shade600;
      case 'science':
        return Colors.green.shade600;
      case 'english':
        return Colors.purple.shade600;
      case 'history':
        return Colors.orange.shade600;
      case 'geography':
        return Colors.teal.shade600;
      case 'ict':
        return Colors.indigo.shade600;
      case 'physical education':
        return Colors.red.shade600;
      default:
        return Colors.grey.shade600;
    }
  }

  IconData _getSubjectIcon(String subject) {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return Icons.calculate;
      case 'science':
        return Icons.science;
      case 'english':
        return Icons.book;
      case 'history':
        return Icons.history_edu;
      case 'geography':
        return Icons.public;
      case 'ict':
        return Icons.computer;
      case 'physical education':
        return Icons.sports;
      default:
        return Icons.school;
    }
  }
}
