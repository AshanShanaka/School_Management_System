class User {
  final String id;
  final String username;
  final String email;
  final String name;
  final String surname;
  final String role;
  final String? phone;
  final String? address;
  final String? bloodType;
  final DateTime? birthday;
  final String? sex;
  final String? img;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.name,
    required this.surname,
    required this.role,
    this.phone,
    this.address,
    this.bloodType,
    this.birthday,
    this.sex,
    this.img,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      surname: json['surname'] ?? '',
      role: json['role'] ?? '',
      phone: json['phone'],
      address: json['address'],
      bloodType: json['bloodType'],
      birthday:
          json['birthday'] != null ? DateTime.parse(json['birthday']) : null,
      sex: json['sex'],
      img: json['img'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'name': name,
      'surname': surname,
      'role': role,
      'phone': phone,
      'address': address,
      'bloodType': bloodType,
      'birthday': birthday?.toIso8601String(),
      'sex': sex,
      'img': img,
    };
  }

  String get fullName => '$name $surname';
}

class Teacher extends User {
  final List<Subject>? subjects;
  final List<Class>? classes;

  Teacher({
    required super.id,
    required super.username,
    required super.email,
    required super.name,
    required super.surname,
    required super.role,
    super.phone,
    super.address,
    super.bloodType,
    super.birthday,
    super.sex,
    super.img,
    this.subjects,
    this.classes,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'].toString(),
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      surname: json['surname'] ?? '',
      role: 'teacher',
      phone: json['phone'],
      address: json['address'],
      bloodType: json['bloodType'],
      birthday:
          json['birthday'] != null ? DateTime.parse(json['birthday']) : null,
      sex: json['sex'],
      img: json['img'],
      subjects: json['subjects'] != null
          ? (json['subjects'] as List).map((s) => Subject.fromJson(s)).toList()
          : null,
      classes: json['classes'] != null
          ? (json['classes'] as List).map((c) => Class.fromJson(c)).toList()
          : null,
    );
  }
}

class Student extends User {
  final String? gradeId;
  final String? classId;
  final Class? class_;
  final String? parentId;

  Student({
    required super.id,
    required super.username,
    required super.email,
    required super.name,
    required super.surname,
    required super.role,
    super.phone,
    super.address,
    super.bloodType,
    super.birthday,
    super.sex,
    super.img,
    this.gradeId,
    this.classId,
    this.class_,
    this.parentId,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'].toString(),
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      surname: json['surname'] ?? '',
      role: 'student',
      phone: json['phone'],
      address: json['address'],
      bloodType: json['bloodType'],
      birthday:
          json['birthday'] != null ? DateTime.parse(json['birthday']) : null,
      sex: json['sex'],
      img: json['img'],
      gradeId: json['gradeId']?.toString(),
      classId: json['classId']?.toString(),
      class_: json['class'] != null ? Class.fromJson(json['class']) : null,
      parentId: json['parentId']?.toString(),
    );
  }
}

class Parent extends User {
  final List<Student>? students;

  Parent({
    required super.id,
    required super.username,
    required super.email,
    required super.name,
    required super.surname,
    required super.role,
    super.phone,
    super.address,
    super.bloodType,
    super.birthday,
    super.sex,
    super.img,
    this.students,
  });

  factory Parent.fromJson(Map<String, dynamic> json) {
    return Parent(
      id: json['id'].toString(),
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      surname: json['surname'] ?? '',
      role: 'parent',
      phone: json['phone'],
      address: json['address'],
      bloodType: json['bloodType'],
      birthday:
          json['birthday'] != null ? DateTime.parse(json['birthday']) : null,
      sex: json['sex'],
      img: json['img'],
      students: json['students'] != null
          ? (json['students'] as List).map((s) => Student.fromJson(s)).toList()
          : null,
    );
  }
}

class Subject {
  final String id;
  final String name;
  final String? code;

  Subject({
    required this.id,
    required this.name,
    this.code,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      code: json['code'],
    );
  }
}

class Class {
  final String id;
  final String name;
  final int? capacity;
  final String? gradeId;

  Class({
    required this.id,
    required this.name,
    this.capacity,
    this.gradeId,
  });

  factory Class.fromJson(Map<String, dynamic> json) {
    return Class(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      capacity: json['capacity'],
      gradeId: json['gradeId']?.toString(),
    );
  }
}
