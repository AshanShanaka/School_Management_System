import * as XLSX from 'xlsx';

interface SubjectMark {
  subjectName: string;
  mark: number;
  maxMarks: number;
  grade: string;
  percentage: number;
}

interface ReportCardData {
  studentId: string;
  studentName: string;
  studentSurname: string;
  className: string;
  examTitle: string;
  year: number;
  term: number;
  subjects: SubjectMark[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  average: number;
  overallGrade: string;
  classRank: number;
  classSize: number;
}

/**
 * Export report cards to Excel format
 * Creates a comprehensive spreadsheet with summary and detailed views
 */
export function exportReportCardsToExcel(reportCards: ReportCardData[]): void {
  if (reportCards.length === 0) {
    throw new Error('No report cards to export');
  }

  const firstCard = reportCards[0];
  const filename = `Report_Cards_${firstCard.className}_${firstCard.examTitle}_${firstCard.year}_Term${firstCard.term}.xlsx`;

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // ========== SUMMARY SHEET ==========
  const summaryData = [
    ['REPORT CARD SUMMARY'],
    ['Class:', firstCard.className],
    ['Exam:', firstCard.examTitle],
    ['Year:', firstCard.year],
    ['Term:', firstCard.term],
    ['Total Students:', reportCards.length],
    [],
    ['Rank', 'Student Name', 'Total Marks', 'Percentage', 'Grade', 'Number of Subjects'],
  ];

  reportCards.forEach((card) => {
    summaryData.push([
      card.classRank,
      `${card.studentName} ${card.studentSurname}`,
      `${card.totalMarks}/${card.totalMaxMarks}`,
      `${card.percentage.toFixed(1)}%`,
      card.overallGrade,
      card.subjects.length,
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths for summary sheet
  summarySheet['!cols'] = [
    { wch: 8 },  // Rank
    { wch: 30 }, // Student Name
    { wch: 15 }, // Total Marks
    { wch: 12 }, // Percentage
    { wch: 8 },  // Grade
    { wch: 18 }, // Number of Subjects
  ];

  // Style the header row
  const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
  for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 7, c: col }); // Row 8 (0-indexed 7)
    if (summarySheet[cellAddress]) {
      summarySheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } },
      };
    }
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // ========== DETAILED SHEET ==========
  const detailedData: any[] = [
    ['DETAILED REPORT CARDS'],
    ['Class:', firstCard.className, '', 'Exam:', firstCard.examTitle],
    ['Year:', firstCard.year, '', 'Term:', firstCard.term],
    [],
  ];

