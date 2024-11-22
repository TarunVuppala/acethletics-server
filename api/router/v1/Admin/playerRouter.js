/**
 * Player Routes for handling player operations.
 *
 * @module PlayerRouter
 */

import express from 'express';

import adminAuth from '../../../../middleware/adminAuth.js';
import { addPlayer } from '../../../controllers/Admin/playerController.js';

const router = express.Router();

/**
 * Route to add a new player.
 *
 * @name POST /api/admin/players
 * @function
 * @memberof module:PlayerRouter
 * @param {Object} req - The request object containing player details in the body.
 * @param {string} req.body.player_name - The name of the player to be added.
 * @param {string} req.body.department - The department or team to which the player belongs.
 * @param {Object} req.body.skill - The skill object describing the player's roles and styles.
 * @param {string[]} req.body.skill.roles - An array of roles, e.g., ["batsman", "wicket_keeper"].
 * @param {Object} req.body.skill.styles - An object containing specific skill styles, e.g., { "batting": "left-handed" }.
 * @param {Object} res - The response object.
 * @param {Function} next - Middleware function for error handling.
 * @param {Object} req.user - The authenticated admin user.
 * @param {string} req.user.role - The role of the authenticated user.
 * @description Adds a new player to the database. Only accessible to authenticated admins.
 * @example
 * POST /api/admin/players
 * {
 *   "player_name": "John Doe",
 *   "department": "CSE",
 *   "skill": {
 *     "roles": ["batsman", "wicket_keeper"],
 *     "styles": {
 *       "batting": "left-handed"
 *     }
 *   }
 * }
 * @response 200
 * {
 *   "message": "Player added successfully",
 *   "data": {
 *     "player": {
 *       "player_name": "John Doe",
 *       "department": "CSE",
 *       "skill": {
 *         "roles": ["batsman", "wicket_keeper"],
 *         "styles": {
 *           "batting": "left-handed"
 *         }
 *       }
 *     }
 *   }
 * }
 * @throws {401 Unauthorized} If the admin is not authenticated.
 * @throws {400 Bad Request} If required fields are missing or validation fails.
 */
router.post('/', adminAuth, addPlayer);

export default router;
