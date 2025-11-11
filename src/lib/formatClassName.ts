/**
 * Format class name to display only grade and section (e.g., "11-A", "11-B")
 * Removes stream/subject information for cleaner display
 * 
 * @param className - Full class name (e.g., "11-Science-A", "11-Arts-B")
 * @returns Formatted class name (e.g., "11-A", "11-B")
 */
export function formatClassName(className: string): string {
  if (!className) return "";
  
  // Match pattern: Grade-Stream-Section or Grade-Section
  const match = className.match(/^(\d+)[-\s](?:\w+[-\s])?([A-Z])$/i);
  
  if (match) {
    const grade = match[1];
    const section = match[2].toUpperCase();
    return `${grade}-${section}`;
  }
  
  // If pattern doesn't match, return original
  return className;
}

/**
 * Format multiple class names
 * 
 * @param classNames - Array of class names or comma-separated string
 * @returns Formatted class names joined by comma
 */
export function formatClassNames(classNames: string[] | string): string {
  if (Array.isArray(classNames)) {
    return classNames.map(formatClassName).join(", ");
  }
  
  if (typeof classNames === "string") {
    return classNames.split(",").map((name) => formatClassName(name.trim())).join(", ");
  }
  
  return "";
}
