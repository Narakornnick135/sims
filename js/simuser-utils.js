// utils.js - Utility Functions Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get config from global namespace
  const UI_CONFIG = global.SimUser.UI_CONFIG;
  
  /**
   * Format date to Thai locale
   */
  function formatDate(date, format) {
    format = format || 'long';
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '-';
    
    const formats = UI_CONFIG.DATE_FORMAT;
    const options = formats[format] || formats.long;
    
    return new Intl.DateTimeFormat('th-TH', options).format(dateObj);
  }

  /**
   * Format date to short format
   */
  function formatDateShort(date) {
    return formatDate(date, 'short');
  }

  /**
   * Format date with time
   */
  function formatDateTime(date) {
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '-';
    
    const options = Object.assign({}, UI_CONFIG.DATE_FORMAT.long, {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return new Intl.DateTimeFormat('th-TH', options).format(dateObj);
  }

  /**
   * Format currency
   */
  function formatCurrency(amount, showDecimal) {
    showDecimal = showDecimal !== false; // default true
    
    if (amount === null || amount === undefined) return '-';
    
    const num = parseFloat(amount);
    if (isNaN(num)) return '-';
    
    const options = {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: showDecimal ? 2 : 0,
      maximumFractionDigits: showDecimal ? 2 : 0
    };
    
    return new Intl.NumberFormat('th-TH', options).format(num);
  }

  /**
   * Format number with thousand separators
   */
  function formatNumber(number) {
    if (number === null || number === undefined) return '-';
    
    const num = parseFloat(number);
    if (isNaN(num)) return '-';
    
    return new Intl.NumberFormat('th-TH').format(num);
  }

  /**
   * Calculate duration between dates
   */
  function calculateDuration(startDate, endDate) {
    endDate = endDate || new Date();
    
    if (!startDate) return '-';
    
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'วันนี้';
    } else if (diffDays === 1) {
      return '1 วัน';
    } else if (diffDays < 30) {
      return diffDays + ' วัน';
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months + ' เดือน';
    } else {
      const years = Math.floor(diffDays / 365);
      return years + ' ปี';
    }
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
    wait = wait || UI_CONFIG.DEBOUNCE_DELAY || 500;
    let timeout;
    
    return function executedFunction() {
      const context = this;
      const args = arguments;
      
      const later = function() {
        clearTimeout(timeout);
        func.apply(context, args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  function throttle(func, limit) {
    limit = limit || 300;
    let inThrottle;
    
    return function() {
      const args = arguments;
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() { inThrottle = false; }, limit);
      }
    };
  }

  /**
   * Deep clone object
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) {
      return obj.map(function(item) { return deepClone(item); });
    }
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Thai format)
   */
  function isValidPhone(phone) {
    const phoneRegex = /^(0[689]\d{8}|0[12345]\d{7})$/;
    return phoneRegex.test(phone.replace(/[- ]/g, ''));
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  /**
   * Get file extension
   */
  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  /**
   * Check if file type is allowed
   */
  function isAllowedFileType(filename, allowedExtensions) {
    const extension = '.' + getFileExtension(filename);
    return allowedExtensions.indexOf(extension) !== -1;
  }

  /**
   * Format file size
   */
  function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate unique ID
   */
  function generateId(prefix) {
    prefix = prefix || 'id';
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Parse query string
   */
  function parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    params.forEach(function(value, key) {
      result[key] = value;
    });
    
    return result;
  }

  /**
   * Build query string from object
   */
  function buildQueryString(params) {
    return new URLSearchParams(params).toString();
  }

  /**
   * Truncate text
   */
  function truncateText(text, maxLength, suffix) {
    suffix = suffix || '...';
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Sleep function for delays
   */
  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  /**
   * Check if object is empty
   */
  function isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  /**
   * Local storage wrapper with JSON support
   */
  const storage = {
    get: function(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    },
    
    set: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error writing to localStorage:', error);
        return false;
      }
    },
    
    remove: function(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
      }
    },
    
    clear: function() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
      }
    }
  };

  // Export to global namespace
  global.SimUser.utils = {
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    formatDateTime: formatDateTime,
    formatCurrency: formatCurrency,
    formatNumber: formatNumber,
    calculateDuration: calculateDuration,
    debounce: debounce,
    throttle: throttle,
    deepClone: deepClone,
    isValidEmail: isValidEmail,
    isValidPhone: isValidPhone,
    sanitizeHtml: sanitizeHtml,
    getFileExtension: getFileExtension,
    isAllowedFileType: isAllowedFileType,
    formatFileSize: formatFileSize,
    generateId: generateId,
    parseQueryString: parseQueryString,
    buildQueryString: buildQueryString,
    truncateText: truncateText,
    sleep: sleep,
    isEmpty: isEmpty,
    storage: storage
  };
  
})(window);