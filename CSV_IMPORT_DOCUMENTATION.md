# CSV/Excel Import Feature Documentation

## Overview

The CSV/Excel Import feature allows administrators to bulk import students+parents or teachers into the EduNova school management system using CSV or Excel files.

## Features

- ✅ Bulk import students with their parent information
- ✅ Bulk import teachers with subject assignments
- ✅ Support for both CSV (.csv) and Excel (.xlsx, .xls) formats
- ✅ Automatic user creation in Clerk authentication system
- ✅ Data validation with detailed error reporting
- ✅ Update existing users or create new ones
- ✅ Transaction-based operations for data consistency
- ✅ File preview for CSV files
- ✅ Downloadable CSV and Excel templates
- ✅ Admin-only access control

## Supported File Formats

### CSV Files (.csv)

- Standard comma-separated values format
- UTF-8 encoding recommended
- Headers in the first row
- Data rows following the header
- Preview available before import

### Excel Files (.xlsx, .xls)

- Microsoft Excel format
- Uses the first worksheet only
- Headers in the first row (Row 1)
- Data starting from Row 2
- Automatic date conversion from Excel date format
- No preview available (processed directly)

## File Format Requirements

### Students + Parents Format

Required columns (order doesn't matter):

- `student_email` - Valid email address
- `student_password` - At least 8 characters
- `student_first_name` - Student's first name
- `student_last_name` - Student's last name
- `student_phone` - Optional phone number
- `student_birthday` - Date in YYYY-MM-DD format
- `student_class` - Class name (will be created if doesn't exist)
- `student_grade` - Grade level (number)
- `student_sex` - Must be "MALE" or "FEMALE"
- `address` - Shared address for student and parent
- `parent_email` - Valid email address
- `parent_password` - At least 8 characters
- `parent_first_name` - Parent's first name
- `parent_last_name` - Parent's last name
- `parent_phone` - Parent's phone number
- `parent_birthday` - Date in YYYY-MM-DD format
- `parent_sex` - Must be "MALE" or "FEMALE"

### Teachers Format

Required columns:

- `teacher_email` - Valid email address
- `teacher_password` - At least 8 characters
- `teacher_first_name` - Teacher's first name
- `teacher_last_name` - Teacher's last name
- `teacher_phone` - Optional phone number
- `teacher_birthday` - Date in YYYY-MM-DD format
- `teacher_sex` - Must be "MALE" or "FEMALE"
- `address` - Teacher's address
- `subjects` - Optional comma-separated subject names

## Excel-Specific Considerations

### Date Formatting in Excel

- Excel may display dates differently than the required YYYY-MM-DD format
- The system automatically converts Excel date serial numbers
- To ensure compatibility, format date columns as "Text" in Excel
- Or use the format YYYY-MM-DD directly (e.g., 1990-05-15)

### Excel Tips

- Use the first worksheet only (other sheets are ignored)
- Avoid merged cells in the header row
- Keep column headers exactly as specified
- Remove any formatting or formulas from data cells
- Save as .xlsx format for best compatibility

### Excel vs CSV

| Feature       | CSV                        | Excel                |
| ------------- | -------------------------- | -------------------- |
| File size     | Smaller                    | Larger               |
| Preview       | Available                  | Not available        |
| Date handling | Manual formatting required | Automatic conversion |
| Compatibility | Universal                  | Microsoft Excel      |
| Editing       | Text editor                | Excel required       |

## Sample Data

### Students + Parents Sample (CSV format)

```csv
student_email,student_password,student_first_name,student_last_name,student_phone,student_birthday,student_class,student_grade,student_sex,address,parent_email,parent_password,parent_first_name,parent_last_name,parent_phone,parent_birthday,parent_sex
john.doe@example.com,password123,John,Doe,1234567890,2010-01-15,5A,5,MALE,123 Main St,jane.doe@example.com,password123,Jane,Doe,0987654321,1985-03-20,FEMALE
alice.smith@example.com,password123,Alice,Smith,1234567891,2009-05-22,6B,6,FEMALE,456 Oak Ave,bob.smith@example.com,password123,Bob,Smith,0987654322,1983-07-10,MALE
```

### Teachers Sample (CSV format)

```csv
teacher_email,teacher_password,teacher_first_name,teacher_last_name,teacher_phone,teacher_birthday,teacher_sex,address,subjects
math.teacher@example.com,password123,Sarah,Johnson,1234567890,1990-05-15,FEMALE,789 Pine St,Mathematics
science.teacher@example.com,password123,Mike,Wilson,1234567891,1988-09-20,MALE,321 Elm St,Physics,Chemistry
```

## API Endpoints

### POST /api/import

Handles CSV file uploads and processing.

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: CSV file
  - `type`: "students-parents" or "teachers"

**Response:**

```json
{
  "success": true,
  "message": "Import completed. X out of Y records processed successfully.",
  "data": {
    "totalRows": 10,
    "successfulImports": 8,
    "errors": [
      {
        "row": 3,
        "data": {...},
        "error": "Invalid email address"
      }
    ],
    "skipped": []
  }
}
```

## Security Features

- Admin-only access via Clerk authentication
- Password validation (minimum 8 characters)
- Email validation and uniqueness checks
- Transaction-based operations for data consistency
- Secure password handling via Clerk

## Error Handling

- CSV format validation
- Row-by-row error reporting
- Detailed error messages for debugging
- Graceful handling of partial failures
- Rollback on transaction failures

## Technical Implementation

### Key Components

1. **API Route** (`/src/app/api/import/route.ts`)

   - File upload handling
   - CSV parsing and validation
   - User creation/update in Clerk
   - Database operations with Prisma

2. **Frontend Component** (`/src/components/CsvImport.tsx`)

   - File upload interface
   - CSV preview functionality
   - Template download
   - Progress tracking and error display

3. **Admin Page** (`/src/app/(dashboard)/admin/import/page.tsx`)
   - Admin access control
   - Usage instructions
   - Component integration

### Technologies Used

- **Next.js 14** - Full-stack framework
- **Clerk** - Authentication and user management
- **Prisma** - Database ORM with transactions
- **csv-parse** - CSV parsing library
- **Zod** - Data validation
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Usage Instructions

1. **Access the Import Page**

   - Log in as an admin
   - Navigate to "CSV Import" in the admin menu

2. **Download Templates**

   - Click "Download Students+Parents Template" or "Download Teachers Template"
   - Use these as starting points for your data

3. **Prepare Your CSV**

   - Follow the required column format
   - Ensure all required fields are filled
   - Use proper date format (YYYY-MM-DD)
   - Use "MALE" or "FEMALE" for sex fields

4. **Import Process**

   - Select import type (Students+Parents or Teachers)
   - Choose your CSV file
   - Review the preview to ensure proper formatting
   - Click "Import CSV" to start the process

5. **Review Results**
   - Check the import summary
   - Review any errors or skipped records
   - Fix issues and re-import if necessary

## Best Practices

- Always test with a small sample first
- Keep backups of your data
- Review error messages carefully
- Use the provided templates as guides
- Ensure email addresses are unique across the system
