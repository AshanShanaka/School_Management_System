import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Check if user is already logged in
  Future<void> checkLoginStatus() async {
    print('🔐 Checking login status...');
    _isLoading = true;
    notifyListeners();

    try {
      final isLoggedIn = await _authService.isLoggedIn();
      print('🔐 Is logged in: $isLoggedIn');

      if (isLoggedIn) {
        // Get saved user from local storage
        _user = await _authService.getSavedUser();
        print('🔐 Got saved user: ${_user?.name}');

        if (_user != null && _user!.role.isNotEmpty) {
          _isAuthenticated = true;
          print('✅ User authenticated: ${_user!.name}, Role: ${_user!.role}');
        } else {
          print('❌ No valid user found');
          _isAuthenticated = false;
        }
      } else {
        print('🔐 User not logged in');
        _isAuthenticated = false;
      }
    } catch (e) {
      print('❌ Error checking login status: $e');
      _isAuthenticated = false;
    }

    _isLoading = false;
    notifyListeners();
    print('🔐 Check complete - isAuthenticated: $_isAuthenticated');
  }

  // Login
  Future<bool> login(String username, String password) async {
    print('🔑 Starting login for: $username');

    // Clear any existing user data first
    _user = null;
    _isAuthenticated = false;
    _errorMessage = null;
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _authService.login(username, password);
      print('🔑 Login result: ${result['success']}');

      if (result['success'] == true) {
        _user = result['user'];
        _isAuthenticated = true;
        print('✅ Login successful: ${_user?.name}, Role: ${_user?.role}');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result['error'] ?? 'Login failed';
        print('❌ Login failed: $_errorMessage');
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Connection error: ${e.toString()}';
      print('❌ Login exception: $_errorMessage');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    print('🚪 Logging out user: ${_user?.name}');
    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    _errorMessage = null;
    print('✅ Logout complete - user cleared');
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Clear all auth state - use on app start
  Future<void> clearAuthState() async {
    print('🧹 Clearing all auth state');
    await _authService.logout(); // Clear SharedPreferences
    _user = null;
    _isAuthenticated = false;
    _errorMessage = null;
    _isLoading = false;
    print('✅ Auth state cleared');
    notifyListeners();
  }
}
