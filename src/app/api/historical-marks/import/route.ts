import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from 'xlsx';

/**
 * POST /api/historical-marks/import
 * Upload and process Excel file with historical marks (Grade 9/10)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    // Only admin and teachers can import
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and teachers can import marks." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const termName = formData.get("termName") as string;
    const classId = formData.get("classId") as string;
    const historicalGrade = formData.get("historicalGrade") as string; // "9" or "10"

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!termName) {
      return NextResponse.json(
        { error: "Term name is required" },
        { status: 400 }
      );
    }

    if (!historicalGrade || (historicalGrade !== "9" && historicalGrade !== "10")) {
      return NextResponse.json(
        { error: "Historical grade must be 9 or 10" },
        { status: 400 }
      );
    }

    // Get the historical grade record
    const historicalGradeRecord = await prisma.grade.findFirst({
      where: { level: parseInt(historicalGrade) }
    });

    if (!historicalGradeRecord) {
      return NextResponse.json(
        { error: `Grade ${historicalGrade} not found in system` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false
    });

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    // Validate headers
    const headers = Object.keys(jsonData[0]);
    if (!headers.includes('IndexNo')) {
      return NextResponse.json(
        { error: "Missing required column: IndexNo" },
        { status: 400 }
      );
    }
    if (!headers.includes('StudentName')) {
      return NextResponse.json(
        { error: "Missing required column: StudentName" },
        { status: 400 }
      );
    }

    // Extract subject names from headers
    const subjectNames = headers.filter(
      h => h !== 'IndexNo' && h !== 'StudentName'
    );

    if (subjectNames.length === 0) {
      return NextResponse.json(
        { error: "No subject columns found in Excel file" },
        { status: 400 }
      );
    }

    // Get subjects from database
    const subjects = await prisma.subject.findMany({
      where: {
        name: {
          in: subjectNames
        }
      }
    });

    const subjectMap = new Map(subjects.map(s => [s.name, s.id]));

    // Track statistics
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const importedMarks: any[] = []; // Store imported marks for preview

    // Extract term number from termName
    let termNumber = 1;
    const termMatch = termName.match(/[Tt]erm\s*(\d+)/);
    if (termMatch) {
      termNumber = parseInt(termMatch[1]);
    }

    const currentYear = new Date().getFullYear();
    const examType = "UNIT";

    // Create or find exam ONCE for the entire import (not per student)
    // Use upsert to handle existing exams with the unique constraint (year, term, gradeId, examTypeEnum)
    const exam = await prisma.exam.upsert({
      where: {
        year_term_gradeId_examTypeEnum: {
          year: currentYear,
          term: termNumber,
          gradeId: historicalGradeRecord.id,
          examTypeEnum: examType,
        }
      },
      create: {
        title: termName,
        gradeId: historicalGradeRecord.id,
        year: currentYear,
        term: termNumber,
        examTypeEnum: examType,
        status: "PUBLISHED",
      },
      update: {
        // Update title if it changed
        title: termName,
      }
    });

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // Excel row number

      try {
        const indexNumber = row['IndexNo']?.toString().trim();
        const studentName = row['StudentName']?.toString().trim();

        if (!indexNumber) {
          errors.push(`Row ${rowNum}: Missing IndexNo`);
          errorCount++;
          continue;
        }

        // Find student by index number
        const student = await prisma.student.findUnique({
          where: { indexNumber },
          include: { grade: true }
        });

        if (!student) {
          errors.push(`Row ${rowNum}: Student not found with IndexNo ${indexNumber}`);
          skippedCount++;
          continue;
        }

        // Prepare student marks entry for preview
        const studentMarks: any = {
          indexNumber: student.indexNumber,
          studentName: `${student.name} ${student.surname}`,
          marks: {},
          hasErrors: false,
          errors: [],
        };

        // Process marks for each subject
        for (const subjectName of subjectNames) {
          const markValue = row[subjectName];
          
          // Skip if no mark
          if (markValue === null || markValue === undefined || markValue === '') {
            studentMarks.marks[subjectName] = { value: null, status: 'empty' };
            continue;
          }

          const mark = parseFloat(markValue);
          
          if (isNaN(mark) || mark < 0 || mark > 100) {
            errors.push(`Row ${rowNum}: Invalid mark for ${subjectName} - "${markValue}"`);
            studentMarks.marks[subjectName] = { 
              value: markValue, 
              status: 'error',
              error: 'Invalid mark (must be 0-100)'
            };
            studentMarks.hasErrors = true;
            studentMarks.errors.push(`${subjectName}: Invalid mark`);
            continue;
          }

          const subjectId = subjectMap.get(subjectName);
          if (!subjectId) {
            errors.push(`Row ${rowNum}: Subject "${subjectName}" not found in database`);
            studentMarks.marks[subjectName] = { 
              value: mark, 
              status: 'error',
              error: 'Subject not found'
            };
            studentMarks.hasErrors = true;
            studentMarks.errors.push(`${subjectName}: Subject not found`);
            continue;
          }

          // Mark as valid
          studentMarks.marks[subjectName] = { 
            value: Math.round(mark), 
            status: 'valid'
          };

          // Mark as valid
          studentMarks.marks[subjectName] = { 
            value: Math.round(mark), 
            status: 'valid'
          };

          // Create or update exam subject
          let examSubject = await prisma.examSubject.findFirst({
            where: {
              examId: exam.id,
              subjectId: subjectId,
            }
          });

          if (!examSubject) {
            examSubject = await prisma.examSubject.create({
              data: {
                examId: exam.id,
                subjectId: subjectId,
                maxMarks: 100,
                marksEntered: true,
              }
            });
          }

          // Create or update exam result
          await prisma.examResult.upsert({
            where: {
              examSubjectId_studentId: {
                examSubjectId: examSubject.id,
                studentId: student.id,
              }
            },
            create: {
              examId: exam.id,
              examSubjectId: examSubject.id,
              studentId: student.id,
              marks: Math.round(mark),
            },
            update: {
              marks: Math.round(mark),
            }
          });
        }

        // Add to imported marks preview
        importedMarks.push(studentMarks);
        processedCount++;
      } catch (error: any) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: ${error.message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed successfully`,
      stats: {
        totalRows: jsonData.length,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
      termName,
      subjects: subjectNames, // Include subject names
      importedMarks: importedMarks, // Include detailed marks data
    });

  } catch (error: any) {
    console.error("Error importing historical marks:", error);
    return NextResponse.json(
      { error: "Failed to import historical marks: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/historical-marks/import/template
 * Download Excel template with student data pre-filled
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const gradeLevel = searchParams.get("grade"); // e.g., "11"
    const historicalGrade = searchParams.get("historicalGrade"); // "9" or "10" - which grade marks we're importing

    // Get subjects (O/L subjects if available, otherwise all subjects)
    let subjects = await prisma.subject.findMany({
      where: {
        isOLSubject: true,
      },
      orderBy: {
        name: 'asc',
      }
    });

    // If no O/L subjects found, get all subjects
    if (subjects.length === 0) {
      subjects = await prisma.subject.findMany({
        orderBy: {
          name: 'asc',
        }
      });
    }

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found in the system. Please add subjects first." },
        { status: 400 }
      );
    }

    let students;
    let classInfo = null;
    
    if (classId) {
      // Get class information first to know which grade it is
      classInfo = await prisma.class.findUnique({
        where: {
          id: parseInt(classId),
        },
        include: {
          grade: true,
        }
      });

      if (!classInfo) {
        return NextResponse.json(
          { error: "Class not found" },
          { status: 400 }
        );
      }

      // Get students from specific class
      students = await prisma.student.findMany({
        where: {
          classId: parseInt(classId),
        },
        include: {
          grade: true,
        },
        orderBy: [
          { indexNumber: 'asc' },
          { name: 'asc' },
        ]
      });
    } else if (gradeLevel) {
      // Get all students from specific grade
      students = await prisma.student.findMany({
        where: {
          grade: {
            level: parseInt(gradeLevel),
          }
        },
        include: {
          grade: true,
        },
        orderBy: [
          { indexNumber: 'asc' },
          { name: 'asc' },
        ]
      });
    } else {
      return NextResponse.json(
        { error: "Please provide either classId or grade parameter" },
        { status: 400 }
      );
    }

    // Validate we have students
    if (!students || students.length === 0) {
      const gradeInfo = classInfo ? `Grade ${classInfo.grade.level}` : (gradeLevel ? `Grade ${gradeLevel}` : 'the selected class');
      return NextResponse.json(
        { error: `No students found in ${gradeInfo}. Please add students to this class first.` },
        { status: 400 }
      );
    }

    // Create template data
    const headers = [
      'IndexNo',
      'StudentName',
      ...subjects.map(s => s.name)
    ];

    const rows = students.map(student => {
      const row: any = {
        'IndexNo': student.indexNumber || student.id,
        'StudentName': `${student.name} ${student.surname}`,
      };
      
      subjects.forEach(subject => {
        row[subject.name] = ''; // Empty for marks
      });
      
      return row;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    
    // Set column widths
    const columnWidths = [
      { wch: 12 }, // IndexNo
      { wch: 25 }, // StudentName
      ...subjects.map(() => ({ wch: 12 }))
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historical Marks');

    // Add instructions sheet
    const gradeInfo = classInfo ? classInfo.grade.level.toString() : (gradeLevel || 'selected');
    const className = classInfo ? classInfo.name : 'Selected Class';
    const importingForGrade = historicalGrade || 'historical';
    
    const instructions = [
      ['INSTRUCTIONS FOR HISTORICAL MARKS IMPORT'],
      [''],
      ['IMPORTANT: You are importing Grade ' + importingForGrade + ' historical marks'],
      ['Students listed are from: ' + className + ' (Grade ' + gradeInfo + ')'],
      [''],
      ['1. Fill in marks for each subject (0-100)'],
      ['2. Leave cells empty if student was absent'],
      ['3. Do not change IndexNo or StudentName columns'],
      ['4. Do not add or remove columns'],
      ['5. Save file after filling marks'],
      ['6. Upload the file back in the system'],
      [''],
      ['IMPORTANT NOTES:'],
      ['- Marks must be between 0 and 100'],
      ['- Use numbers only, no text or symbols'],
      ['- IndexNo must match existing students in the system'],
      ['- Each row represents one student'],
      ['- These are Grade ' + importingForGrade + ' historical marks (from when students were in Grade ' + importingForGrade + ')'],
      ['- These marks feed into O/L prediction system'],
      [''],
      ['Date Generated: ' + new Date().toLocaleString()],
      ['Total Students: ' + students.length],
      ['Current Class: ' + className + ' (Grade ' + gradeInfo + ')'],
      ['Importing Marks For: Grade ' + importingForGrade],
    ];
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Historical_Marks_Template_${Date.now()}.xlsx"`,
      },
    });

  } catch (error: any) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template: " + error.message },
      { status: 500 }
    );
  }
}
