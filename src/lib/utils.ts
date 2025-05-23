/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/utils.ts - Enhanced with proper date and currency formatting
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Enhanced date formatting function with proper timezone handling
 * @param dateInput - Date string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateInput: string | Date | number,
  options: {
    includeTime?: boolean;
    format?: 'short' | 'medium' | 'long' | 'relative';
    timeZone?: string;
  } = {}
): string {
  const {
    includeTime = true,
    format = 'medium',
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } = options;

  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateInput === 'string') {
      // Handle ISO strings and other date formats
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      throw new Error('Invalid date input');
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid date';
    }

    // Handle relative formatting
    if (format === 'relative') {
      return formatRelativeTime(date);
    }

    // Base formatting options
    const baseOptions: Intl.DateTimeFormatOptions = {
      timeZone,
    };

    // Configure based on format type
    switch (format) {
      case 'short':
        Object.assign(baseOptions, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        if (includeTime) {
          Object.assign(baseOptions, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
        break;
        
      case 'medium':
        Object.assign(baseOptions, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        });
        if (includeTime) {
          Object.assign(baseOptions, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
        break;
        
      case 'long':
        Object.assign(baseOptions, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        });
        if (includeTime) {
          Object.assign(baseOptions, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
        }
        break;
        
      default:
        Object.assign(baseOptions, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        if (includeTime) {
          Object.assign(baseOptions, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
    }

    return new Intl.DateTimeFormat('en-US', baseOptions).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  try {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
    ];

    if (Math.abs(diffInSeconds) < 60) {
      return 'Just now';
    }

    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        const timeString = `${count} ${interval.label}${count !== 1 ? 's' : ''}`;
        return diffInSeconds < 0 ? `in ${timeString}` : `${timeString} ago`;
      }
    }

    return 'Just now';
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Unknown time';
  }
}

/**
 * Enhanced currency formatting function
 * @param amount - Amount to format
 * @param currencySymbol - Currency symbol (default: ₦)
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  currencySymbol: string = '₦',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
    locale = 'en-US'
  } = options;

  try {
    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if amount is valid
    if (isNaN(numAmount)) {
      return showSymbol ? `${currencySymbol}0.00` : '0.00';
    }

    // Format the number
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numAmount);

    return showSymbol ? `${currencySymbol}${formatted}` : formatted;
  } catch (error) {
    console.error('Currency formatting error:', error);
    return showSymbol ? `${currencySymbol}0.00` : '0.00';
  }
}

/**
 * Parse currency string to number
 * @param currencyString - Currency string to parse
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  try {
    // Remove currency symbols and formatting
    const cleaned = currencyString.replace(/[₦$£€,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Currency parsing error:', error);
    return 0;
  }
}

/**
 * Format file size in human readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format phone number for display
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  try {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Nigerian numbers
    if (cleaned.startsWith('234') && cleaned.length === 13) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    
    // Handle numbers starting with 0 (local Nigerian format)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    // Handle international format
    if (cleaned.length > 10) {
      const countryCode = cleaned.slice(0, -10);
      const number = cleaned.slice(-10);
      return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    
    // Default formatting for shorter numbers
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return phoneNumber;
  } catch (error) {
    console.error('Phone number formatting error:', error);
    return phoneNumber;
  }
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Generate initials from name
 * @param name - Full name
 * @returns Initials
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Generate a random color for avatars
 * @param seed - Seed string for consistent colors
 * @returns CSS color class
 */
export function generateAvatarColor(seed: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Generate random ID
 * @param length - Length of ID
 * @returns Random ID string
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate email address
 * @param email - Email to validate
 * @returns True if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Nigerian format)
 * @param phone - Phone number to validate
 * @returns True if valid phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Nigerian phone number patterns
  const patterns = [
    /^234[0-9]{10}$/, // +234XXXXXXXXXX
    /^0[0-9]{10}$/, // 0XXXXXXXXXX
    /^[0-9]{10}$/, // XXXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Format large numbers with suffixes (K, M, B)
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (num < 1000000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
}

/**
 * Format message content preview
 * @param content - Message content
 * @param maxLength - Maximum length for preview
 * @returns Formatted preview
 */
export function formatMessagePreview(content: string, maxLength: number = 50): string {
  if (!content) return 'No content';
  
  // Remove extra whitespace and newlines
  const cleaned = content.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  
  return cleaned.slice(0, maxLength).trim() + '...';
}

/**
 * Calculate message units (SMS pages)
 * @param message - Message content
 * @returns Number of SMS units
 */
export function calculateMessageUnits(message: string): number {
  if (!message) return 0;
  
  const length = message.length;
  
  // Single SMS can contain up to 160 characters
  // Longer messages are split into 153-character segments
  if (length <= 160) return 1;
  
  return Math.ceil(length / 153);
}

/**
 * Get time zone aware date
 * @param date - Date input
 * @returns Date adjusted for local timezone
 */
export function getLocalDate(date: string | Date): Date {
  try {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    
    // Return the date as-is since JavaScript Date handles timezone automatically
    // when displaying or formatting
    return inputDate;
  } catch (error) {
    console.error('Local date conversion error:', error);
    return new Date();
  }
}

/**
 * Format duration in human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Safe JSON parse with fallback
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}