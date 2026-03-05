/**
 * Helper Functions
 * Utility functions for common operations
 */

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - BCP-47 locale (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  const numeric = Number(amount) || 0;
  const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(numeric);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(numeric);
  }
};

/**
 * Resolve display symbol for a currency code
 * @param {string} currency
 * @param {string} locale
 * @returns {string}
 */
export const getCurrencySymbol = (currency = 'USD', locale = 'en-US') => {
  const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value || normalizedCurrency;
  } catch {
    return '$';
  }
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'full')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  };

  return dateObj.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Format time to HH:MM AM/PM
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return '--:--';
  }

  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Calculate percentage
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (current, total) => {
  const safeTotal = Number(total) || 0;
  if (safeTotal <= 0) return 0;
  return Math.round(((Number(current) || 0) / safeTotal) * 100);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export const truncateText = (text, length = 50) => {
  const value = text || '';
  if (value.length <= length) return value;
  return value.substring(0, length) + '...';
};

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Deep clone object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Get color based on transaction type or status
 * @param {string} type - Type identifier
 * @returns {string} Color class name
 */
export const getTypeColor = (type) => {
  const colors = {
    income: 'text-green-600',
    expense: 'text-red-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };
  return colors[type] || 'text-gray-600';
};

/**
 * Get badge code based on budget category
 * @param {string} category - Category name
 * @returns {string} Two-letter category code
 */
export const getCategoryIcon = (category) => {
  const icons = {
    Food: 'FD',
    Transportation: 'TR',
    Entertainment: 'EN',
    Shopping: 'SH',
    Utilities: 'UT',
    Health: 'HL',
    Education: 'ED',
    Other: 'OT',
  };
  return icons[category] || 'OT';
};

export default {
  formatCurrency,
  getCurrencySymbol,
  formatDate,
  formatTime,
  calculatePercentage,
  truncateText,
  debounce,
  throttle,
  deepClone,
  getTypeColor,
  getCategoryIcon,
};
