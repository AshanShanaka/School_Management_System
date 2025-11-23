# O/L Prediction System - Testing Guide

## ✅ Recent Fixes Applied

1. **Complete API Route Rewrite** (`src/app/api/predictions/student/route.ts`)
   - Consolidated feature building logic (direct Prisma queries)
   - Direct ML API integration (no intermediate service layers)
   - Extensive step-by-step logging
   - Better error handling

2. **Fixed Interface Mismatches** (Student & Parent pages)
   - `current_mark` → `current_average`
   - `grade` → `predicted_grade`
   - `attendance_rate` → `attendance_percentage`
   - Fixed pass probability display (multiply by 100)

3. **Project Cleanup**
   - Removed duplicate/backup files
   - Verified database schema (37 models, all legitimate)
   - Confirmed both servers running (Node.js + Python ML API)

---

## 🚀 Testing Steps

### Step 1: Verify Servers Are Running

**Check Next.js Dev Server:**
```powershell
# Should see: ▲ Next.js running on http://localhost:3000
# If not running: npm run dev
```

**Check Python ML API:**
```powershell
# Test health endpoint
curl http://127.0.0.1:5000/health

# Expected response:
# {"status":"healthy"}
```

### Step 2: Clear Browser Cache (CRITICAL!)

1. Open your browser (Chrome/Edge recommended)
2. Press `Ctrl + Shift + Delete`
3. Select "Cached images and files"
4. Click "Clear data"
5. **OR** use hard refresh: `Ctrl + F5`

### Step 3: Open Developer Tools

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Keep this open during testing

### Step 4: Test Student View

1. **Login as Student:**
   - Username: `sajithperera`
   - Password: [use correct password]

2. **Navigate to O/L Prediction:**
   - Go to: `http://localhost:3000/student/ol-prediction`

3. **What to Look For:**

   **Browser Console (F12 → Console):**
   ```
   [Student OL Prediction] Fetching prediction...
   [Student OL Prediction] Response status: 200
   [Student OL Prediction] Full API Response: {data: {...}, success: true}
   [Student OL Prediction] Data fields: {
     has_subject_predictions: true,
     subject_count: 6,
     overall_average: 77.5,
     pass_probability: 0.95,
     attendance_percentage: 83.3,
     risk_level: "LOW"
   }
   ```

   **Server Terminal (Check VS Code terminal):**
   ```
   === STUDENT PREDICTION API REQUEST ===
   [API] User authenticated: {id: 'cmh...', role: 'student', username: 'sajithperera'}
   [API] ML API is online ✓
   [API] Building prediction features...
   [buildStudentFeatures] Found student: {name: 'Sajith Perera', examResults: 53, attendances: 30}
   [buildStudentFeatures] Grouped into 6 subjects
   [buildStudentFeatures] Attendance calculated: 83.3%
   [buildStudentFeatures] Prepared data: {subjects: 6, attendance: 83.3}
   [API] Features built successfully ✓
   [API] Calling ML API...
   [callMLAPI] Calling ML API with: {subjects: 6, attendance: 83.3}
   [callMLAPI] ML API responded with status: 200
   [callMLAPI] ML API response: {success: true, hasData: true, subjects: 6}
   [API] Prediction generated successfully ✓
   [API] Returning data: {subjects: 6, overall_average: 77.5, ...}
   ```

   **UI Display:**
   - Overall Average: Should show actual number (e.g., 77.5%)
   - Pass Probability: Should show actual percentage (e.g., 95%)
   - Attendance: Should show actual rate (e.g., 83.3%)
   - Risk Level: Should show LOW/MEDIUM/HIGH with correct color
   - Subject predictions table should have actual data

### Step 5: Test Parent View

1. **Login as Parent:**
   - Username: `parent` (or specific parent username)
   - Password: [use correct password]

2. **Navigate to O/L Prediction:**
   - Go to: `http://localhost:3000/parent/ol-prediction`

3. **Select Child:**
   - Use dropdown to select child (e.g., "Sajith Perera")

4. **Verify Same Data:**
   - Should show same predictions as student view
   - Same console logs should appear
   - Same UI values

### Step 6: Test Teacher View (Should Already Work)

1. **Login as Teacher:**
   - Username: [teacher username]
   - Password: [use correct password]

2. **Navigate to O/L Prediction:**
   - Go to: `http://localhost:3000/teacher/ol-prediction`

3. **Verify:**
   - Should show list of all students
   - Each student should have predictions

---

## 🐛 Troubleshooting

### Issue: Still Shows 0.0% for All Metrics

**Possible Causes:**
1. Browser cache not cleared
2. Server not restarted with new code
3. ML API not responding
4. Data structure mismatch

**Solutions:**
```powershell
# 1. Hard refresh browser
Ctrl + F5

# 2. Restart Next.js server
Ctrl + C  # Stop server
npm run dev  # Start again

# 3. Check ML API
curl http://127.0.0.1:5000/health

# 4. Check browser console for errors (F12)
```

### Issue: "Console show nothing"

**Possible Causes:**
1. DevTools not open
2. Console tab not selected
3. Console cleared automatically
4. JavaScript errors preventing logs

**Solutions:**
1. Press `F12` → Click "Console" tab
2. Check for red error messages
3. Refresh page while DevTools is open
4. Check Network tab for failed API calls

### Issue: API Returns 401 Unauthorized

**Possible Causes:**
1. Not logged in
2. Session expired
3. Cookie issues

**Solutions:**
1. Login again
2. Clear cookies and login
3. Check if session cookie exists (DevTools → Application → Cookies)

### Issue: API Returns 503 Service Unavailable

**Possible Causes:**
1. Python ML API not running

**Solutions:**
```powershell
# Check if Python process is running
Get-Process python

# If not running, start ML API:
cd Predict
python api.py
```

