import prisma from "@/lib/prisma";

/**
 * Generate automatic index number for students
 * Format: YEAR + 4-digit sequential number (e.g., 20250001, 20250002)
 */
export async function generateIndexNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Get the last student with an index number that starts with current year
  const lastStudent = await prisma.student.findFirst({
    where: {
      indexNumber: {
        startsWith: currentYear.toString(),
      },
    },
    orderBy: {
      indexNumber: 'desc',
    },
  });

  let sequenceNumber = 1;
  
  if (lastStudent?.indexNumber) {
    // Extract the sequence number from the last index number
    const lastSequence = parseInt(lastStudent.indexNumber.slice(-4));
    sequenceNumber = lastSequence + 1;
  }

  // Format: YEAR + 4-digit padded sequence (e.g., 20250001)
  const indexNumber = `${currentYear}${sequenceNumber.toString().padStart(4, '0')}`;
  
  return indexNumber;
}

/**
 * Check if an index number already exists
 */
export async function isIndexNumberExists(indexNumber: string): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { indexNumber },
  });
  
  return !!student;
}

/**
 * Generate custom index number with prefix
 * Format: PREFIX + YEAR + 4-digit sequential number (e.g., STD20250001)
 */
export async function generateCustomIndexNumber(prefix: string = ""): Promise<string> {
  const currentYear = new Date().getFullYear();
  const searchPattern = prefix ? `${prefix}${currentYear}` : currentYear.toString();
  
  // Get the last student with an index number matching the pattern
  const lastStudent = await prisma.student.findFirst({
    where: {
      indexNumber: {
        startsWith: searchPattern,
      },
    },
    orderBy: {
      indexNumber: 'desc',
    },
  });

  let sequenceNumber = 1;
  
  if (lastStudent?.indexNumber) {
    // Extract the sequence number from the last index number
    const lastSequence = parseInt(lastStudent.indexNumber.slice(-4));
    sequenceNumber = lastSequence + 1;
  }

  // Format: PREFIX + YEAR + 4-digit padded sequence
  const indexNumber = `${prefix}${currentYear}${sequenceNumber.toString().padStart(4, '0')}`;
  
  return indexNumber;
}

/**
 * Bulk generate index numbers for students without one
 * Returns count of updated students
 */
export async function bulkGenerateIndexNumbers(prefix: string = ""): Promise<number> {
  // Get all students without index numbers
  const studentsWithoutIndex = await prisma.student.findMany({
    where: {
      indexNumber: null,
    },
    orderBy: {
      createdAt: 'asc', // Assign numbers based on registration order
    },
  });

  let count = 0;
  
  for (const student of studentsWithoutIndex) {
    const indexNumber = await generateCustomIndexNumber(prefix);
    
    await prisma.student.update({
      where: { id: student.id },
      data: { indexNumber },
    });
    
    count++;
  }
  
  return count;
}

/**
 * Get next available index number (preview without saving)
 */
export async function getNextIndexNumber(prefix: string = ""): Promise<string> {
  return await generateCustomIndexNumber(prefix);
}
