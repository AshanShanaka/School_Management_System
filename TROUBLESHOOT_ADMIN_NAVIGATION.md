# 🔍 Admin Navigation Issue Troubleshooting Guide

## Issue: Students and Parents tabs not working for admin user

### 🧩 Quick Diagnostics:

1. **Access the diagnostic page:**

   - Go to: `/admin/diagnostic`
   - This will show your current user info and permissions

2. **Test database connectivity:**
   - Go to: `/admin/test-access`
   - This will test if data can be fetched properly

### 🔧 Common Solutions:

#### Solution 1: Check Authentication

```bash
# In browser console (F12), check:
console.log(document.cookie); // Should see 'auth-token'
```

#### Solution 2: Clear Browser Cache

1. Press `F12` to open dev tools
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or clear cookies for localhost

#### Solution 3: Restart Development Server

```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

#### Solution 4: Check Database Connection

```bash
# Run this in terminal:
npx prisma studio
# Should open database browser at http://localhost:5555
```

#### Solution 5: Reset Authentication

1. Logout completely
2. Clear browser cookies
3. Login again with admin credentials:
   - Username: `admin`
   - Password: `admin123`

### 📊 Expected Behavior:

When logged in as **admin**, you should see these menu items:

- ✅ Home
- ✅ Teachers
- ✅ Students ← Should work
- ✅ Parents ← Should work
- ✅ Subjects
- ✅ Classes
- ✅ Lessons
- ✅ And more...

### 🚨 Error Indicators:

**If you see these, there's an issue:**

- Page shows "Access Denied"
- Redirects to login page
- Shows loading spinner forever
- Console shows 401/403 errors
- Page is blank/white screen

### 🔍 Debug Steps:

1. **Check Current User Info:**

   ```javascript
   // In browser console:
   fetch("/api/admin/attendance/subjects")
     .then((r) => r.json())
     .then(console.log);
   ```

2. **Check Network Tab:**

   - Open F12 → Network tab
   - Click Students tab
   - Look for red errors or redirects

3. **Check Console:**
   - Open F12 → Console tab
   - Look for JavaScript errors

### 💡 Quick Fixes:

**Fix 1: Force Admin Role**

```javascript
// If needed, in browser console:
localStorage.setItem("user-role", "admin");
```

**Fix 2: Manual Navigation**

```javascript
// Navigate directly:
window.location.href = "/list/students";
window.location.href = "/list/parents";
```

### 📞 If Still Not Working:

1. Share screenshot of diagnostic page (`/admin/diagnostic`)
2. Share screenshot of browser console (F12 → Console)
3. Share screenshot of network tab when clicking Students
4. Check if other admin features work (like Subjects, Classes)

---

### ⚡ Quick Test Links:

Use these direct links to test:

- [Students Page](http://localhost:3000/list/students)
- [Parents Page](http://localhost:3000/list/parents)
- [Diagnostic Page](http://localhost:3000/admin/diagnostic)
- [Test Access Page](http://localhost:3000/admin/test-access)

**Note:** Make sure you're logged in as admin first!
