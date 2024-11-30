import config from '../config/config.js'; // Import your config if needed
import logger from './logger.js';

/**
 * Sets a cookie in the response.
 * 
 * @param {Object} res - The HTTP response object.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 */
export const setCookie = (res, name, value) => {
    res.cookie(name, value, {
        httpOnly: true,  // Prevents access to the cookie via JavaScript (XSS protection)
        secure: process.env.NODE_ENV === 'production',  // Only send over HTTPS in production
        sameSite: 'None',  // Required for cross-origin requests
        maxAge: 24 * 60 * 60 * 1000, // Cookie expires in 1 day (24 hours)
        path: '/', // Available for all routes
    });
};

/**
 * Retrieves a cookie from the request.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|undefined} The value of the cookie, or undefined if not found.
 */
export const getCookie = (req, name) => {
    logger.info('req.cookies', req.cookies[name]);
    return req.cookies[name]; // Retrieve the cookie value by its name
};
