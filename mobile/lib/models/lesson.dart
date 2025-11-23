class Lesson {
  final int id;
  final String name;
  final String day;
  final DateTime startTime;
  final DateTime endTime;
  final int subjectId;
  final int classId;
  final String teacherId;

  // Relations
  final Subject? subject;
  final Class? class_;
  final Teacher? teacher;

  Lesson({
    required this.id,
    required this.name,
    required this.day,
    required this.startTime,
    required this.endTime,
    required this.subjectId,
    required this.classId,
    required this.teacherId,
    this.subject,
    this.class_,
    this.teacher,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'],
      name: json['name'] ?? '',
      day: json['day'] ?? '',
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      subjectId: json['subjectId'],
      classId: json['classId'],
      teacherId: json['teacherId'].toString(),
      subject:
          json['subject'] != null ? Subject.fromJson(json['subject']) : null,
      class_: json['class'] != null ? Class.fromJson(json['class']) : null,
      teacher:
          json['teacher'] != null ? Teacher.fromJson(json['teacher']) : null,
    );
  }

  String get timeRange {
    final start =
        '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}';
    final end =
        '${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}';
    return '$start - $end';
  }
}

class Subject {
  final int id;
  final String name;
  final String? code;

  Subject({
    required this.id,
    required this.name,
    this.code,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'],
      name: json['name'] ?? '',
      code: json['code'],
    );
  }
}

class Class {
  final int id;
  final String name;
  final int? capacity;
  final int? gradeId;
  final String? supervisorId;

  Class({
    required this.id,
    required this.name,
    this.capacity,
    this.gradeId,
    this.supervisorId,
  });

  factory Class.fromJson(Map<String, dynamic> json) {
    return Class(
      id: json['id'],
      name: json['name'] ?? '',
      capacity: json['capacity'],
      gradeId: json['gradeId'],
      supervisorId: json['supervisorId']?.toString(),
    );
  }
}

class Teacher {
  final String id;
  final String name;
  final String surname;
  final String? email;

  Teacher({
    required this.id,
    required this.name,
    required this.surname,
    this.email,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      surname: json['surname'] ?? '',
      email: json['email'],
    );
  }

  String get fullName => '$name $surname';
}
