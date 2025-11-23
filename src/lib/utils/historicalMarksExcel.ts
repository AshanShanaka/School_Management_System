import * as XLSX from 'xlsx';

/**
 * Generate Excel template for historical marks import
 * Format: IndexNo | StudentName | Subject1 | Subject2 | ...
 */
export interface HistoricalMarksTemplate {
  students: Array<{
    indexNumber: string;
    name: string;
  }>;
  subjects: Array<{
    name: string;
    code?: string;
  }>;
}

/**
 * Generate and download Excel template
 */
export function generateHistoricalMarksTemplate(
  templateData: HistoricalMarksTemplate,
  termName: string = "Grade 9 - Term 1"
): void {
  const { students, subjects } = templateData;

  // Create headers
  const headers = [
    'IndexNo',
    'StudentName',
    ...subjects.map(s => s.name)
  ];

  // Create data rows with student info pre-filled
  const dataRows = students.map(student => {
    const row: any = {
      'IndexNo': student.indexNumber || '',
      'StudentName': student.name || '',
    };
    
    // Add empty cells for each subject
    subjects.forEach(subject => {
      row[subject.name] = ''; // Empty for marks to be filled
    });
    
    return row;
  });

  // If no students, create sample row
  if (dataRows.length === 0) {
    const sampleRow: any = {
      'IndexNo': '20250001',
      'StudentName': 'Sample Student',
    };
    subjects.forEach(subject => {
      sampleRow[subject.name] = '85'; // Sample mark
    });
    dataRows.push(sampleRow);
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // IndexNo
    { wch: 25 }, // StudentName
    ...subjects.map(() => ({ wch: 12 })) // Subject columns
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historical Marks');

  // Add instructions sheet
  const instructions = [
    ['INSTRUCTIONS FOR HISTORICAL MARKS IMPORT'],
    [''],
    ['1. Fill in marks for each subject (0-100)'],
    ['2. Leave cells empty if student was absent'],
    ['3. Do not change IndexNo or StudentName columns'],
    ['4. Do not add or remove columns'],
    ['5. Save file after filling marks'],
    ['6. Upload the file in the system'],
    [''],
    ['IMPORTANT:'],
    ['- Marks must be between 0 and 100'],
    ['- Use numbers only, no text'],
    ['- IndexNo must match existing students'],
    ['- Each row represents one student'],
    [''],
    ['Term: ' + termName],
    ['Date Generated: ' + new Date().toLocaleDateString()],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Generate filename
  const sanitizedTermName = termName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Historical_Marks_Template_${sanitizedTermName}_${Date.now()}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
}

/**
 * Parse uploaded Excel file
 */
export interface ParsedHistoricalMarks {
  termName: string;
  marks: Array<{
    indexNumber: string;
    studentName: string;
    subjectMarks: Record<string, number>; // subject name -> mark
  }>;
  subjects: string[];
  errors: string[];
}

export function parseHistoricalMarksExcel(
  file: File | ArrayBuffer,
  expectedSubjects: string[]
): Promise<ParsedHistoricalMarks> {
  return new Promise((resolve, reject) => {
    const processExcelData = (buffer: ArrayBuffer) => {
      try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
          defval: null,
          raw: false 
        });

        const errors: string[] = [];
        const marks: ParsedHistoricalMarks['marks'] = [];
        const subjects: string[] = [];

        // Validate headers
        if (jsonData.length === 0) {
          errors.push('Excel file is empty');
          resolve({ termName: '', marks: [], subjects: [], errors });
          return;
        }

        const headers = Object.keys(jsonData[0]);
        
        // Check required columns
        if (!headers.includes('IndexNo')) {
          errors.push('Missing required column: IndexNo');
        }
        if (!headers.includes('StudentName')) {
          errors.push('Missing required column: StudentName');
        }

        // Extract subject columns
        headers.forEach(header => {
          if (header !== 'IndexNo' && header !== 'StudentName') {
            subjects.push(header);
          }
        });

        if (subjects.length === 0) {
          errors.push('No subject columns found');
        }

        // Process each row
        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // Excel row number (header is row 1)
          
          const indexNumber = row['IndexNo']?.toString().trim();
          const studentName = row['StudentName']?.toString().trim();

          // Validate row data
          if (!indexNumber) {
            errors.push(`Row ${rowNum}: Missing IndexNo`);
            return;
          }
          if (!studentName) {
            errors.push(`Row ${rowNum}: Missing StudentName`);
            return;
          }

          // Extract subject marks
          const subjectMarks: Record<string, number> = {};
          let hasAnyMark = false;

          subjects.forEach(subject => {
            const markValue = row[subject];
            
            if (markValue === null || markValue === undefined || markValue === '') {
              // Empty cell - student was absent
              return;
            }

            const mark = parseFloat(markValue);
            
            if (isNaN(mark)) {
              errors.push(`Row ${rowNum}: Invalid mark for ${subject} - "${markValue}"`);
              return;
            }

            if (mark < 0 || mark > 100) {
              errors.push(`Row ${rowNum}: Mark for ${subject} must be between 0-100 (got ${mark})`);
              return;
            }

            subjectMarks[subject] = mark;
            hasAnyMark = true;
          });

          // Only add if has at least one mark
          if (hasAnyMark) {
            marks.push({
              indexNumber,
              studentName,
              subjectMarks,
            });
          }
        });

        resolve({
          termName: 'Imported',
          marks,
          subjects,
          errors,
        });
      } catch (error) {
        reject(error);
      }
    };

    try {
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            processExcelData(e.target.result as ArrayBuffer);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        processExcelData(file);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download sample Excel template (no student data)
 */
export function downloadSampleTemplate(subjects: string[]): void {
  const sampleData = {
    students: [
      { indexNumber: '20250001', name: 'John Doe' },
      { indexNumber: '20250002', name: 'Jane Smith' },
      { indexNumber: '20250003', name: 'Bob Johnson' },
    ],
    subjects: subjects.map(name => ({ name })),
  };

  generateHistoricalMarksTemplate(sampleData, 'Grade 9 - Term 1 (Sample)');
}
