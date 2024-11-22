/**
 * Admin Routes for handling authentication and registration.
 *
 * @module AdminRouter
 */

import express from 'express';

import { adminLogin, adminLogout, adminResgistration } from '../../../controllers/Admin/adminController.js';
import adminAuth from '../../../../middleware/adminAuth.js';
import httpResponse from '../../../../utils/httpResponse.js';

const router = express.Router();

/**
 * Route to log in as an admin.
 *
 * @name POST /api/admin/login
 * @function
 * @memberof module:AdminRouter
 * @param {Object} req - The request object containing login credentials in the body.
 * @param {string} req.body.username - The username of the admin.
 * @param {string} req.body.password - The password of the admin.
 * @param {Object} res - The response object.
 * @param {Function} next - Middleware function for error handling.
 * @description Logs in an admin by validating the provided credentials and generating a token.
 * @example
 * POST /api/admin/login
 * {
 *   "username": "admin123",
 *   "password": "securepassword"
 * }
 * @response 200
 * {
 *   "message": "Login successful",
 *   "data": {
 *     "admin": {
 *       "username": "admin123"
 *     },
 *     "role": "admin"
 *   }
 * }
 */
router.post('/login', adminLogin);

/**
 * Route to log out an admin.
 *
 * @name POST /api/admin/logout
 * @function
 * @memberof module:AdminRouter
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - Middleware function for error handling.
 * @description Logs out an admin by clearing the authentication token from cookies.
 * @example
 * POST /api/admin/logout
 * @response 200
 * {
 *   "message": "Logout successful"
 * }
 */
router.post('/logout', adminLogout);

/**
 * Route to register a new admin.
 *
 * @name POST /api/admin/register
 * @function
 * @memberof module:AdminRouter
 * @param {Object} req - The request object containing new admin details in the body.
 * @param {string} req.body.username - The username for the new admin.
 * @param {string} req.body.password - The password for the new admin.
 * @param {string} req.body.email - The email address of the new admin.
 * @param {string} [req.body.role] - The role assigned to the new admin (default: 'admin').
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.role - The role of the authenticated user (must be `super_admin`).
 * @param {Object} res - The response object.
 * @param {Function} next - Middleware function for error handling.
 * @description Registers a new admin. Only accessible to users with the `super_admin` role.
 * @example
 * POST /api/admin/register
 * {
 *   "username": "newAdmin",
 *   "password": "securePassword",
 *   "email": "admin@example.com",
 *   "role": "admin"
 * }
 * @response 200
 * {
 *   "message": "Admin created successfully",
 *   "data": {
 *     "admin": {
 *       "username": "newAdmin"
 *     },
 *     "role": "admin"
 *   }
 * }
 * @throws {401 Unauthorized} If the user is not a `super_admin`.
 * @throws {400 Bad Request} If required fields are missing or the email already exists.
 */
router.post('/register', adminAuth, adminResgistration);

/**
 * Default route for testing admin authentication.
 *
 * @name GET /api/admin/
 * @function
 * @memberof module:AdminRouter
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @description Returns a success message if the admin is authenticated.
 * @example
 * GET /api/admin/
 * @response 200
 * {
 *   "message": "success",
 *   "data": {
 *     "message": "Welcome!!"
 *   }
 * }
 */
router.get('/', adminAuth, (req, res) => {
    httpResponse(req, res, 200, 'success', { message: "Welcome!!" });
});

export default router;
