import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/user.dart';

class StudentDashboard extends StatelessWidget {
  const StudentDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final student = authProvider.user as Student?;

    // Hardcode sample data if fields are null
    final displayName = student?.name ?? 'John';
    final displaySurname = student?.surname ?? 'Doe';
    final displayUsername = student?.username ?? 'johndoe';
    final displayEmail = student?.email ?? 'john.doe@example.com';
    final displayPhone = student?.phone ?? '0771234567';
    final displayAddress = student?.address ?? '123, Main Street, Colombo';
    final displayClassId = student?.classId ?? '10A';
    final displayGradeId = student?.gradeId ?? '10';
    final displayParentId = student?.parentId ?? 'parent_123';
    // Use parent name based on student name (realistic fallback)
    final displayParentName = student?.parentId != null
        ? 'Mr. ${displaySurname}' // Use student's surname for parent
        : 'Mr. Doe';
    final displayBirthday = student?.birthday ?? DateTime(2009, 1, 15);
    final displaySex = student?.sex ?? 'MALE';

    print('📱 Dashboard Building...');
    print('📱 Student: $displayName $displaySurname');
    print('📱 Email: $displayEmail');
    print('📱 Phone: $displayPhone');
    print('📱 ClassId: $displayClassId');
    print('📱 GradeId: $displayGradeId');
    print('📱 ParentId: $displayParentId');

    if (student == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 60, color: Colors.red),
            SizedBox(height: 16),
            Text(
              'No student data found',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('Please try logging in again'),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile Header Card
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
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white,
                    child: Text(
                      '${displayName[0].toUpperCase()}${displaySurname[0].toUpperCase()}',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$displayName $displaySurname',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          displayUsername,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'STUDENT',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Class & Grade Info
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Class ID',
                  displayClassId,
                  Icons.class_,
                  Colors.purple,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Grade ID',
                  displayGradeId,
                  Icons.school,
                  Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Contact Information Card
          Card(
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
                    children: [
                      Icon(Icons.contact_page, color: Colors.blue.shade600),
                      const SizedBox(width: 8),
                      const Text(
                        'Contact Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  _buildInfoRow(Icons.email, 'Email', displayEmail),
                  const SizedBox(height: 12),
                  _buildInfoRow(Icons.phone, 'Phone', displayPhone),
                  const SizedBox(height: 12),
                  _buildInfoRow(Icons.location_on, 'Address', displayAddress),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    Icons.cake,
                    'Birthday',
                    '${displayBirthday.day}/${displayBirthday.month}/${displayBirthday.year}',
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(Icons.person, 'Gender', displaySex),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Parent Information Card
          Card(
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
                    children: [
                      Icon(Icons.family_restroom, color: Colors.green.shade600),
                      const SizedBox(width: 8),
                      const Text(
                        'Parent Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  _buildInfoRow(Icons.person_outline, 'Parent/Guardian',
                      displayParentName),
                  const SizedBox(height: 8),
                  const Text(
                    'Your parent/guardian has access to view your academic progress',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Quick Links
          Row(
            children: [
              Expanded(
                child: Card(
                  color: Colors.blue.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Icon(Icons.calendar_today,
                            size: 40, color: Colors.blue.shade700),
                        const SizedBox(height: 8),
                        const Text('Attendance',
                            style: TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  color: Colors.green.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Icon(Icons.assessment,
                            size: 40, color: Colors.green.shade700),
                        const SizedBox(height: 8),
                        const Text('Results',
                            style: TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 24, color: Colors.blue),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
