/**
 * HTTP Response Utility.
 *
 * This utility function sends a standardized HTTP response to the client and logs the response details.
 * In production, it removes sensitive information such as the requester's IP address.
 *
 * @module httpResponse
 */

import config from '../config/config.js';
import EApplicationEnvironment from '../constant/application.js';
import logger from './logger.js';

/**
 * Sends a structured HTTP response and logs it.
 *
 * @function
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {number} responseStatusCode - The HTTP status code to send.
 * @param {string} responseMessage - A descriptive message for the response.
 * @param {Object|null} [data=null] - Optional data to include in the response.
 *
 * @description
 * - Constructs a standardized response object with success status, request details, message, and optional data.
 * - Logs the response object using the logger for monitoring.
 * - Removes sensitive information (IP address) in production environments for security.
 *
 * @example
 * import httpResponse from './utils/httpResponse.js';
 * 
 * app.get('/example', (req, res) => {
 *   const data = { id: 1, name: 'Example' };
 *   httpResponse(req, res, 200, 'Request successful', data);
 * });
 *
 * @response {JSON} Example Response
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "request": {
 *     "ip": "::1",
 *     "method": "GET",
 *     "url": "/example"
 *   },
 *   "message": "Request successful",
 *   "data": {
 *     "id": 1,
 *     "name": "Example"
 *   }
 * }
 */
export default (req, res, responseStatusCode, responseMessage, data = null) => {
    // Construct the response object
    const response = {
        success: true,
        statusCode: responseStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: responseMessage,
        data,
    };

    // Log the response
    logger.info(`CONTROLLER_RESPONSE`, {
        ...response,
    });

    // Remove sensitive information (e.g., IP address) in production
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete response.request.ip;
    }

    // Send the structured response to the client
    res.status(responseStatusCode).json(response);
};
