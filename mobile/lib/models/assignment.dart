import 'lesson.dart';

class Assignment {
  final int id;
  final String title;
  final DateTime startDate;
  final DateTime dueDate;
  final int lessonId;

  // Relations
  final Lesson? lesson;

  Assignment({
    required this.id,
    required this.title,
    required this.startDate,
    required this.dueDate,
    required this.lessonId,
    this.lesson,
  });

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      id: json['id'],
      title: json['title'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      dueDate: DateTime.parse(json['dueDate']),
      lessonId: json['lessonId'],
      lesson: json['lesson'] != null ? Lesson.fromJson(json['lesson']) : null,
    );
  }

  bool get isOverdue {
    return DateTime.now().isAfter(dueDate);
  }

  int get daysUntilDue {
    return dueDate.difference(DateTime.now()).inDays;
  }

  String get status {
    if (isOverdue) return 'Overdue';
    if (daysUntilDue == 0) return 'Due Today';
    if (daysUntilDue == 1) return 'Due Tomorrow';
    return 'Due in $daysUntilDue days';
  }
}
