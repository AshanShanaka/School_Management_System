#!/usr/bin/env node

/**
 * Sample Data Generator for EduNova CSV Import Testing
 * 
 * This script generates sample CSV files with realistic data for testing
 * the CSV import functionality.
 * 
 * Usage:
 *   node generate-sample-data.js [type] [count]
 * 
 * Examples:
 *   node generate-sample-data.js students-parents 50
 *   node generate-sample-data.js teachers 20
 */

const fs = require('fs');
const path = require('path');

// Sample data arrays
const firstNames = {
  male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Paul', 'Steven', 'Kenneth', 'Andrew', 'Brian'],
  female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle']
};

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']; // Deprecated - blood type field removed
const sexes = ['MALE', 'FEMALE'];
const classes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'];
const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Art', 'Music', 'Physical Education', 'Computer Science'];

const streets = ['Main St', 'Oak Ave', 'Pine St', 'Elm St', 'Cedar Rd', 'Maple Dr', 'Park Ave', 'First St', 'Second Ave', 'Third St'];

// Helper functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateEmail(firstName, lastName, domain = 'example.com') {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generatePhone() {
  return `${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateAddress() {
  return `${Math.floor(Math.random() * 9999) + 1} ${randomChoice(streets)}`;
}

function generateStudentParentData(count) {
  const data = [];
  const headers = [
    'student_email', 'student_password', 'student_first_name', 'student_last_name',
    'student_phone', 'student_birthday', 'student_class', 'student_grade',
    'student_sex', 'address', 'parent_email', 'parent_password',
    'parent_first_name', 'parent_last_name', 'parent_phone', 'parent_birthday',
    'parent_sex'
  ];

  data.push(headers.join(','));

  for (let i = 0; i < count; i++) {
    const studentSex = randomChoice(sexes);
    const parentSex = randomChoice(sexes);
    
    const studentFirstName = randomChoice(firstNames[studentSex.toLowerCase()]);
    const studentLastName = randomChoice(lastNames);
    const parentFirstName = randomChoice(firstNames[parentSex.toLowerCase()]);
    const parentLastName = studentLastName; // Same family name
    
    const studentClass = randomChoice(classes);
    const grade = parseInt(studentClass.match(/\d+/)[0]);
    
    const row = [
      generateEmail(studentFirstName, studentLastName, 'student.edu'),
      'TempPass123!',
      studentFirstName,
      studentLastName,
      generatePhone(),
      randomDate(new Date(2008, 0, 1), new Date(2015, 11, 31)), // Student age 8-15
      studentClass,
      grade.toString(),
      studentSex,
      generateAddress(),
      generateEmail(parentFirstName, parentLastName, 'parent.com'),
      'TempPass123!',
      parentFirstName,
      parentLastName,
      generatePhone(),
      randomDate(new Date(1980, 0, 1), new Date(1995, 11, 31)), // Parent age 28-43
      parentSex
    ];

    data.push(row.join(','));
  }

  return data.join('\n');
}

function generateTeacherData(count) {
  const data = [];
  const headers = [
    'teacher_email', 'teacher_password', 'teacher_first_name', 'teacher_last_name',
    'teacher_phone', 'teacher_birthday', 'teacher_sex',
    'address', 'subjects'
  ];

  data.push(headers.join(','));

  for (let i = 0; i < count; i++) {
    const teacherSex = randomChoice(sexes);
    const firstName = randomChoice(firstNames[teacherSex.toLowerCase()]);
    const lastName = randomChoice(lastNames);
    
    // Assign 1-3 random subjects
    const teacherSubjects = [];
    const numSubjects = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numSubjects; j++) {
      const subject = randomChoice(subjects);
      if (!teacherSubjects.includes(subject)) {
        teacherSubjects.push(subject);
      }
    }
    
    const row = [
      generateEmail(firstName, lastName, 'teacher.edu'),
      'TempPass123!',
      firstName,
      lastName,
      generatePhone(),
      randomDate(new Date(1985, 0, 1), new Date(2000, 11, 31)), // Teacher age 23-38
      teacherSex,
      generateAddress(),
      teacherSubjects.join(',')
    ];

    data.push(row.join(','));
  }

  return data.join('\n');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'students-parents';
  const count = parseInt(args[1]) || 10;

  if (!['students-parents', 'teachers'].includes(type)) {
    console.error('Error: Type must be "students-parents" or "teachers"');
    process.exit(1);
  }

  if (isNaN(count) || count < 1 || count > 1000) {
    console.error('Error: Count must be a number between 1 and 1000');
    process.exit(1);
  }

  console.log(`Generating ${count} ${type} records...`);

  let csvData;
  let filename;

  if (type === 'students-parents') {
    csvData = generateStudentParentData(count);
    filename = `sample-students-parents-${count}.csv`;
  } else {
    csvData = generateTeacherData(count);
    filename = `sample-teachers-${count}.csv`;
  }

  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, csvData);

  console.log(`✅ Generated ${filename} with ${count} records`);
  console.log(`📁 File saved to: ${outputPath}`);
  console.log('\n📝 Sample data includes:');
  console.log('   - Realistic names and email addresses');
  console.log('   - Valid phone numbers and addresses');
  console.log('   - Appropriate age ranges');
  console.log('   - Standard password: TempPass123!');
  console.log('   - Random blood types and sex assignments');
  
  if (type === 'students-parents') {
    console.log('   - Students aged 8-15, Parents aged 28-43');
    console.log('   - Classes from 1A-12B with matching grades');
    console.log('   - Family name consistency between student/parent');
  } else {
    console.log('   - Teachers aged 23-38');
    console.log('   - 1-3 random subject assignments per teacher');
  }

  console.log('\n⚠️  Remember to:');
  console.log('   - Review and modify data as needed');
  console.log('   - Change passwords before production use');
  console.log('   - Ensure email domains are appropriate');
  console.log('   - Verify all data meets your requirements');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateStudentParentData,
  generateTeacherData
};
