# CSV Import Troubleshooting Guide

## Common Import Errors and Solutions

### 1. Email Validation Errors

**Error**: `Invalid email format` or `Invalid student/parent/teacher email address!`

**Example**: `nimal@gmailcom` (missing dot)

**Solutions**:

- Ensure all emails follow the format: `username@domain.com`
- Check for missing dots (.) in email addresses
- Verify no extra spaces before or after email addresses
- Common mistakes:
  - `user@gmailcom` → should be `user@gmail.com`
  - `user@gmail .com` → should be `user@gmail.com`
  - `user@yahoo .co.uk` → should be `user@yahoo.co.uk`

### 2. Authentication "Forbidden" and "Data validation failed" Errors

**Error**: `Failed to create/update user in authentication system: Forbidden` or `Data validation failed (missing data)`

**Common Causes**:

- Empty or invalid name fields
- Names with special characters that aren't allowed
- Passwords that are too short or weak
- Email format issues
- Missing required data

**Solutions**:

1. **Check your data quality**:

   - Ensure all first names and last names are filled
   - Remove special characters from names (use only letters, spaces, hyphens, apostrophes)
   - Check that emails are valid
   - Ensure passwords are at least 3 characters (system will auto-extend them)

2. **Common data issues**:

   - Empty cells in required fields
   - Names like "123" or "!!!" (use real names)
   - Special characters: `José` → `Jose`, `O'Connor` is OK
   - Passwords: `ab` → will become `ab123456` automatically

3. **Template validation**:

   - Use the provided debug script to check your template
   - Run: `node debug-template.js` and point it to your file
   - Fix any issues it identifies

4. **Try smaller batches** - import 5-10 rows at a time
5. **Check Clerk dashboard** for any account limits

### 3. Duplicate Phone Number Errors

**Error**: `Unique constraint failed on the fields: (phone)`

**Solution**:
The system now automatically handles this by:

- Adding a timestamp suffix to duplicate phone numbers
- Example: `0771234567` becomes `0771234567_1692532800000`

**Prevention**:

- Ensure all phone numbers in your CSV are unique
- Remove duplicate entries before importing

### 4. CSV Format Requirements

#### For Students & Parents:

Required columns:

- `student_first_name`, `student_last_name`, `student_email`, `student_password`
- `student_phone`, `student_sex`, `student_birthday`, `student_grade`, `student_class`
- `parent_first_name`, `parent_last_name`, `parent_email`, `parent_password`
- `parent_phone`, `parent_sex`, `parent_birthday`
- `address`

#### For Teachers:

Required columns:

- `teacher_first_name`, `teacher_last_name`, `teacher_email`, `teacher_password`
- `teacher_phone`, `teacher_sex`, `teacher_birthday`
- `address`, `subjects` (comma-separated)

### 5. Best Practices

1. **Use Excel format** (.xlsx or .xls) - CSV files may have encoding issues
2. **Validate emails** before importing - use email validation tools
3. **Check for duplicates** in your spreadsheet before uploading
4. **Test with small batches** first (5-10 rows)
5. **Keep backups** of your original data
6. **Use proper date format** for birthdays: YYYY-MM-DD (e.g., 1990-05-15)

### 6. Phone Number Format

- Use any format: `0771234567` or `077-123-4567` or `+94771234567`
- System automatically handles duplicates
- Parents must have phone numbers (required field)
- Students and teachers can have empty phone numbers (optional)

### 7. Password Requirements

- **Minimum 3 characters** (system auto-extends to 8 characters)
- **Automatic enhancement**: `abc` becomes `abc12345`
- **Must contain**: At least one letter and one number (auto-added if missing)
- Examples:
  - `pass` → `pass1234` ✅
  - `123` → `A1234567` ✅
  - `password123` → `password123` ✅

### 8. If Errors Persist

1. **Check the specific error message** - it will tell you exactly what's wrong
2. **Fix the data in your spreadsheet** and try again
3. **Contact support** with the exact error message and a sample of your data
4. **Use the sync mode carefully** - it will delete users not in your CSV file

### 9. Example of a Correct CSV Row

```csv
student_first_name,student_last_name,student_email,student_password,student_phone,student_sex,student_birthday,student_grade,student_class,parent_first_name,parent_last_name,parent_email,parent_password,parent_phone,parent_sex,parent_birthday,address
John,Doe,john.doe@gmail.com,student123,0771234567,MALE,2010-05-15,5,A,Jane,Doe,jane.doe@gmail.com,parent123,0779876543,FEMALE,1980-03-20,123 Main St Colombo
```

### 10. Testing Your Data

Before importing large files:

1. Create a test file with 2-3 rows
2. Import the test file first
3. Check if users are created correctly
4. Then import your full dataset

---

## Quick Fix Checklist

- [ ] All emails have proper format (user@domain.com)
- [ ] No duplicate phone numbers
- [ ] Passwords are at least 5 characters
- [ ] Dates are in YYYY-MM-DD format
- [ ] All required fields are filled
- [ ] File is in Excel format (.xlsx)
- [ ] Testing with small batch first
