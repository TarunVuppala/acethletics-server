export default {
    // Success Messages
    SUCCESS: (operation) => `The ${operation} operation has been successful.`,
    CREATED: (entity) => `${entity} has been successfully created.`,
    UPDATED: (entity) => `${entity} has been successfully updated.`,
    DELETED: (entity) => `${entity} has been successfully deleted.`,
    FETCHED: (entity) => `${entity} has been successfully fetched.`,
    LOGGED_IN: `Login was successful.`,
    LOGGED_OUT: `You have been successfully logged out.`,
    MISSING_FILEDS: `Missing required fields.`,

    // Error Messages
    SOMETHING_WENT_WRONG: `Something went wrong!`,
    NOT_FOUND: (entity) => `${entity} not found.`,
    TOO_MANY_REQUESTS: `Too many requests! Please try again after some time.`,
    UNAUTHORIZED: `You are not authorized to perform this action.`,
    FORBIDDEN: `You do not have permission to access this resource.`,
    INVALID_INPUT: `Invalid input provided.`,
    BAD_REQUEST: `Bad request! Please check your input.`,
    SERVER_ERROR: `An internal server error occurred. Please try again later.`,
    CONFLICT: (entity) => `A conflict occurred with ${entity}.`,
    VALIDATION_FAILED: `Validation failed. Please check the input values.`,
    TIMEOUT: `The request timed out. Please try again.`,

    // Authentication & Authorization
    AUTHENTICATION_FAILED: `Authentication failed. Please check your credentials.`,
    TOKEN_EXPIRED: `Your session has expired. Please log in again.`,
    TOKEN_INVALID: `Invalid token provided.`,
    ACCESS_DENIED: `Access denied. Insufficient permissions.`,
    ACCOUNT_LOCKED: `Your account is locked. Please contact support.`,

    // Resource-Specific Messages
    RESOURCE_CREATED: (resource) => `The ${resource} has been successfully created.`,
    RESOURCE_UPDATED: (resource) => `The ${resource} has been successfully updated.`,
    RESOURCE_DELETED: (resource) => `The ${resource} has been successfully deleted.`,
    RESOURCE_NOT_FOUND: (resource) => `The ${resource} could not be found.`,
    RESOURCE_ALREADY_EXISTS: (resource) => `The ${resource} already exists.`,

    // User Management
    USER_CREATED: `The user has been successfully created.`,
    USER_UPDATED: `The user has been successfully updated.`,
    USER_DELETED: `The user has been successfully deleted.`,
    USER_NOT_FOUND: `User not found.`,
    PASSWORD_INCORRECT: `The password you entered is incorrect.`,
    PASSWORD_RESET_SUCCESS: `Your password has been successfully reset.`,
    PASSWORD_RESET_FAILED: `Failed to reset password. Please try again.`,

    // Validation Errors
    FIELD_REQUIRED: (field) => `${field} is required.`,
    FIELD_INVALID: (field) => `${field} is invalid.`,
    FIELD_TOO_SHORT: (field, min) => `${field} must be at least ${min} characters long.`,
    FIELD_TOO_LONG: (field, max) => `${field} must not exceed ${max} characters.`,
    EMAIL_INVALID: `The email address is invalid.`,
    PHONE_INVALID: `The phone number is invalid.`,

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: `Rate limit exceeded. Please try again after some time.`,

    // Connectivity
    NETWORK_ERROR: `Network error occurred. Please check your internet connection.`,
    DATABASE_ERROR: `Database error occurred. Please try again later.`,

    // Maintenance
    UNDER_MAINTENANCE: `The service is currently under maintenance. Please try again later.`,

    // Debugging and Logging
    OPERATION_STARTED: (operation) => `The ${operation} operation has started.`,
    OPERATION_FAILED: (operation) => `The ${operation} operation failed.`,
    OPERATION_IN_PROGRESS: (operation) => `The ${operation} operation is in progress.`,

    // Default Messages
    DEFAULT_SUCCESS: `Operation completed successfully.`,
    DEFAULT_ERROR: `An unexpected error occurred. Please try again later.`,

    // Custom Placeholder Messages
    CUSTOM_MESSAGE: (message) => `${message}`,
};
