# CSV/Excel Import Troubleshooting Guide

## Common "Unprocessable Entity" Errors

### Excel-Specific Issues

#### Excel Date Format Problems

**Error**: `Invalid birthday format or future date`

**Causes**:

- Excel automatically formats dates as serial numbers
- Dates displayed as numbers like 44927 instead of 2023-01-15
- Excel regional date formats (DD/MM/YYYY vs MM/DD/YYYY)

**Solutions**:

- Format date columns as "Text" before entering data
- Use YYYY-MM-DD format directly (1990-05-15)
- Avoid Excel's automatic date formatting
- Copy-paste dates as values, not formulas

**Excel Date Formatting Steps**:

1. Select date columns
2. Right-click → Format Cells
3. Choose "Text" category
4. Enter dates as YYYY-MM-DD

#### Excel Column Header Issues

**Error**: `CSV file is missing required columns`

**Causes**:

- Extra spaces in column headers
- Excel auto-correcting header names
- Merged cells in header row
- Hidden characters or formatting

**Solutions**:

- Copy headers exactly from template
- Remove any cell formatting from headers
- Avoid merged cells in Row 1
- Use "Paste Special → Values" when copying headers

#### Excel File Corruption

**Error**: `Failed to parse Excel file`

**Causes**:

- File saved in wrong format
- Corrupted Excel file
- Protected worksheets
- Macros or formulas in data cells

**Solutions**:

- Save as .xlsx format (not .xls or .xlsm)
- Remove all formulas and use values only
- Unprotect worksheet if protected
- Use "Save As" to create a clean copy

### 1. **Email Format Issues**

**Error**: `Failed to create/update user in authentication system: Invalid email format`

**Causes**:

- Email contains invalid characters
- Email has consecutive dots (..)
- Email starts or ends with a dot
- Email is too long (>254 characters)

**Solutions**:

- Use standard email format: `user@domain.com`
- Remove spaces from email addresses
- Ensure emails don't have special characters other than `@ . _ - +`
- Check for typos in email addresses

**Example Valid Emails**:

```
john.doe@example.com
user123@school.edu
teacher_01@academy.org
```

**Example Invalid Emails**:

```
john..doe@example.com     ❌ (consecutive dots)
.john@example.com         ❌ (starts with dot)
john@.example.com         ❌ (domain starts with dot)
john doe@example.com      ❌ (space in email)
```

### 2. **Password Requirements**

**Error**: `Failed to create/update user in authentication system: Password does not meet requirements`

**Clerk Password Requirements**:

- Minimum 8 characters
- Maximum 128 characters
- Should not contain only spaces
- Avoid common passwords like "password123"

**Solutions**:

- Use passwords with at least 8 characters
- Mix letters and numbers
- Avoid spaces in passwords
- Use unique passwords for each user

**Example Valid Passwords**:

```
mypass123
school2024
student@123
```

### 3. **Name Format Issues**

**Error**: `Failed to create/update user in authentication system: Invalid username format`

**Causes**:

- Names contain numbers or special characters
- Names are too long (>50 characters)
- Names contain emojis or unusual Unicode characters

**Solutions**:

- Use only letters, spaces, hyphens, and apostrophes
- Keep names under 50 characters
- Remove numbers from names
- Use standard Latin characters

**Example Valid Names**:

```
John Smith
Mary-Jane Watson
O'Connor
José García (accented characters are OK)
```

**Example Invalid Names**:

```
John123           ❌ (contains numbers)
User@Name         ❌ (contains @)
😊 John          ❌ (contains emoji)
```

### 4. **Date Format Issues**

**Error**: `Invalid birthday format or future date`

**Required Format**: `YYYY-MM-DD` (ISO format)

**Solutions**:

- Use 4-digit year, 2-digit month, 2-digit day
- Separate with hyphens (-)
- Ensure date is not in the future
- Ensure date is a valid calendar date

**Example Valid Dates**:

```
1990-05-15
2010-01-01
1985-12-31
```

**Example Invalid Dates**:

```
05/15/1990        ❌ (wrong format)
1990-5-15         ❌ (single digit month)
15-05-1990        ❌ (day first)
2025-01-01        ❌ (future date)
1990-13-01        ❌ (invalid month)
```

