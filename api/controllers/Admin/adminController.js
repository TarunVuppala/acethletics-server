import { Admin } from '../../../db/model/index.js';

import responseMessage from '../../../constant/responseMessage.js';

import httpResponse from '../../../utils/httpResponse.js';
import httpError from '../../../utils/httpError.js';

import { setToken } from '../../../utils/authToken.js';
import { setCookie } from '../../../utils/cookieHandler.js';

/**
 * Controller for handling admin login.
 *
 * @async
 * @function adminLogin
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing login credentials.
 * @param {string} req.body.username - The username of the admin attempting to log in.
 * @param {string} req.body.password - The password of the admin attempting to log in.
 * @param {Object} res - The response object.
 * @param {Function} next - The middleware function for error handling.
 * @returns {Promise<void>} Resolves with the response or passes errors to the next middleware.
 *
 * @throws Will throw an error if required fields are missing, the admin is not found,
 *         the password is incorrect, or an unexpected server error occurs.
 *
 * @example
 * POST /api/admin/login
 * {
 *   "username": "admin123",
 *   "password": "securepassword"
 * }
 *
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
export const adminLogin = async (req, res, next) => {
    try {
        // Extract username and password from request body
        const { username, password } = req.body;

        // Check if both fields are provided
        if (!username || !password) {
            httpError(next, new Error(responseMessage.MISSING_FIELDS), req, 400);
            return;
        }

        // Find the admin by username
        const admin = await Admin.findOne({ username });
        if (!admin) {
            // If admin is not found, return a 401 Unauthorized error
            httpError(next, new Error(responseMessage.NOT_FOUND('admin')), req, 401);
            return;
        }

        // Validate the provided password
        if (password !== admin.password) {
            // If password is incorrect, return a 401 Unauthorized error
            httpError(next, new Error(responseMessage.PASSWORD_INCORRECT), req, 401);
            return;
        }

        // Generate a token for the admin
        const token = setToken({ username: admin.username, role: admin.role });

        // Set the token as a cookie in the response
        setCookie(res, 'token', token);

        // Respond with success and admin details
        httpResponse(req, res, 200, responseMessage.LOGIN_SUCCESS, {
            admin: {
                username: admin.username,
            },
            role: admin.role,
        });
    } catch (error) {
        // Handle specific Mongoose validation errors
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            const errorMessage = `Validation Error: ${validationErrors.join('; ')}`;
            httpError(next, new Error(errorMessage), req, 400);
        }
        // Handle casting errors (e.g., invalid ObjectId formats)
        else if (error instanceof mongoose.Error.CastError) {
            httpError(next, new Error('Database Error: Invalid query or data format.'), req, 400);
        }
        // Handle network/connection issues
        else if (error.name === 'MongoNetworkError') {
            httpError(next, new Error('Database Error: Unable to connect to the database.'), req, 500);
        }
        // Handle unique constraint or duplicate key errors
        else if (error.code === 11000) {
            httpError(next, new Error('Database Error: Duplicate key detected.'), req, 400);
        }
        // Catch all other unexpected errors
        else {
            httpError(next, error, req, 500);
        }
    }
};


/**
 * Controller for handling admin logout.
 *
 * @async
 * @function adminLogout
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The middleware function for error handling.
 * @returns {Promise<void>} Resolves with a success response or passes errors to the next middleware.
 *
 * @description
 * This function logs out an admin by clearing the `token` cookie from the client.
 * It sends a success response upon successful logout and handles any unexpected errors.
 *
 * @example
 * POST /api/admin/logout
 *
 * @response 200
 * {
 *   "message": "Logout successful"
 * }
 *
 * @throws Will throw an error if an unexpected server error occurs.
 */
export const adminLogout = async (req, res, next) => {
    try {
        // Clear the token cookie from the client's browser
        res.clearCookie('token');

        // Send a success response
        httpResponse(req, res, 200, responseMessage.LOGOUT_SUCCESS);
    } catch (error) {
        // Handle unexpected errors and pass them to the next middleware
        httpError(next, error, req, 500);
    }
};


/**
 * Controller for handling admin registration.
 *
 * @async
 * @function adminRegistration
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing admin details.
 * @param {string} req.body.username - The username for the new admin.
 * @param {string} req.body.password - The password for the new admin.
 * @param {string} req.body.email - The email address of the new admin.
 * @param {string} [req.body.role] - The role assigned to the new admin (default: 'admin').
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.role - The role of the authenticated user.
 * @param {Object} res - The response object.
 * @param {Function} next - The middleware function for error handling.
 * @returns {Promise<void>} Resolves with the response or passes errors to the next middleware.
 *
 * @description
 * This function allows a `super_admin` to register a new admin. It validates input,
 * checks for duplicate emails, and creates a new admin if all conditions are met.
 *
 * @example
 * POST /api/admin/register
 * {
 *   "username": "newAdmin",
 *   "password": "securePassword",
 *   "email": "admin@example.com",
 *   "role": "admin"
 * }
 *
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
 *
 * @throws Will throw an error if required fields are missing, the user is unauthorized,
 *         the admin email already exists, or an unexpected server error occurs.
 */
export const adminRegistration = async (req, res, next) => {
    try {
        // Extract admin details from the request body
        const { username, password, email, role } = req.body;

        // Validate required fields
        if (!username || !password || !email) {
            httpError(next, new Error(responseMessage.MISSING_FIELDS), req, 400);
            return;
        }

        // Ensure only `super_admin` can register a new admin
        if (req.user.role !== 'super_admin') {
            httpError(next, new Error(responseMessage.UNAUTHORIZED), req, 401);
            return;
        }

        // Check if an admin with the given email already exists
        const exists = await Admin.findOne({ email });
        if (exists) {
            httpError(
                next,
                new Error(responseMessage.RESOURCE_ALREADY_EXISTS('Admin')),
                req,
                400
            );
            return;
        }

        // Create the new admin in the database
        const admin = await Admin.create({
            username,
            password,
            email,
            role,
        });

        // Send a success response with the created admin's details
        httpResponse(req, res, 200, responseMessage.USER_CREATED, {
            admin: {
                username: admin.username,
            },
            role: admin.role,
        });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Format the validation errors into a user-friendly message
            const validationErrors = Object.values(error.errors).map(
                (err) => err.message
            );
            const errorMessage = `Validation Error: ${validationErrors.join('; ')}`;

            // Return the formatted validation error response
            httpError(next, new Error(errorMessage), req, 400);
        } else if (error instanceof mongoose.Error.CastError) {
            // Handle invalid casting (e.g., invalid ObjectId format)
            httpError(next, new Error('Database Error: Invalid query or ID format.'), req, 400);
        } else if (error.name === 'MongoNetworkError') {
            // Handle database connection issues
            httpError(next, new Error('Database Error: Unable to connect to the database.'), req, 500);
        } else {
            // Handle all other unexpected errors
            httpError(next, error, req, 500);
        }
    }
};