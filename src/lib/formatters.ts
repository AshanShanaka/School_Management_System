// Utility functions for formatting data display

/**
 * Format class display name to avoid redundancy and show clean format
 * @param className - The class name from database
 * @param gradeLevel - The grade level number
 * @returns Formatted class display name (e.g., "11-A")
 */
export function formatClassDisplay(
  className: string,
  gradeLevel?: number
): string {
  if (!className) return "Unknown Class";

  // If grade level is provided, ensure proper formatting
  if (gradeLevel) {
    // Check if it has redundant grade format like "11-11-A"
    const redundantPattern = new RegExp(`^${gradeLevel}-${gradeLevel}-(.+)$`);
    const redundantMatch = className.match(redundantPattern);
    if (redundantMatch) {
      return `${gradeLevel}-${redundantMatch[1]}`;
    }

    // Check if it already has correct format like "11-A"
    const correctPattern = new RegExp(`^${gradeLevel}-(.+)$`);
    if (correctPattern.test(className)) {
      return className; // Already formatted correctly
    }

    // Check if it has format like "Grade 11 - A" or similar
    const gradeTextPattern = /^Grade\s+(\d+)\s*-\s*(.+)$/i;
    const gradeTextMatch = className.match(gradeTextPattern);
    if (gradeTextMatch && parseInt(gradeTextMatch[1]) === gradeLevel) {
      return `${gradeLevel}-${gradeTextMatch[2]}`;
    }

    // If class name doesn't start with grade, prepend it
    if (!className.startsWith(`${gradeLevel}-`)) {
      return `${gradeLevel}-${className}`;
    }
  }

  return className;
}

/**
 * Format full class display with grade
 * @param className - The class name from database
 * @param gradeLevel - The grade level number
 * @returns Full formatted display like "11-A (Grade 11)"
 */
export function formatClassWithGrade(
  className: string,
  gradeLevel?: number
): string {
  const formattedName = formatClassDisplay(className, gradeLevel);
  if (gradeLevel) {
    return `${formattedName} (Grade ${gradeLevel})`;
  }
  return formattedName;
}

/**
 * Format user display name
 * @param name - First name
 * @param surname - Last name
 * @returns Formatted full name
 */
export function formatUserName(name: string, surname: string): string {
  return `${name} ${surname}`;
}

/**
 * Format date for display
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString();
}

/**
 * Format time for display
 * @param date - Date object or string
 * @returns Formatted time string
 */
export function formatTime(date: Date | string): string {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
