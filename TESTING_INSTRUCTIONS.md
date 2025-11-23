# Testing Instructions - Student & Parent Predictions

## Changes Made
1. ✅ Fixed all interface field names to match ML API response
2. ✅ Fixed `pass_probability` calculation (multiply by 100 since it's 0-1 decimal)
3. ✅ Added extensive console logging to help debug
4. ✅ Updated both student and parent pages

## How to Test

### Step 1: Open Browser Developer Tools
1. Open your browser (Chrome/Edge)
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Clear the console (click the 🚫 icon)

### Step 2: Test as Student
1. Login as student: `sajithperera`
2. Navigate to: **O/L Prediction** (or `/student/ol-prediction`)
3. **Watch the Console** - you should see:
   ```
   [Student OL Prediction] Fetching prediction...
   [Student OL Prediction] Response status: 200
   [Student OL Prediction] Full API Response: {success: true, ...}
   [Student OL Prediction] Extracted prediction data: {...}
   [Student OL Prediction] Data fields: {
     has_subject_predictions: true,
     subject_count: 6,
     overall_average: 77.5,
     pass_probability: 0.95,
     attendance_percentage: 83.3,
     risk_level: "LOW"
   }
   ```

4. **Check the Dashboard:**
   - Predicted Average should show a number (e.g., 77.5%)
   - Pass Rate should show a percentage (e.g., 95%)
   - Attendance should show ~83%
   - Passing Subjects should show "6/6" or similar
   - Risk Status should show "LOW", "MEDIUM", or "HIGH"
   - Subject chart should have colored bars
   - Subject table should list all subjects

### Step 3: Test as Parent
1. Login as parent: `nimalperera` (Sajith's parent)
2. Navigate to: **O/L Prediction** (or `/parent/ol-prediction`)
3. **Watch the Console** - you should see:
   ```
   [Parent OL Prediction] Fetching prediction for child: cmhtdb2ea0002uhegm6pt6gc8
   [Parent OL Prediction] Response status: 200
   [Parent OL Prediction] Full API Response: {success: true, ...}
   [Parent OL Prediction] Extracted prediction data: {...}
   ```

4. **Check the Dashboard:**
   - Child dropdown should show: "Sajith Perera - Grade 11A"
   - All KPI cards should have values (not 0%)
   - Subject table should show all subjects

### Step 4: If You Still See 0.0%

**Check the Console Logs:**

#### If you see "Response status: 401" or "Unauthorized"
- You're not logged in correctly
- Try logging out and logging back in
- Clear browser cookies

#### If you see "Response status: 503" or "ML API offline"
- The Python ML API is not running
- Start it with: `cd Predict ; python api.py`
- Verify with: `curl http://127.0.0.1:5000/health`

#### If you see "No prediction data available"
- The student might not have enough exam data
- Check with: `node scripts/check-sajith.js`
- The student needs at least 3-5 exam results per subject

#### If the response looks good but dashboard shows 0%
- Check if `data.overall_average` exists in the console log
- Check if `data.subject_predictions` is an array with items
- Look for any JavaScript errors in the console (red text)
- Try hard refresh: **Ctrl + F5** (Windows) or **Cmd + Shift + R** (Mac)

### Step 5: Check Server Logs

In the terminal where you ran `npm run dev`, you should see:
```
[Student Prediction] User authenticated: {id: '...', role: 'student', ...}
[Student Prediction] Checking ML API health...
[Student Prediction] ML API status: ONLINE
[Student Prediction] Fetching prediction for student: cmhtdb2ea0002uhegm6pt6gc8
[getLatestPrediction] Starting for student: cmhtdb2ea0002uhegm6pt6gc8
[getLatestPrediction] Features built: {subjects: 6, attendance: 83.33}
[getLatestPrediction] Success: {subjects: 6, average: 77.5}
[Student Prediction] Raw prediction result: {
  "subject_predictions": [...],
  "overall_average": 77.5,
  ...
}
```

## What the Console Logs Tell You

### Browser Console (F12):
- Shows what the **frontend** receives from the API
- Shows any JavaScript errors
- Shows the actual data being displayed

### Terminal/Server Console:
- Shows what the **backend** is doing
- Shows ML API calls and responses
- Shows database queries

## Common Issues & Solutions

### Issue 1: "Grade 1111-A" instead of "11-A"
**Solution**: Already fixed in the code, but if you still see it:
- Check the database: The grade level field might be corrupted
- Run: `node scripts/check-relationships.js` to verify

### Issue 2: "No Children Found" for parents
**Solution**: 
- Verify parent is logged in (check username in console log)
- Check parent-student relationships: `node scripts/check-relationships.js`
- Make sure you're using the correct parent username (e.g., `nimalperera`)

### Issue 3: Empty subject table
**Solution**:
- The API might be returning data but in wrong format
- Check console log for the `subject_predictions` array
- Each item should have: `subject`, `current_average`, `predicted_mark`, `predicted_grade`

### Issue 4: Chart not showing
**Solution**:
- Check if `subject_predictions` array has items
- Check for CSS/styling errors in console
- Try zooming out the browser (Ctrl + Mouse Wheel)

## Expected Console Output (Good)

```javascript
// Student Page
[Student OL Prediction] Full API Response: {
  success: true,
  mlApiStatus: "online",
  data: {
    subject_predictions: [
      {
        subject: "Mathematics",
        current_average: 75.5,
        predicted_mark: 78.2,
        predicted_grade: "A",
        confidence: 0.85,
        trend: "IMPROVING"
      },
      // ... more subjects
    ],
    overall_average: 76.8,
    pass_probability: 0.95,  // Note: This is 0-1, not 0-100
    risk_level: "LOW",
    risk_status: "On Track",
    attendance_percentage: 83.3,
    total_subjects: 6,
    recommendations: ["Keep up the good work..."]
  }
}
```

## Quick Fix Commands

```powershell
# Check if ML API is running
curl http://127.0.0.1:5000/health

# Start ML API if needed
cd Predict
python api.py

# Start Next.js dev server
npm run dev

# Check student data
node scripts/check-sajith.js

# Check parent relationships
node scripts/check-relationships.js

# Clear Next.js cache
Remove-Item .next -Recurse -Force
npm run dev
```

## Contact Points

If issues persist, provide:
1. **Browser console logs** (F12 → Console tab → screenshot)
2. **Server terminal output** (where `npm run dev` is running)
3. **ML API response** (`curl http://127.0.0.1:5000/health`)
4. **Username you're testing with**

---

**Last Updated**: 2025-11-21  
**Status**: Ready for testing with extensive logging
