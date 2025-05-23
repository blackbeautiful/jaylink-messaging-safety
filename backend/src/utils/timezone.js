// backend/src/utils/timezone.js
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Timezone utility functions for consistent date/time handling
 */
class TimezoneUtils {
  constructor() {
    this.appTimezone = config.timezone || 'Africa/Lagos';
  }

  /**
   * Get current time in application timezone
   * @returns {Date} Current date in app timezone
   */
  getCurrentTime() {
    return new Date().toLocaleString('en-US', { 
      timeZone: this.appTimezone 
    });
  }

  /**
   * Convert UTC date to application timezone
   * @param {Date|string} utcDate - UTC date to convert
   * @returns {string} Formatted date in app timezone
   */
  utcToAppTimezone(utcDate) {
    const date = new Date(utcDate);
    return date.toLocaleString('en-US', { 
      timeZone: this.appTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Convert application timezone date to UTC
   * @param {Date|string} appDate - Date in app timezone
   * @returns {Date} UTC date
   */
  appTimezoneToUtc(appDate) {
    const date = new Date(appDate);
    return new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  }

  /**
   * Format date for display in Nigeria format
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date (dd/mm/yyyy hh:mm AM/PM)
   */
  formatForNigeria(date) {
    const d = new Date(date);
    return d.toLocaleString('en-GB', { 
      timeZone: this.appTimezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get timezone offset for current application timezone
   * @returns {string} Timezone offset (e.g., '+01:00')
   */
  getTimezoneOffset() {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const appTime = new Date(utc.toLocaleString('en-US', { timeZone: this.appTimezone }));
    const offset = (appTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.floor((Math.abs(offset) - hours) * 60);
    const sign = offset >= 0 ? '+' : '-';
    
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Check if given time is business hours in Nigeria (9 AM - 5 PM WAT)
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if within business hours
   */
  isBusinessHours(date = new Date()) {
    const d = new Date(date);
    const nigeriaTime = new Date(d.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    const hour = nigeriaTime.getHours();
    const day = nigeriaTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Monday to Friday, 9 AM to 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  }

  /**
   * Get business day in Nigeria timezone
   * @param {number} daysAhead - Number of business days ahead
   * @returns {Date} Next business day
   */
  getBusinessDay(daysAhead = 1) {
    const now = new Date();
    const nigeriaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    
    let businessDays = 0;
    let currentDate = new Date(nigeriaTime);
    
    while (businessDays < daysAhead) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }
    
    return currentDate;
  }

  /**
   * Log timezone information for debugging
   */
  logTimezoneInfo() {
    logger.info('=== Timezone Configuration ===');
    logger.info(`Application Timezone: ${this.appTimezone}`);
    logger.info(`Current App Time: ${this.getCurrentTime()}`);
    logger.info(`Timezone Offset: ${this.getTimezoneOffset()}`);
    logger.info(`Is Business Hours: ${this.isBusinessHours()}`);
    logger.info('==============================');
  }
}

// Export singleton instance
module.exports = new TimezoneUtils();