/**
 * Converts camelCase or PascalCase to readable text with spaces
 * @param {string} text - The text to convert
 * @returns {string} - Converted text with spaces
 * 
 * Examples:
 * - "firstName" -> "First Name"
 * - "fullName" -> "Full Name"
 * - "addressLine1" -> "Address Line 1"
 * - "zipCode" -> "Zip Code"
 * - "createdAt" -> "Created At"
 */
export function camelCaseToText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Handle special cases
  const specialCases = {
    'id': 'ID',
    'url': 'URL',
    'api': 'API',
    'html': 'HTML',
    'css': 'CSS',
    'js': 'JS',
  };
  
  // Replace special cases
  let result = text;
  Object.keys(specialCases).forEach(key => {
    const regex = new RegExp(key, 'gi');
    result = result.replace(regex, specialCases[key]);
  });
  
  // Insert space before capital letters and numbers
  result = result
    // Insert space before capital letters (but not at the start)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space before numbers
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Insert space after numbers before letters
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Capitalize first letter
    .replace(/^./, str => str.toUpperCase());
  
  return result;
}

/**
 * Formats field names for display
 * @param {string} fieldName - The field name to format
 * @returns {string} - Formatted field name
 */
export function formatFieldName(fieldName) {
  return camelCaseToText(fieldName);
}

