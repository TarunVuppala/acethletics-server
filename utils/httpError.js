/**
 * HTTP Error Handling Utility.
 *
 * This utility function creates a standardized error object using the `errorObject` utility and passes it to the next middleware function.
 * It ensures consistent error handling and response formatting across the application, including handling of Mongoose-specific errors.
 *
 * @module httpError
 */

import mongoose from 'mongoose';
import errorObject from './errorObject.js';

/**
 * Handles Mongoose-specific errors.
 *
 * @function handleMongooseError
 * @param {Error} err - The error object.
 * @param {Object} req - The HTTP request object.
 * @returns {Object} - A standardized error object.
 */
const handleMongooseError = (err, req) => {
    let errorMessage;
    let statusCode;

    if (err instanceof mongoose.Error.ValidationError) {
        errorMessage = `Validation Error: ${Object.values(err.errors).map((error) => error.message).join('; ')}`;
        statusCode = 400; // Bad Request
    } else if (err instanceof mongoose.Error.CastError) {
        errorMessage = 'Invalid data format or ID.';
        statusCode = 400; // Bad Request
    } else if (err.name === 'MongoNetworkError') {
        errorMessage = 'Database connection error.';
        statusCode = 500; // Internal Server Error
    } else if (err.code === 11000) {
        errorMessage = 'Duplicate key error: Data already exists.';
        statusCode = 400; // Bad Request
    } else {
        errorMessage = err.message || 'An unexpected error occurred.';
        statusCode = 500; // Internal Server Error
    }

    return errorObject(new Error(errorMessage), req, statusCode);
};

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
 * - Handles Mongoose-specific errors for better error reporting.
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
    let errorObj;

    // Check if the error is a Mongoose-specific error
    if (err instanceof mongoose.Error || err.code === 11000) {
        errorObj = handleMongooseError(err, req);
    } else {
        // Create a standardized error object for general errors
        errorObj = errorObject(err, req, errorStatusCode);
    }

    // Pass the error object to the next middleware
    return next(errorObj);
};
