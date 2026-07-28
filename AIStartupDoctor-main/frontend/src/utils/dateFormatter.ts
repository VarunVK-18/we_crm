/**
 * Utility functions for consistent date formatting across the application
 */

export type DateFormatType = 'short' | 'medium' | 'long' | 'full';

/**
 * Format date in a professional, consistent format
 * @param date - Date string, Date object, or timestamp
 * @param format - Format type: 'short' (12 Oct 2025), 'medium' (12 October 2025), 'long' (12 October, 2025), 'full' (Monday, 12 October 2025)
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | number, format: DateFormatType = 'short'): string => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC'
  };

  switch (format) {
    case 'short':
      // Format: 12 Oct 2025
      options.day = 'numeric';
      options.month = 'short';
      options.year = 'numeric';
      break;
    case 'medium':
      // Format: 12 October 2025
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
    case 'long':
      // Format: 12 October, 2025
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
    case 'full':
      // Format: Monday, 12 October 2025
      options.weekday = 'long';
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
  }

  return dateObj.toLocaleDateString('en-GB', options);
};

/**
 * Format date for file names (YYYY-MM-DD format)
 * @param date - Date string, Date object, or timestamp
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForFilename = (date: string | Date | number = new Date()): string => {
  const dateObj = new Date(date);
  return dateObj.toISOString().split('T')[0];
};

/**
 * Format date with time for timestamps
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date | number): string => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
};

/**
 * Get relative time (e.g., "2 days ago", "1 month ago")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 */
export const getRelativeTime = (date: string | Date | number): string => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  
  return `${Math.floor(diffInDays / 365)} years ago`;
};