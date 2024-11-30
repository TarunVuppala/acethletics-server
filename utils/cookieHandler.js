/**
 * Cookie Handler Utility.
 *
 * This module provides functions to set and retrieve cookies in an Express application.
 * It ensures secure cookie handling with environment-specific configurations.
 *
 * @module cookieHandler
 */

import config from '../config/config.js';

/**
 * Sets a cookie on the response object.
 *
 * @function
 * @param {Object} res - The HTTP response object.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 *
 * @description
 * - Configures the cookie with the following properties:
 *   - `httpOnly`: Ensures the cookie is accessible only via HTTP requests.
 *   - `secure`: Enables the Secure flag (HTTPS-only) in production environments.
 *   - `sameSite`: Adjusts based on environment (`strict` for same-site, `lax` for cross-origin).
 *   - `domain`: Optional, allows sharing cookies across subdomains in production.
 *   - `maxAge`: Sets the cookie's expiration time to 1 day.
 *
 * @example
 * import { setCookie } from './utils/cookieHandler.js';
 *
 * app.post('/login', (req, res) => {
 *   const token = 'some-auth-token';
 *   setCookie(res, 'token', token);
 *   res.json({ message: 'Cookie set successfully' });
 * });
 */
export const setCookie = (res, name, value) => {
    res.cookie(name, value, {
        httpOnly: true, // Prevents JavaScript access to the cookie
        secure: config.ENV === 'production', // Enables Secure flag in production
        sameSite: config.ENV === 'production' ? 'lax' : 'strict', // Lax for cross-origin requests in production
        domain: config.ENV === 'production' ? '.yourdomain.com' : undefined, // Share cookies across subdomains
        maxAge: 1 * 24 * 60 * 60 * 1000, // Cookie expiration: 1 day
        path: '/', // Available across the entire site
    });
};

/**
 * Retrieves a cookie value from the request object.
 *
 * @function
 * @param {Object} req - The HTTP request object.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|undefined} The value of the cookie, or `undefined` if the cookie is not found.
 *
 * @example
 * import { getCookie } from './utils/cookieHandler.js';
 *
 * app.get('/profile', (req, res) => {
 *   const token = getCookie(req, 'token');
 *   if (token) {
 *     res.json({ message: 'Token retrieved', token });
 *   } else {
 *     res.status(401).json({ message: 'No token found' });
 *   }
 * });
 */
export const getCookie = (req, name) => {
    return req.cookies[name]; // Retrieve the cookie by its name
};
