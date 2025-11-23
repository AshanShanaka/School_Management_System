import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/lesson.dart';
import '../models/assignment.dart';
import '../models/attendance.dart';
import '../models/exam_mark.dart';
import 'auth_service.dart';

class ApiService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Cookie': 'authToken=$token',
    };
  }

  // Lessons
  Future<List<Lesson>> getLessons({Map<String, String>? params}) async {
    try {
      final uri =
          Uri.parse(ApiConfig.lessonsEndpoint).replace(queryParameters: params);
      final response = await http
          .get(
            uri,
            headers: await _getHeaders(),
          )
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.map((json) => Lesson.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching lessons: $e');
      return [];
    }
  }

  // Assignments
  Future<List<Assignment>> getAssignments({Map<String, String>? params}) async {
    try {
      final uri = Uri.parse(ApiConfig.assignmentsEndpoint)
          .replace(queryParameters: params);
      final response = await http
          .get(
            uri,
            headers: await _getHeaders(),
          )
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.map((json) => Assignment.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching assignments: $e');
      return [];
    }
  }

  // Attendance
  Future<List<Attendance>> getAttendance({
    required String studentId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, String>{
        'studentId': studentId,
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
      };

      final uri = Uri.parse(ApiConfig.attendanceEndpoint)
          .replace(queryParameters: params);
      final response = await http
          .get(
            uri,
            headers: await _getHeaders(),
          )
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.map((json) => Attendance.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching attendance: $e');
      return [];
    }
  }

  // Mark Attendance
  Future<bool> markAttendance(List<Map<String, dynamic>> attendanceData) async {
    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.attendanceEndpoint),
            headers: await _getHeaders(),
            body: jsonEncode(attendanceData),
          )
          .timeout(ApiConfig.timeout);

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error marking attendance: $e');
      return false;
    }
  }

  // Exam Marks
  Future<List<ExamMark>> getExamMarks({
    String? studentId,
    String? term,
    int? subjectId,
  }) async {
    try {
      final params = <String, String>{
        if (studentId != null) 'studentId': studentId,
        if (term != null) 'term': term,
        if (subjectId != null) 'subjectId': subjectId.toString(),
      };

      final uri =
          Uri.parse(ApiConfig.marksEndpoint).replace(queryParameters: params);
      final response = await http
          .get(
            uri,
            headers: await _getHeaders(),
          )
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.map((json) => ExamMark.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching exam marks: $e');
      return [];
    }
  }

  // Create/Update Exam Mark
  Future<bool> saveExamMark({
    required String studentId,
    required int subjectId,
    required int mark,
    required String grade,
    required String term,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.marksEndpoint),
            headers: await _getHeaders(),
            body: jsonEncode({
              'studentId': studentId,
              'subjectId': subjectId,
              'mark': mark,
              'grade': grade,
              'term': term,
            }),
          )
          .timeout(ApiConfig.timeout);

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error saving exam mark: $e');
      return false;
    }
  }

  // Get Students by Class
  Future<List<dynamic>> getStudentsByClass(int classId) async {
    try {
      final uri = Uri.parse('${ApiConfig.studentsEndpoint}?classId=$classId');
      final response = await http
          .get(
            uri,
            headers: await _getHeaders(),
          )
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List;
      }
      return [];
    } catch (e) {
      print('Error fetching students: $e');
      return [];
    }
  }

  // Get Predictions
  Future<Map<String, dynamic>?> getPredictions(String studentId) async {
    try {
      final uri = Uri.parse('${ApiConfig.predictionsEndpoint}/$studentId');
      final response = await http
          .get(
            uri,
            headers: await _getHeaders(),
          )
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error fetching predictions: $e');
      return null;
    }
  }
}
