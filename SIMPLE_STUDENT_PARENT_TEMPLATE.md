# Simple Student + Parent Excel Template

## Required Columns (EXACT column names):

| Column Name        | Description                   | Example                 | Required |
| ------------------ | ----------------------------- | ----------------------- | -------- |
| student_email      | Student email address         | john.doe@student.com    | ✅       |
| student_password   | Student password (any length) | pass123                 | ✅       |
| student_first_name | Student first name            | John                    | ✅       |
| student_last_name  | Student last name             | Doe                     | ✅       |
| student_phone      | Student phone (optional)      | +1234567890             | ❌       |
| student_birthday   | Student birthday              | 2010-05-15              | ✅       |
| student_class      | Student class                 | 5A                      | ✅       |
| student_grade      | Student grade (1-12)          | 5                       | ✅       |
| student_sex        | Student gender                | MALE or FEMALE (or M/F) | ✅       |
| address            | Shared address                | 123 Main St, City       | ✅       |
| parent_email       | Parent email address          | parent@email.com        | ✅       |
| parent_password    | Parent password (any length)  | parent123               | ✅       |
| parent_first_name  | Parent first name             | Jane                    | ✅       |
| parent_last_name   | Parent last name              | Doe                     | ✅       |
| parent_phone       | Parent phone number           | +1234567890             | ✅       |
| parent_birthday    | Parent birthday               | 1980-03-20              | ✅       |
| parent_sex         | Parent gender                 | MALE or FEMALE (or M/F) | ✅       |

## Sample Excel Data:

```
student_email           | student_password | student_first_name | student_last_name | student_phone | student_birthday | student_class | student_grade | student_sex | address          | parent_email       | parent_password | parent_first_name | parent_last_name | parent_phone | parent_birthday | parent_sex
john.doe@student.com    | pass123         | John               | Doe              |               | 2010-05-15       | 5A           | 5             | MALE        | 123 Main St     | jane.doe@email.com | parent123      | Jane              | Doe             | +1234567890  | 1980-03-20      | FEMALE
mary.smith@student.com  | mary456         | Mary               | Smith            | +1234567891   | 2009-08-22       | 6B           | 6             | F           | 456 Oak Ave     | bob.smith@email.com| bob456         | Bob               | Smith           | +1234567892  | 1975-11-10      | M
```

## Important Notes:

### Simplified Validation:

- **Emails**: Just need to contain "@" symbol
- **Passwords**: Any length, will be automatically extended if too short
- **Names**: Special characters will be automatically cleaned
- **Sex**: Accepts MALE/FEMALE or M/F (automatically converted)
- **Dates**: YYYY-MM-DD format
- **Phone**: Optional for students, required for parents

### Tips:

1. **Make sure column names are EXACTLY as shown above**
2. **Don't worry about password complexity** - system will handle it
3. **Email uniqueness**: Student and parent emails can be similar (system will handle duplicates)
4. **Class names**: Any format works (5A, Class 5, Fifth Grade, etc.)
5. **Phone numbers**: Can be any format with numbers

### Common Issues Fixed:

- ✅ No strict email validation
- ✅ No complex password requirements
- ✅ Automatic data cleaning
- ✅ Flexible date parsing
- ✅ Automatic duplicate handling

### Excel File Requirements:

- File format: .xlsx or .xls
- First row must contain the exact column headers
- At least one data row
- Empty cells are handled automatically
