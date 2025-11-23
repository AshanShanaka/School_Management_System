# 🔧 Quick Troubleshooting Guide

## Your Issue: Login refreshes but doesn't navigate to dashboard

This usually means one of these things:

### 1. ❌ Backend is NOT running
- **Check**: Is `npm run dev` running in another terminal?
- **Test**: Open browser and go to `http://localhost:3000`
- **Should see**: Your web application
- **If not**: Run `npm run dev` in the main project folder

### 2. ❌ Wrong credentials (password)
- **Problem**: User exists but password is wrong
- **Test in web first**: Try logging in at `http://localhost:3000`
- **If web works**: Use EXACT same username and password in mobile
- **If web doesn't work**: Need to reset password in database

### 3. ❌ User doesn't exist in database
- **Check**: Run the test script to see if user exists
- **Users you mentioned**: 
  - `ravi.perera@wkcc.lk`
  - `kamala.senanayake@wkcc.lk`

### 4. ❌ Mobile not reaching backend
- **Check**: Flutter console for error messages
- **Look for**: 🔐 emoji logs I just added
- **Common error**: Connection timeout = backend not running

---

## 🎯 Step-by-Step Fix

### STEP 1: Verify Backend is Running
```powershell
# Open PowerShell in project root
cd C:\Users\User\OneDrive\Desktop\Projects\Final Year\FYP\school_management_system

# Check if running
# You should see "Local: http://localhost:3000"
```

### STEP 2: Test Login in Web Browser
1. Open: `http://localhost:3000`
2. Try login with: `ravi.perera@wkcc.lk` + password
3. **If it works** → Go to Step 3
4. **If it fails** → Password is wrong, need to check database

### STEP 3: Check Mobile Console
1. Look at VS Code terminal where Flutter is running
2. After clicking "Sign In" button, you should see:
   ```
   📱 AuthProvider: Starting login...
   📱 AuthProvider: Calling auth service...
   🔐 Login attempt - URL: http://10.0.2.2:3000/api/auth/login
   🔐 Login attempt - Username: ravi.perera@wkcc.lk
   🔐 Response Status: 200
   🔐 Login successful! User data: {...}
   ```

3. **If you see status 401** → Wrong password
4. **If you see timeout error** → Backend not running
5. **If you see status 200 but still refreshes** → Bug in routing

### STEP 4: Try Test Accounts
If your real users don't work, try these hardcoded test accounts first:

**Teacher:**
- Username: `teacher1`
- Password: `teacher123`

**Student:**
- Username: `student1`
- Password: `student123`

**Parent:**
- Username: `parent1`
- Password: `parent123`

These are hardcoded in the backend and WILL work if backend is running.

---

## 📊 What the Logs Mean

### ✅ Good Logs (Login Working):
```
📱 AuthProvider: Starting login...
🔐 Login attempt - URL: http://10.0.2.2:3000/api/auth/login
🔐 Response Status: 200
🔐 Login successful! User data: {name: Ravi, role: teacher}
📱 AuthProvider: Login successful! User: Ravi, Role: teacher
📱 AuthProvider: isAuthenticated = true
```

### ❌ Bad Logs (Wrong Password):
```
📱 AuthProvider: Starting login...
🔐 Login attempt - URL: http://10.0.2.2:3000/api/auth/login
🔐 Response Status: 401
🔐 Error: Invalid credentials
📱 AuthProvider: Login failed - Invalid credentials
```

### ❌ Bad Logs (Backend Not Running):
```
📱 AuthProvider: Starting login...
🔐 Login exception: TimeoutException after 0:00:30.000000
📱 AuthProvider: Exception - Connection error
```

---

## 🚀 Quick Test NOW

1. **In VS Code Terminal Tab 1** (Main project):
   ```powershell
   cd C:\Users\User\OneDrive\Desktop\Projects\Final Year\FYP\school_management_system
   npm run dev
   ```
   Wait until you see: `✓ Ready in X ms`

2. **In VS Code Terminal Tab 2** (Mobile):
   ```powershell
   cd mobile
   flutter run
   ```
   Wait until app appears on emulator

3. **In Mobile App**:
   - Try username: `teacher1`
   - Try password: `teacher123`
   - Click "Sign In"

4. **Watch Terminal Tab 2** (Flutter console):
   - Should see 🔐 and 📱 emoji logs
   - Look for status code and error messages

5. **If test account works**:
   - Backend is running ✅
   - Mobile connection works ✅
   - Now try your real user credentials

---

## 🔍 Finding Real User Passwords

If you don't know the passwords for `ravi.perera@wkcc.lk` and `kamala.senanayake@wkcc.lk`:

**Option A**: Check your documentation/notes where passwords were set

**Option B**: Try logging into the web app with different passwords until you find the right one

**Option C**: Reset password in database (need SQL access)

**Option D**: Ask the actual users what their password is

---

## 💡 My Prediction

Based on the "refresh" behavior, I think:
1. ✅ Backend IS running (otherwise you'd see connection error)
2. ❌ Password is WRONG (that's why it refreshes - login fails but error not showing)

**To confirm**: Look at the Flutter console when you click "Sign In" - you'll see the exact error!

---

## Next Step

**Please do this NOW and tell me what you see:**

1. Keep mobile app running
2. Try login with username: `teacher1` and password: `teacher123`
3. Copy and paste the console output here (the lines with 🔐 and 📱)

This will tell me EXACTLY what's wrong!

