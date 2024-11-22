/**
 * Player Routes for handling player operations.
 *
 * @module PlayerRouter
 */

import express from 'express';

import { addPlayer, deletePlayer, getPlayer, getPlayers, patchPlayer, putPlayer, transferPlayer } from '../../../controllers/Admin/playerController.js';

const router = express.Router();

/**
 * Route to add a new player.
 *
 * @name POST /api/v1/admin/players
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
 * POST /api/v1/admin/players
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
router.post('/', addPlayer);


/**
 * @route GET /api/v1/players
 * @description Fetches a list of all players.
 * @access Public
 * @example
 * GET /api/v1/players
 * 
 * @response {JSON} Success Response
 * {
 *   "message": "Players fetched successfully",
 *   "data": [ { "id": "123", "player_name": "John Doe", "department": "CSE" } ]
 * }
 */
router.get('/', getPlayers);

/**
 * @route GET /api/v1/players/:id
 * @description Fetches a single player's details by their ID.
 * @access Public
 * @example
 * GET /api/v1/players/:id
 * 
 * @param {string} id - The ID of the player to fetch.
 * 
 * @response {JSON} Success Response
 * {
 *   "message": "Player fetched successfully",
 *   "data": { "id": "123", "player_name": "John Doe", "department": "CSE" }
 * }
 */
router.get('/:id', getPlayer);

/**
 * @route PUT /api/v1/players/:id
 * @description Fully replaces a player's details with the provided data.
 * @access Public
 * @example
 * PUT /api/v1/players/:id
 * 
 * @param {string} id - The ID of the player to update.
 * 
 * @request {JSON} Body
 * {
 *   "player_name": "Updated Name",
 *   "department": "Updated Department"
 * }
 * 
 * @response {JSON} Success Response
 * {
 *   "message": "Player updated successfully",
 *   "data": { "name": "Updated Name", "department": "Updated Department" }
 * }
 */
router.put('/:id', putPlayer);

/**
 * @route PATCH /api/v1/players/:id
 * @description Partially updates a player's details.
 * @access Public
 * @example
 * PATCH /api/v1/players/:id
 * 
 * @param {string} id - The ID of the player to update.
 * 
 * @request {JSON} Body
 * {
 *   "department": "Updated Department"
 * }
 * 
 * @response {JSON} Success Response
 * {
 *   "message": "Player updated successfully",
 *   "data": { "name": "Original Name", "department": "Updated Department" }
 * }
 */
router.patch('/:id', patchPlayer);

/**
 * @route DELETE /api/v1/players/:id
 * @description Deletes a player by their ID.
 * @access Public
 * @example
 * DELETE /api/v1/players/:id
 * 
 * @param {string} id - The ID of the player to delete.
 * 
 * @response {JSON} Success Response
 * {
 *   "message": "Player deleted successfully",
 *   "data": {}
 * }
 */
router.delete('/:id', deletePlayer);

router.patch('/:id/transfer/:teamId', transferPlayer);

export default router;