  reportCards.forEach((card, index) => {
    if (index > 0) {
      detailedData.push([]); // Empty row between students
    }

    detailedData.push([
      'Student:',
      `${card.studentName} ${card.studentSurname}`,
      '',
      'Rank:',
      `${card.classRank}/${card.classSize}`,
    ]);
    detailedData.push([
      'Overall Grade:',
      card.overallGrade,
      '',
      'Percentage:',
      `${card.percentage.toFixed(1)}%`,
    ]);
    detailedData.push([
      'Total Marks:',
      `${card.totalMarks}/${card.totalMaxMarks}`,
      '',
      'Average:',
      card.average.toFixed(1),
    ]);
    detailedData.push([]);
    detailedData.push(['Subject', 'Mark', 'Max Marks', 'Percentage', 'Grade']);

    card.subjects.forEach((subject) => {
      detailedData.push([
        subject.subjectName,
        subject.mark,
        subject.maxMarks,
        `${subject.percentage.toFixed(1)}%`,
        subject.grade,
      ]);
    });
  });

  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);

  // Set column widths for detailed sheet
  detailedSheet['!cols'] = [
    { wch: 25 }, // Subject/Label
    { wch: 12 }, // Mark/Value
    { wch: 12 }, // Max Marks
    { wch: 12 }, // Percentage
    { wch: 10 }, // Grade
  ];

  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Report Cards');

  // ========== SUBJECT-WISE ANALYSIS SHEET ==========
  // Get all unique subjects
  const subjectsSet = new Set<string>();
  reportCards.forEach((card) => {
    card.subjects.forEach((subject) => {
      subjectsSet.add(subject.subjectName);
    });
  });
  const subjects = Array.from(subjectsSet).sort();

  const analysisData: any[] = [
    ['SUBJECT-WISE ANALYSIS'],
    ['Student Name', ...subjects, 'Total', 'Percentage', 'Grade', 'Rank'],
  ];

  reportCards.forEach((card) => {
    const row: any[] = [`${card.studentName} ${card.studentSurname}`];

    // Map subject marks
    const subjectMap = new Map(
      card.subjects.map((s) => [s.subjectName, s.mark])
    );

    subjects.forEach((subject) => {
      row.push(subjectMap.get(subject) || '-');
    });

    row.push(
      card.totalMarks,
      `${card.percentage.toFixed(1)}%`,
      card.overallGrade,
      card.classRank
    );

    analysisData.push(row);
  });

  const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);

  // Set column widths for analysis sheet
  const analysisCols = [{ wch: 25 }]; // Student Name
  subjects.forEach(() => analysisCols.push({ wch: 10 })); // Each subject
  analysisCols.push({ wch: 10 }); // Total
  analysisCols.push({ wch: 12 }); // Percentage
  analysisCols.push({ wch: 8 });  // Grade
  analysisCols.push({ wch: 8 });  // Rank

  analysisSheet['!cols'] = analysisCols;

  XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Subject-wise Analysis');

  // ========== GRADE DISTRIBUTION SHEET ==========
  const gradeDistribution = {
    A: reportCards.filter((c) => c.overallGrade === 'A').length,
    B: reportCards.filter((c) => c.overallGrade === 'B').length,
    C: reportCards.filter((c) => c.overallGrade === 'C').length,
    S: reportCards.filter((c) => c.overallGrade === 'S').length,
    W: reportCards.filter((c) => c.overallGrade === 'W').length,
  };

  const statsData = [
    ['GRADE DISTRIBUTION & STATISTICS'],
    [],
    ['Grade', 'Count', 'Percentage'],
    ['A (75%+)', gradeDistribution.A, `${((gradeDistribution.A / reportCards.length) * 100).toFixed(1)}%`],
    ['B (65-74%)', gradeDistribution.B, `${((gradeDistribution.B / reportCards.length) * 100).toFixed(1)}%`],
    ['C (50-64%)', gradeDistribution.C, `${((gradeDistribution.C / reportCards.length) * 100).toFixed(1)}%`],
    ['S (35-49%)', gradeDistribution.S, `${((gradeDistribution.S / reportCards.length) * 100).toFixed(1)}%`],
    ['W (<35%)', gradeDistribution.W, `${((gradeDistribution.W / reportCards.length) * 100).toFixed(1)}%`],
    [],
    ['CLASS STATISTICS'],
    [],
    ['Metric', 'Value'],
    ['Total Students', reportCards.length],
    ['Highest Percentage', `${Math.max(...reportCards.map((c) => c.percentage)).toFixed(1)}%`],
    ['Lowest Percentage', `${Math.min(...reportCards.map((c) => c.percentage)).toFixed(1)}%`],
    ['Average Percentage', `${(reportCards.reduce((sum, c) => sum + c.percentage, 0) / reportCards.length).toFixed(1)}%`],
    ['Pass Rate (>35%)', `${((reportCards.filter((c) => c.percentage >= 35).length / reportCards.length) * 100).toFixed(1)}%`],
  ];

  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [
    { wch: 20 }, // Label
    { wch: 15 }, // Value/Count
    { wch: 15 }, // Percentage
  ];

  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

  // Write the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export a single student's report card to Excel
 */
export function exportSingleReportCardToExcel(reportCard: ReportCardData): void {
  const filename = `Report_Card_${reportCard.studentName}_${reportCard.studentSurname}_${reportCard.examTitle}_${reportCard.year}_Term${reportCard.term}.xlsx`;

  const workbook = XLSX.utils.book_new();

  const data = [
    ['STUDENT REPORT CARD'],
    [],
    ['Student Information'],
    ['Name:', `${reportCard.studentName} ${reportCard.studentSurname}`],
    ['Class:', reportCard.className],
    ['Student ID:', reportCard.studentId],
    [],
    ['Exam Information'],
    ['Exam:', reportCard.examTitle],
    ['Year:', reportCard.year],
    ['Term:', reportCard.term],
    [],
    ['Performance Summary'],
    ['Overall Grade:', reportCard.overallGrade],
    ['Total Marks:', `${reportCard.totalMarks}/${reportCard.totalMaxMarks}`],
    ['Percentage:', `${reportCard.percentage.toFixed(1)}%`],
    ['Average:', reportCard.average.toFixed(1)],
    ['Class Rank:', `${reportCard.classRank}/${reportCard.classSize}`],
    [],
    ['Subject-wise Performance'],
    ['Subject', 'Mark', 'Max Marks', 'Percentage', 'Grade'],
  ];

  reportCard.subjects.forEach((subject) => {
    data.push([
      subject.subjectName,
      subject.mark,
      subject.maxMarks,
      `${subject.percentage.toFixed(1)}%`,
      subject.grade,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Card');
  XLSX.writeFile(workbook, filename);
}
