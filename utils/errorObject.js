/**
 * Error Object Utility.
 *
 * This utility constructs a standardized error object for consistent error handling and logging.
 * It includes request details, error messages, optional trace data, and removes sensitive information in production environments.
 *
 * @module errorObject
 */

import responseMessage from '../constant/responseMessage.js';
import config from '../config/config.js';
import EApplicationEnvironment from '../constant/application.js';
import logger from './logger.js';

/**
 * Constructs a standardized error object.
 *
 * @function
 * @param {Error|string} err - The error object or message describing the error.
 * @param {Object} req - The HTTP request object.
 * @param {number} [errorStatusCode=500] - The HTTP status code for the error (default: 500).
 *
 * @description
 * - Constructs an error object with details like HTTP method, request URL, and optional stack trace.
 * - Logs the error object using the application's logger.
 * - Removes sensitive information such as IP address and stack trace in production environments for security.
 *
 * @example
 * import errorObject from './utils/errorObject.js';
 * 
 * app.get('/example', (req, res, next) => {
 *   const error = new Error('Invalid input');
 *   const errorObj = errorObject(error, req, 400);
 *   next(errorObj); // Pass the error object to the error handler middleware
 * });
 *
 * @returns {Object} Standardized error object.
 *
 * @response {JSON} Example Error Object
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "request": {
 *     "ip": "::1",
 *     "method": "GET",
 *     "url": "/example"
 *   },
 *   "message": "Invalid input",
 *   "data": null,
 *   "trace": {
 *     "error": "Error: Invalid input\n    at ...stack trace..."
 *   }
 * }
 */
export default (err, req, errorStatusCode = 500) => {
    const errorObj = {
        success: false, // Indicates the operation failed
        statusCode: errorStatusCode, // HTTP status code for the error
        request: {
            ip: req.ip || null, // Client IP address
            method: req.method, // HTTP method (e.g., GET, POST)
            url: req.originalUrl, // Request URL
        },
        message: err instanceof Error ? err.message || responseMessage.SOMETHING_WENT_WRONG : responseMessage.SOMETHING_WENT_WRONG, // Error message
        data: err.data || null, // Optional additional error data
        trace: err instanceof Error ? { error: err.stack } : null, // Stack trace (development only)
    };

    // Log the error
    logger.error(`CONTROLLER_ERROR`, {
        meta: errorObj, // Include the error object in the log
    });

    // Remove sensitive information in production
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete errorObj.request.ip; // Remove IP address
        delete errorObj.trace; // Remove stack trace
    }

    return errorObj; // Return the constructed error object
};
