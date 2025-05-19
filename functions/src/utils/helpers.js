const { logger } = require('firebase-functions');

/**
 * Handles errors in Cloud Functions
 * @param {Error} error - Error object
 * @param {Object} context - Error context information
 * @returns {Object} - Formatted error response
 */
const handleError = (error, context = {}) => {
  // Log error with additional context
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    context,
  });

  // Format error for client response
  return {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'unknown',
      status: error.status || 500,
    },
  };
};

/**
 * Validates request data against a schema
 * @param {Object} data - Request data to validate
 * @param {Object} schema - Validation schema { field: { required: boolean, type: string } }
 * @returns {Object} - Validation result
 */
const validateData = (data, schema) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    // Check required fields
    if (rules.required && (data[field] === undefined || data[field] === null)) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip further validation if field is not present and not required
    if (data[field] === undefined || data[field] === null) {
      continue;
    }

    // Validate type
    if (rules.type && typeof data[field] !== rules.type) {
      errors[field] = `${field} must be a ${rules.type}`;
    }

    // Validate enum values
    if (rules.enum && !rules.enum.includes(data[field])) {
      errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
    }

    // Validate min/max for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && data[field] < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && data[field] > rules.max) {
        errors[field] = `${field} must be at most ${rules.max}`;
      }
    }

    // Validate min/max length for strings
    if (rules.type === 'string') {
      if (rules.minLength !== undefined && data[field].length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength !== undefined && data[field].length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(data[field])) {
        errors[field] = `${field} has an invalid format`;
      }
    }

    // Validate array items
    if (rules.type === 'array' && rules.itemType && Array.isArray(data[field])) {
      const invalidItems = data[field].filter(item => typeof item !== rules.itemType);
      if (invalidItems.length > 0) {
        errors[field] = `All items in ${field} must be of type ${rules.itemType}`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Checks if user has required role
 * @param {Object} user - User object
 * @param {Array} roles - Required roles
 * @returns {boolean} - Whether user has required role
 */
const hasRole = (user, roles) => {
  if (!user || !user.customClaims) {
    return false;
  }
  
  if (user.customClaims.admin) {
    return true; // Admin role has access to everything
  }
  
  return roles.some(role => user.customClaims[role]);
};

/**
 * Success response helper
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted success response
 */
const successResponse = (data, message = 'Operation successful') => {
  return {
    success: true,
    message,
    data,
  };
};

module.exports = {
  handleError,
  validateData,
  hasRole,
  successResponse,
};
