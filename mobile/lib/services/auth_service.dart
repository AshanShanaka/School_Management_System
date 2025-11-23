import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      print('🔑 [AuthService] Logging in as: $username');
      print('🔑 [AuthService] Connecting to: ${ApiConfig.loginEndpoint}');

      // Clear any existing saved data first
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
      await prefs.remove(_userKey);
      print('🧹 [AuthService] Cleared old user data');

      final response = await http
          .post(
            Uri.parse(ApiConfig.loginEndpoint),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'identifier': username,
              'password': password,
            }),
          )
          .timeout(ApiConfig.timeout);

      print('✅ [AuthService] Got response!');
      print('🔑 [AuthService] Response Status: ${response.statusCode}');
      print('🔑 [AuthService] Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('🔑 [AuthService] Decoded response: $data');

        // Extract user from response - handle both formats
        final user = data['user'] ?? data;

        if (user == null) {
          print('❌ [AuthService] No user in response');
          return {
            'success': false,
            'error': 'No user data in response',
          };
        }

        // Check if response indicates success
        if (data['success'] == false || data['error'] != null) {
          print('❌ [AuthService] API returned error: ${data['error']}');
          return {
            'success': false,
            'error': data['error'] ?? 'Login failed',
          };
        }

        print('🔑 [AuthService] User data: $user');
        print(
            '🔑 [AuthService] User name: ${user['name']}, Role: ${user['role']}');

        // Generate unique token and save to preferences
        final token = 'token_${DateTime.now().millisecondsSinceEpoch}';
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userKey, jsonEncode(user));

        print('✅ [AuthService] Saved NEW user to SharedPreferences');
        print('✅ [AuthService] User ID: ${user['id']}');
        print('✅ [AuthService] Username: ${user['username']}');
        print('✅ [AuthService] Name: ${user['name']} ${user['surname'] ?? ''}');
        print('✅ [AuthService] Role: ${user['role']}');
        print('✅ [AuthService] Token: $token');

        try {
          final parsedUser = _parseUser(user);
          print(
              '✅ [AuthService] Parsed user successfully: ${parsedUser.name}, Role: ${parsedUser.role}');

          return {
            'success': true,
            'user': parsedUser,
            'token': token,
          };
        } catch (parseError) {
          print('❌ [AuthService] Error parsing user: $parseError');
          print('❌ [AuthService] User data was: $user');
          print('❌ [AuthService] Stack trace: ${StackTrace.current}');
          return {
            'success': false,
            'error': 'Error parsing user data: $parseError',
          };
        }
      } else {
        print(
            '❌ [AuthService] Login failed with status ${response.statusCode}');
        print('❌ [AuthService] Response body: ${response.body}');
        try {
          final errorData = jsonDecode(response.body);
          final error = errorData['error'] ?? 'Login failed';
          print('❌ [AuthService] Error message: $error');
          return {
            'success': false,
            'error': error,
          };
        } catch (e) {
          print('❌ [AuthService] Could not parse error response: $e');
          return {
            'success': false,
            'error': 'Login failed with status ${response.statusCode}',
          };
        }
      }
    } on TimeoutException catch (e) {
      print('❌ [AuthService] TIMEOUT ERROR after 10 seconds: $e');
      print(
          '❌ [AuthService] Server at ${ApiConfig.loginEndpoint} is not responding');
      print(
          '❌ [AuthService] Make sure backend is running on http://localhost:3000');
      return {
        'success': false,
        'error':
            'Server timeout - Backend not responding. Make sure server is running at http://localhost:3000',
      };
    } catch (e) {
      print('❌ [AuthService] Exception: $e');
      print('❌ [AuthService] Stack trace: ${StackTrace.current}');
      return {
        'success': false,
        'error': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Get current user
  Future<User?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);

      if (token == null || token.isEmpty) {
        return null;
      }

      final response = await http.get(
        Uri.parse(ApiConfig.meEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Cookie':
              'auth-token=$token', // Changed from 'authToken' to 'auth-token'
        },
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Handle both { user: {...} } and {...} response formats
        final userData = data['user'] ?? data;

        // Update saved user data
        await prefs.setString(_userKey, jsonEncode(userData));

        return _parseUser(userData);
      }

      return null;
    } catch (e) {
      print('Error getting current user: $e');
      return null;
    }
  }

  // Get saved user (offline)
  Future<User?> getSavedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString(_userKey);

      if (userData == null) {
        print('ℹ️ [AuthService] No saved user data');
        return null;
      }

      print('ℹ️ [AuthService] Found saved user data: $userData');

      final data = jsonDecode(userData);
      print(
          'ℹ️ [AuthService] Decoded saved user: ${data['name']}, Role: ${data['role']}');

      final user = _parseUser(data);
      print(
          '✅ [AuthService] Parsed saved user: ${user.name}, Role: ${user.role}');
      return user;
    } catch (e) {
      print('❌ [AuthService] Error getting saved user: $e');
      return null;
    }
  }

  // Parse user based on role
  User _parseUser(Map<String, dynamic> data) {
    try {
      print('📝 [AuthService._parseUser] Raw data: $data');

      final role = data['role']?.toString().toLowerCase() ?? '';
      print('📝 [AuthService._parseUser] Role: $role');

      switch (role) {
        case 'teacher':
          print('📝 [AuthService._parseUser] Parsing as Teacher');
          return Teacher.fromJson(data);
        case 'student':
          print('📝 [AuthService._parseUser] Parsing as Student');
          return Student.fromJson(data);
        case 'parent':
          print('📝 [AuthService._parseUser] Parsing as Parent');
          return Parent.fromJson(data);
        default:
          print('📝 [AuthService._parseUser] Parsing as generic User');
          return User.fromJson(data);
      }
    } catch (e) {
      print('❌ [AuthService._parseUser] Error: $e');
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  // Check if logged in
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    return token != null && token.isNotEmpty;
  }

  // Get token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }
}
