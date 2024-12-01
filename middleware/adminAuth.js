/**
 * Authentication Middleware.
 *
 * This middleware validates the admin's authentication token, retrieves the admin details from the token, 
 * and attaches them to the `req` object for further processing in protected routes.
 *
 * @module adminAuth
 */

import { getUser } from '../utils/authToken.js';
import httpError from '../utils/httpError.js';
import logger from '../utils/logger.js';

/**
 * Middleware to authenticate requests.
 *
 * @function auth
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function in the stack.
 * @description
 * - Checks the `Authorization` header for a Bearer token.
 * - Decodes and validates the token to extract user details.
 * - Attaches the user payload to `req.user` if the token is valid.
 * - Throws an unauthorized error (401) if the token is missing or invalid.
 *
 * @example
 * import adminAuth from './middleware/adminauth.js';
 *
 * app.use('/protected-route', adminAuth, (req, res) => {
 *   // Protected route logic
 * });
 *
 * @throws {401 Unauthorized} If the token is missing or invalid.
 */
function adminAuth(req, res, next) {
    try {
        // Retrieve the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return httpError(next, new Error('Unauthorized! Token Missing.'), req, 401);
        }
        // Extract the token
        const token = authHeader.split(' ')[1];

        // Validate and decode the token
        const payload = getUser(token);

        if (payload) {
            // Attach the decoded user payload to the request object
            req.user = payload;
            next();
        } else {
            // Token is invalid
            return httpError(next, new Error('Unauthorized! Invalid Token.'), req, 401);
        }
    } catch (error) {
        logger.error(`Auth Middleware Error: ${error.message}`);
        httpError(next, new Error('Unauthorized!'), req, 401);
    }
}

export default adminAuth;