### 5. **Duplicate Email Addresses**

**Error**: `Student and parent must have different email addresses`

**Solution**:

- Ensure each student has a unique email
- Ensure each parent has a unique email
- Student and parent emails must be different
- Check for accidental duplicates in your CSV

### 6. **Sex Field Issues**

**Error**: `Sex must be MALE or FEMALE`

**Solutions**:

- Use exactly "MALE" or "FEMALE" (all caps)
- Don't use "M", "F", "Male", "Female", "male", "female"
- Remove any extra spaces

**Correct Values**:

```
MALE
FEMALE
```

### 7. **Username Generation Issues**

**Error**: `Invalid username format`

**Causes**:

- Email username part contains only numbers
- Email username part is empty after removing special characters
- Generated username conflicts with existing usernames

**Solutions**:

- The system automatically generates usernames from email addresses
- Ensure email addresses have valid local parts (before @)
- Avoid emails like `123@domain.com` or `@domain.com`

## Debugging Steps

### Step 1: Check Your CSV File

1. Open your CSV in a text editor (not Excel)
2. Verify the header row matches exactly:
   ```
   student_email,student_password,student_first_name,student_last_name,student_phone,student_birthday,student_class,student_grade,student_sex,address,parent_email,parent_password,parent_first_name,parent_last_name,parent_phone,parent_birthday,parent_sex
   ```
3. Check for missing commas or extra commas
4. Ensure no empty rows
5. Remove any Excel formulas or formatting

### Step 2: Validate Data Manually

For each failed row, check:

- [ ] Email format is correct
- [ ] Password is at least 8 characters
- [ ] Names contain only letters, spaces, hyphens, apostrophes
- [ ] Dates are in YYYY-MM-DD format
- [ ] Sex values are "MALE" or "FEMALE"
- [ ] No duplicate emails
- [ ] All required fields are filled

### Step 3: Test with Sample Data

Use this sample row to test:

```csv
student_email,student_password,student_first_name,student_last_name,student_phone,student_birthday,student_class,student_grade,student_sex,address,parent_email,parent_password,parent_first_name,parent_last_name,parent_phone,parent_birthday,parent_sex
test.student@example.com,testpass123,John,Doe,1234567890,2010-01-15,5A,5,MALE,123 Main Street,test.parent@example.com,testpass456,Jane,Doe,0987654321,1985-03-20,FEMALE
```

### Step 4: Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for detailed error messages
4. Look for network requests to `/api/import`

## Prevention Tips

1. **Use the Template**: Always start with the downloaded template
2. **Validate Before Upload**: Check your data manually before importing
3. **Test Small Batches**: Import 1-2 rows first to test
4. **Keep Backups**: Save your original CSV files
5. **Use Standard Formats**: Stick to the documented formats
6. **Check Requirements**: Review the CSV format requirements before creating your file

## Common Fix Patterns

### Fix Email Issues

```javascript
// Remove spaces and convert to lowercase
email = email.trim().toLowerCase();

// Check for valid format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  // Fix the email format
}
```

### Fix Date Issues

```javascript
// Convert from DD/MM/YYYY to YYYY-MM-DD
const parts = date.split("/");
const isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
  2,
  "0"
)}`;
```

### Fix Name Issues

```javascript
// Clean name - remove numbers and special characters
const cleanName = name.replace(/[^a-zA-Z\s\-'\.]/g, "").trim();
```

## Still Having Issues?

If you're still experiencing problems:

1. **Check Server Logs**: Look at the console output for detailed error messages
2. **Verify Clerk Configuration**: Ensure Clerk is properly configured
3. **Test Single User Creation**: Try creating one user manually through the UI
4. **Check Database Connection**: Verify Prisma can connect to the database
5. **Contact Support**: Provide the specific error message and sample data

## Error Code Reference

| Error Type                | Meaning                | Action                      |
| ------------------------- | ---------------------- | --------------------------- |
| 422 Unprocessable Entity  | Data validation failed | Fix data format             |
| 400 Bad Request           | Invalid request format | Check CSV structure         |
| 401 Unauthorized          | Not logged in as admin | Login with admin account    |
| 403 Forbidden             | Not admin user         | Use admin account           |
| 500 Internal Server Error | Server/database issue  | Check logs, contact support |
