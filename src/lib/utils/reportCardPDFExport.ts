import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
 * Export a single student's report card to PDF
 */
export function exportSingleReportCardToPDF(reportCard: ReportCardData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT REPORT CARD', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // Student Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${reportCard.studentName} ${reportCard.studentSurname}`, 14, yPos);
  yPos += 6;
  doc.text(`Class: ${reportCard.className}`, 14, yPos);
  yPos += 6;
  doc.text(`Student ID: ${reportCard.studentId}`, 14, yPos);
  yPos += 12;

  // Exam Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Exam Information', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exam: ${reportCard.examTitle}`, 14, yPos);
  yPos += 6;
  doc.text(`Academic Year: ${reportCard.year}`, 14, yPos);
  yPos += 6;
  doc.text(`Term: ${reportCard.term}`, 14, yPos);
  yPos += 12;

  // Performance Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary', 14, yPos);
  yPos += 8;

  // Create summary box
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 5, pageWidth - 28, 30, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  const col1X = 20;
  const col2X = pageWidth / 2 + 10;

  doc.text(`Overall Grade: ${reportCard.overallGrade}`, col1X, yPos);
  doc.text(`Class Rank: ${reportCard.classRank}/${reportCard.classSize}`, col2X, yPos);
  yPos += 7;

  doc.text(
    `Total Marks: ${reportCard.totalMarks}/${reportCard.totalMaxMarks}`,
    col1X,
    yPos
  );
  doc.text(`Percentage: ${reportCard.percentage.toFixed(1)}%`, col2X, yPos);
  yPos += 7;

  doc.text(`Average: ${reportCard.average.toFixed(1)}`, col1X, yPos);
  yPos += 15;

  // Subject-wise Performance Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject-wise Performance', 14, yPos);
  yPos += 5;

  const tableData = reportCard.subjects.map((subject) => [
    subject.subjectName,
    subject.mark.toString(),
    subject.maxMarks.toString(),
    `${subject.percentage.toFixed(1)}%`,
    subject.grade,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Subject', 'Mark', 'Max Marks', 'Percentage', 'Grade']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo color
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 60 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    finalY + 15,
    { align: 'center' }
  );

  // Save the PDF
  const filename = `Report_Card_${reportCard.studentName}_${reportCard.studentSurname}_${reportCard.examTitle}_${reportCard.year}_Term${reportCard.term}.pdf`;
  doc.save(filename);
}

/**
 * Export multiple report cards to PDF
 * Creates a comprehensive document with all students' report cards
 */
export function exportReportCardsToPDF(reportCards: ReportCardData[]): void {
  if (reportCards.length === 0) {
    throw new Error('No report cards to export');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const firstCard = reportCards[0];

  // Cover Page
  let yPos = pageWidth / 3;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS REPORT CARDS', pageWidth / 2, yPos, { align: 'center' });

  yPos += 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Class: ${firstCard.className}`, pageWidth / 2, yPos, {
    align: 'center',
  });

  yPos += 10;
  doc.text(`Exam: ${firstCard.examTitle}`, pageWidth / 2, yPos, {
    align: 'center',
  });

  yPos += 10;
  doc.text(
    `Academic Year: ${firstCard.year} - Term ${firstCard.term}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  yPos += 15;
  doc.setFontSize(12);
  doc.text(`Total Students: ${reportCards.length}`, pageWidth / 2, yPos, {
    align: 'center',
  });

  // Summary Table
  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Performance Summary', pageWidth / 2, yPos, {
    align: 'center',
  });
  yPos += 10;

  const summaryData = reportCards.map((card) => [
    card.classRank.toString(),
    `${card.studentName} ${card.studentSurname}`,
    `${card.totalMarks}/${card.totalMaxMarks}`,
    `${card.percentage.toFixed(1)}%`,
    card.overallGrade,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Student Name', 'Total Marks', 'Percentage', 'Grade']],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 70 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Individual Report Cards (one per page)
  reportCards.forEach((card, index) => {
    doc.addPage();
    yPos = 20;

    // Student Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${card.studentName} ${card.studentSurname}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Class: ${card.className} | Rank: ${card.classRank}/${card.classSize}`, pageWidth / 2, yPos, {
      align: 'center',
    });

    yPos += 15;

    // Performance Summary Box
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, pageWidth - 28, 25, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    const col1X = 20;
    const col2X = pageWidth / 2 + 10;

    doc.text(`Overall Grade: ${card.overallGrade}`, col1X, yPos);
    doc.text(`Percentage: ${card.percentage.toFixed(1)}%`, col2X, yPos);
    yPos += 7;

    doc.text(
      `Total Marks: ${card.totalMarks}/${card.totalMaxMarks}`,
      col1X,
      yPos
    );
    doc.text(`Average: ${card.average.toFixed(1)}`, col2X, yPos);

    yPos += 13;

    // Subject Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Subject-wise Performance', 14, yPos);
    yPos += 5;

    const subjectData = card.subjects.map((subject) => [
      subject.subjectName,
      subject.mark.toString(),
      subject.maxMarks.toString(),
      `${subject.percentage.toFixed(1)}%`,
      subject.grade,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Subject', 'Mark', 'Max', 'Percentage', 'Grade']],
      body: subjectData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 65 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Student ${index + 1} of ${reportCards.length} | Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0); // Reset text color
  });

  // Save the PDF
  const filename = `Class_Report_Cards_${firstCard.className}_${firstCard.examTitle}_${firstCard.year}_Term${firstCard.term}.pdf`;
  doc.save(filename);
}