### Issue: Shows "No data available"

**Possible Causes:**
1. Student has no exam results
2. Student has no attendance records
3. Database query failed

**Solutions:**
1. Check server console for detailed error logs
2. Verify student has data in database:
   ```sql
   -- Check exam results
   SELECT COUNT(*) FROM "ExamResult" WHERE "studentId" = 'cmh...';
   
   -- Check attendance
   SELECT COUNT(*) FROM "Attendance" WHERE "studentId" = 'cmh...';
   ```

---

## 📊 Expected Data for Test Student (sajithperera)

- **Student ID:** `cmh8wj50s000014t1rk6x90l3`
- **Username:** `sajithperera`
- **Exam Results:** 53 records
- **Attendance Records:** 30 records (83.3% present)
- **Subjects:** 6 (Sinhala, English, Mathematics, Science, History, ICT)

**Expected Predictions:**
- Overall Average: ~77.5%
- Pass Probability: ~95%
- Attendance: 83.3%
- Risk Level: LOW
- Predicted Grade: A or B

---

## 🔍 How to Read Console Logs

### Frontend Logs (Browser Console)

```javascript
// Success flow:
[Student OL Prediction] Fetching prediction...          // API call started
[Student OL Prediction] Response status: 200            // API succeeded
[Student OL Prediction] Full API Response: {...}        // Complete response
[Student OL Prediction] Data fields: {                  // Parsed data
  overall_average: 77.5,                                // Should NOT be 0
  pass_probability: 0.95,                               // 0-1 decimal
  attendance_percentage: 83.3                           // Should NOT be 0
}

// Error flow:
[Student OL Prediction] Error fetching data            // Something failed
[Student OL Prediction] Error: <error message>         // Error details
```

### Backend Logs (Server Terminal)

```
// Success flow:
=== STUDENT PREDICTION API REQUEST ===                 // API hit
[API] User authenticated: {role: 'student', ...}       // Auth OK
[API] ML API is online ✓                               // ML service OK
[API] Building prediction features...                  // Starting query
[buildStudentFeatures] Found student: {                // Student found
  name: 'Sajith Perera',
  examResults: 53,                                     // Has data!
  attendances: 30                                      // Has data!
}
[buildStudentFeatures] Prepared data: {subjects: 6}   // Data formatted
[API] Features built successfully ✓                    // Step 1 done
[callMLAPI] Calling ML API...                          // ML call started
[callMLAPI] ML API response: {success: true}           // ML succeeded
[API] Returning data: {...}                            // Response sent

// Error flow:
[API] ML API check failed: <error>                     // ML API offline
[buildStudentFeatures] Error: <error>                  // DB query failed
[callMLAPI] ML API error: <error>                      // ML call failed
```

---

## ✅ Success Checklist

- [ ] Next.js server running (`npm run dev`)
- [ ] Python ML API running (port 5000)
- [ ] Browser cache cleared (Ctrl + F5)
- [ ] DevTools open (F12 → Console)
- [ ] Logged in as correct user
- [ ] Server console shows detailed logs
- [ ] Browser console shows detailed logs
- [ ] UI displays actual numbers (not 0.0%)
- [ ] No red errors in console
- [ ] Network tab shows 200 OK for API calls

---

## 📝 Reporting Issues

If still having problems, provide:

1. **Browser Console Logs** (copy all [Student OL Prediction] logs)
2. **Server Console Logs** (copy all [API] logs from terminal)
3. **Network Tab Info:**
   - F12 → Network → Find `/api/predictions/student`
   - Click it → Check:
     - Status code
     - Response body
     - Request headers
4. **Screenshots:**
   - UI showing the issue
   - Console showing errors
5. **Steps Taken:**
   - What you tested
   - What worked/didn't work

---

## 🎯 What Should Work Now

1. ✅ **Student View** - Shows student's own predictions with real data
2. ✅ **Parent View** - Shows selected child's predictions with real data
3. ✅ **Teacher View** - Shows all students' predictions (was already working)
4. ✅ **Console Logging** - Both browser and server show detailed execution trace
5. ✅ **Error Handling** - Clear error messages if something fails
6. ✅ **Data Display** - Real percentages and grades (not 0.0%)

---

## 🔧 Technical Details

### New API Route Structure

```typescript
GET /api/predictions/student

Flow:
1. Authenticate user (check session)
2. Verify role === 'student'
3. Check ML API health (GET /health)
4. Build features from database:
   - Query student with exam results + attendances
   - Group exam results by subject
   - Calculate attendance percentage
5. Call ML API (POST /api/predict/student)
6. Format and return response

Response Format:
{
  success: true,
  data: {
    subject_predictions: [
      {
        subject_name: "Mathematics",
        current_average: 85.5,
        predicted_grade: "A",
        predicted_mark: 87.3
      },
      // ... more subjects
    ],
    overall_average: 77.5,
    pass_probability: 0.95,  // 0-1 decimal
    attendance_percentage: 83.3,
    risk_level: "LOW"
  }
}
```

### Frontend Display Logic

```typescript
// Pass probability (multiply by 100)
{(predictionData.pass_probability * 100).toFixed(0)}%

// Attendance (already percentage)
{predictionData.attendance_percentage.toFixed(1)}%

// Overall average (already percentage)
{predictionData.overall_average.toFixed(1)}%
```

---

## 📚 Related Documentation

- `MODEL_WORKING_SUMMARY.md` - ML model details
- `OL_PREDICTION_SYSTEM_GUIDE.md` - System architecture
- `IMPLEMENTATION_COMPLETE.md` - Implementation notes
- `QUICK_START.md` - Quick start guide

---

**Last Updated:** [Current Date]
**Version:** 2.0 (Complete Route Rewrite)
**Status:** Ready for Testing
