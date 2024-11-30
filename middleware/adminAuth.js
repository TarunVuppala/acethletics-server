/**
 * Authentication Middleware.
 *
 * This middleware validates the admin's authentication token, retrieves the admin details from the token, 
 * and attaches them to the `req` object for further processing in protected routes.
 *
 * @module adminAuth
 */

import { getUser } from '../utils/authToken.js';
import { getCookie } from '../utils/cookieHandler.js';
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
 * - Retrieves the authentication token from cookies.
 * - Decodes and validates the token to extract user details.
 * - Attaches the user payload to `req.user` if the token is valid.
 * - Throws an unauthorized error (401) if the token is missing or invalid.
 *
 * @example
 * import auth from './middleware/adminauth.js';
 *
 * app.use('/protected-route', adminauth, (req, res) => {
 *   // Protected route logic
 * });
 *
 * @throws {401 Unauthorized} If the token is missing or invalid.
 */
function adminAuth(req, res, next) {
    // Retrieve the token from cookies
    const token = getCookie(req, 'token'); // Specify the cookie name explicitly

    if (token) {
        // Validate and decode the token
        const payload = getUser(token);

        if (payload) {
            // Attach the decoded user payload to the request object
            req.user = payload;
            next();
        } else {
            // Token is invalid
            httpError(next, new Error('Unauthorized'), req, 401);
        }
    } else {
        // Token is missing
        httpError(next, new Error('Unauthorized!!! Token Missing.'), req, 401);
    }
}

export default adminAuth;
