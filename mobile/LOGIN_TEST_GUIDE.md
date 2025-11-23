# 🔧 Login Test Guide

## ✅ App is Running

The Flutter app has been successfully built and is running on your emulator.

---

## 🧪 Test Login Now

### Step 1: Open the App
- The app should be showing on your emulator
- You should see the EduNova login screen

### Step 2: Try Login with Teacher Account
```
Username: ravi.perera@wkcc.lk
Password: (your password - same as web)
```

### Step 3: Watch Console Output
After clicking "Sign In", you should see logs like:
```
📱 AuthProvider: Starting login...
🔐 Login attempt - URL: http://10.0.2.2:3000/api/auth/login
🔐 Response Status: 200
📱 AuthProvider: Login successful! User: Ravi, Role: teacher
```

---

## ❌ If Login Doesn't Work

### Check 1: Is Web Backend Running?
```powershell
# Open another terminal and check
cd C:\Users\User\OneDrive\Desktop\Projects\Final Year\FYP\school_management_system
npm run dev

# Should show: ✓ Ready in X ms
```

### Check 2: What Error Do You See?
- Does the button do nothing?
- Does it show "Invalid credentials"?
- Does it show "Connection error"?

### Check 3: Copy Console Output
Look at the terminal where Flutter is running and copy any 🔐 or 📱 logs you see.

---

## 🎯 Test Accounts

### Real Teacher (Database):
```
Username: ravi.perera@wkcc.lk
Password: (you know this)
```

### Test Teacher (Hardcoded):
```
Username: teacher1
Password: teacher123
```

---

## 📱 After Successful Login

You should see:
1. ✅ Teacher Dashboard
2. ✅ Bottom navigation with 4 tabs
3. ✅ Hamburger menu (☰) with 20 items
4. ✅ Can navigate to Students, Parents, Lessons screens

---

## 🔍 Troubleshooting

### Problem: "Cannot login as teacher"

**Possible Causes:**
1. ❌ Backend not running → Start with `npm run dev`
2. ❌ Wrong password → Try test account first
3. ❌ App issue → Check console logs

**To Fix:**
1. Make sure backend shows `✓ Ready` message
2. Try `teacher1` / `teacher123` first
3. If that works, then use your real password
4. Copy/paste console output here if still failing

---

**Please try logging in now and tell me:**
1. What happens when you click Sign In?
2. What do you see in the console?
3. Does it work with `teacher1` / `teacher123`?

