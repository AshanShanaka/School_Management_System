class ExamMark {
  final int id;
  final int mark;
  final String grade;
  final String term;
  final String studentId;
  final int subjectId;

  // Relations
  final Subject? subject;
  final Student? student;

  ExamMark({
    required this.id,
    required this.mark,
    required this.grade,
    required this.term,
    required this.studentId,
    required this.subjectId,
    this.subject,
    this.student,
  });

  factory ExamMark.fromJson(Map<String, dynamic> json) {
    return ExamMark(
      id: json['id'],
      mark: json['mark'] ?? 0,
      grade: json['grade'] ?? 'F',
      term: json['term'] ?? '',
      studentId: json['studentId'].toString(),
      subjectId: json['subjectId'],
      subject:
          json['subject'] != null ? Subject.fromJson(json['subject']) : null,
      student:
          json['student'] != null ? Student.fromJson(json['student']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mark': mark,
      'grade': grade,
      'term': term,
      'studentId': studentId,
      'subjectId': subjectId,
    };
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

class Student {
  final String id;
  final String name;
  final String surname;

  Student({
    required this.id,
    required this.name,
    required this.surname,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      surname: json['surname'] ?? '',
    );
  }

  String get fullName => '$name $surname';
}

class MarksSummary {
  final String term;
  final double average;
  final int totalSubjects;
  final Map<String, int> gradeDistribution;

  MarksSummary({
    required this.term,
    required this.average,
    required this.totalSubjects,
    required this.gradeDistribution,
  });

  factory MarksSummary.fromJson(Map<String, dynamic> json) {
    return MarksSummary(
      term: json['term'] ?? '',
      average: (json['average'] ?? 0).toDouble(),
      totalSubjects: json['totalSubjects'] ?? 0,
      gradeDistribution: Map<String, int>.from(json['gradeDistribution'] ?? {}),
    );
  }
}
