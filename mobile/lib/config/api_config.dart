class ApiConfig {
  // Change this to your computer's IP address when testing on physical device
  // On emulator, use 10.0.2.2 for localhost
  static const String baseUrl = 'http://10.0.2.2:3000';

  // For physical device, use your computer's IP:
  // static const String baseUrl = 'http://192.168.1.XXX:3000';

  static const String apiUrl = '$baseUrl/api';

  // API Endpoints
  static const String loginEndpoint = '$apiUrl/auth/login';
  static const String meEndpoint = '$apiUrl/auth/me';
  static const String lessonsEndpoint = '$apiUrl/lessons';
  static const String assignmentsEndpoint = '$apiUrl/assignments';
  static const String attendanceEndpoint = '$apiUrl/attendance';
  static const String marksEndpoint = '$apiUrl/marks';
  static const String studentsEndpoint = '$apiUrl/students';
  static const String classesEndpoint = '$apiUrl/classes';
  static const String subjectsEndpoint = '$apiUrl/subjects';
  static const String predictionsEndpoint = '$apiUrl/predictions';

  // Request timeout (reduced for faster UI response)
  static const Duration timeout = Duration(seconds: 10);
}
