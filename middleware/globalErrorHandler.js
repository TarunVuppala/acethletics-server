/**
 * Global Error-Handling Middleware.
 *
 * This middleware is responsible for catching and handling errors that occur in the application.
 * It logs the error details and sends a structured error response to the client.
 *
 * @module ErrorHandler
 */

import logger from '../utils/logger.js';

/**
 * Middleware for handling errors in the application.
 *
 * @function
 * @param {Error} err - The error object containing details about the error.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function (not used here as this is the final handler).
 *
 * @description
 * - Logs the error message and additional details using the application's logger.
 * - Sends an HTTP error response with the appropriate status code and error message.
 * - Defaults to a `500 Internal Server Error` if no status code is provided.
 *
 * @example
 * app.use((err, req, res, next) => {
 *   logger.error(err.message, { ...err });
 *   httpError(res, err, req, 500);
 * });
 *
 * @response {JSON} - Example Error Response
 * {
 *   "error": "An unexpected error occurred",
 *   "success": false
 * }
 */
export default (err, req, res, next) => {
    // Log the error message and details
    logger.error(err.message, { ...err });

    // Send the error response
    res.status(err.statusCode || 500).json({
        error: err.message,
        success: false,
    });
};
