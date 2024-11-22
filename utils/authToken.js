/**
 * JWT Utility.
 *
 * This module provides functions to create and verify JWTs securely.
 * It uses the `jsonwebtoken` library to handle token generation and validation.
 * 
 * @module authToken
 */

import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Creates a JWT token.
 *
 * @function
 * @param {Object} payload - The data to encode into the JWT.
 * @returns {string|null} The signed JWT token, or `null` if an error occurs.
 *
 * @description
 * - Signs a JWT token with the provided payload using the application's secret key.
 * - The token is set to expire in 1 day (`expiresIn: '1d'`).
 * - Logs errors using the application's logger if token generation fails.
 *
 * @example
 * import { setToken } from './utils/authToken.js';
 *
 * const token = setToken({ id: 1, username: 'admin', role: 'admin' });
 * logger.info(token); // Prints the generated JWT token
 *
 * @returns {string|null} A JWT token string or `null` if an error occurs.
 */
const setToken = (payload) => {
    try {
        const token = jwt.sign({ ...payload }, config.JWT_SECRET, { expiresIn: '1d' });
        return token;
    } catch (err) {
        logger.error(err);
        return null;
    }
};

/**
 * Verifies and decodes a JWT token.
 *
 * @function
 * @param {string} token - The JWT token to verify.
 * @returns {Object|null} The decoded payload if the token is valid, or `null` if invalid or expired.
 *
 * @description
 * - Verifies a JWT token using the application's secret key.
 * - Returns the decoded payload if the token is valid.
 * - Logs errors if the token verification fails (e.g., invalid or expired token).
 *
 * @example
 * import { getUser } from './utils/authToken.js';
 *
 * const payload = getUser(token);
 * if (payload) {
 *   logger.info('User payload:', payload);
 * } else {
 *   logger.error('Invalid or expired token');
 * }
 *
 * @returns {Object|null} Decoded JWT payload or `null` if verification fails.
 */
const getUser = (token) => {
    try {
        if (!token) return null;
        return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
        logger.error(error);
        return null;
    }
};

export { setToken, getUser };
