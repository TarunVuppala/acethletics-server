/**
 * HTTP Error Handling Utility.
 *
 * This utility function creates a standardized error object using the `errorObject` utility and passes it to the next middleware function.
 * It ensures consistent error handling and response formatting across the application.
 *
 * @module httpError
 */

import errorObject from './errorObject.js';

/**
 * Creates and passes a standardized error object to the next middleware.
 *
 * @function
 * @param {Function} next - The Express `next` middleware function.
 * @param {Error} err - The error object or message describing the error.
 * @param {Object} req - The HTTP request object.
 * @param {number} [errorStatusCode=500] - The HTTP status code for the error (default: `500` for internal server error).
 *
 * @description
 * - Constructs an error object using the `errorObject` utility.
 * - Passes the constructed error object to the next middleware using the `next` function.
 *
 * @example
 * import httpError from './utils/httpError.js';
 * 
 * app.get('/example', (req, res, next) => {
 *   const error = new Error('Something went wrong');
 *   httpError(next, error, req, 400);
 * });
 *
 * @throws {Object} - Passes a standardized error object to the next middleware.
 */
export default (next, err, req, errorStatusCode = 500) => {
    // Create a standardized error object
    const errorObj = errorObject(err, req, errorStatusCode);

    // Pass the error object to the next middleware
    return next(errorObj);
};
