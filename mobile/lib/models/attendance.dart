class Attendance {
  final int id;
  final DateTime date;
  final bool present;
  final String studentId;
  final int lessonId;

  Attendance({
    required this.id,
    required this.date,
    required this.present,
    required this.studentId,
    required this.lessonId,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'],
      date: DateTime.parse(json['date']),
      present: json['present'] ?? false,
      studentId: json['studentId'].toString(),
      lessonId: json['lessonId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'present': present,
      'studentId': studentId,
      'lessonId': lessonId,
    };
  }
}

class AttendanceStats {
  final int totalDays;
  final int present;
  final int absent;
  final double percentage;

  AttendanceStats({
    required this.totalDays,
    required this.present,
    required this.absent,
    required this.percentage,
  });

  factory AttendanceStats.fromJson(Map<String, dynamic> json) {
    return AttendanceStats(
      totalDays: json['totalDays'] ?? 0,
      present: json['present'] ?? 0,
      absent: json['absent'] ?? 0,
      percentage: (json['percentage'] ?? 0).toDouble(),
    );
  }
}
