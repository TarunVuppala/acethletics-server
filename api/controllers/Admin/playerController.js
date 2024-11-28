import { CricketPlayer } from "../../../db/model/index.js";

import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";

import playerValidator from "../../validator/playerValidator.js";
import { log } from "util";
import logger from "../../../utils/logger.js";

/**
 * Controller to add a new cricket player to the database.
 *
 * @async
 * @function addPlayer
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing player data.
 * @param {string} req.body.player_name - The name of the player to be added.
 * @param {string} req.body.department - The department to which the player belongs.
 * @param {Object} req.body.skill - The skill object containing roles and styles of the player.
 * @param {string[]} req.body.skill.roles - An array of roles, e.g., ["batsman", "wicket_keeper"].
 * @param {Object} req.body.skill.styles - The styles object containing specific skill styles.
 * @param {string} [req.body.skill.styles.batting] - The player's batting style (e.g., "left-handed").
 * @param {Object} res - The response object.
 * @param {Function} next - The middleware function for error handling.
 * @returns {Promise<void>} Resolves with the response or passes errors to the next middleware.
 *
 * @throws Will throw an error if required fields are missing, validation fails,
 *         or the player already exists in the database.
 *
 * @example
 * POST /api/v1/players
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
 *
 * @response 200
 * {
 *   "message": "User created successfully",
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
 */
export const addPlayer = async (req, res, next) => {
    try {
        // Extract fields from the request body
        const { player_name, department, skill } = req.body;

        // Validate required fields
        if (!player_name || !department || !skill) {
            httpError(next, new Error(responseMessage.MISSING_FILEDS), req, 400);
            return;
        }

        // Validate the skill object
        const { error, value } = playerValidator.validate(skill);
        if (error) {
            httpError(next, new Error(error.message), req, 400);
            return;
        }

        // Check for duplicate player
        const exists = await CricketPlayer.findOne({ player_name });
        if (exists) {
            httpError(
                next,
                new Error(responseMessage.RESOURCE_ALREADY_EXISTS("Player")),
                req,
                400
            );
            return;
        }

        // Create the player
        const player = await CricketPlayer.create({
            player_name,
            department,
            skill,
        });

        // Respond with success
        httpResponse(req, res, 201, responseMessage.USER_CREATED, {
            player: {
                player_name: player.player_name,
                department: player.department,
                skill: player.skill,
            },
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Fetches a paginated list of players from the database.
 *
 * @async
 * @function getPlayers
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.query - The query parameters from the request.
 * @param {string} [req.query.page='1'] - The page number for pagination (default: 1).
 * @param {string} [req.query.rows='10'] - The number of rows per page (default: 10).
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The middleware function for error handling.
 *
 * @description
 * This function retrieves players from the database with pagination. It validates the query parameters,
 * calculates the number of players to skip for the requested page, and fetches the corresponding players.
 * Metadata about the pagination is included in the response. In case of an error, it passes a standardized
 * error object to the error-handling middleware.
 *
 * @example
 * // Example API request
 * GET /api/v1/players?page=2&rows=5
 *
 * @response {JSON}
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Players fetched successfully",
 *   "data": {
 *     "currentPage": 2,
 *     "rowsPerPage": 5,
 *     "players": [
 *       { "player_name": "John Doe", "department": "CSE", "skill": { "roles": ["batsman"] } },
 *       ...
 *     ]
 *   }
 * }
 *
 * @throws {400} If the page or rows query parameters are invalid.
 * @throws {500} If a server error occurs.
 */
export const getPlayers = async (req, res, next) => {
    try {
        const { page = '1', rows = '10' } = req.query;

        // Validate and sanitize query parameters
        const pageNumber = Math.max(Number(page), 1);
        const rowsPerPage = Math.max(Number(rows), 1);

        if (isNaN(pageNumber) || isNaN(rowsPerPage)) {
            return httpError(next, new Error("Invalid page or rows parameter"), req, 400);
        }

        const skip = (pageNumber - 1) * rowsPerPage;

        // Fetch total count of players and the requested page of players
        const players = await CricketPlayer.find({})
            .sort({ player_name: 1 })
            .skip(skip)
            .limit(rowsPerPage)
            .select('player_name department skill.roles')
            .lean()
            .exec();

        // Handle empty results
        if (players.length === 0) {
            return httpResponse(req, res, 200, "No players found", {
                currentPage: pageNumber,
                rowsPerPage,
                players
            });
        }

        // Send response with metadata and player data
        httpResponse(req, res, 200, responseMessage.FETCHED("Players"), {
            currentPage: pageNumber,
            rowsPerPage,
            players
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves a player's details by ID.
 *
 * @async
 * @function getPlayer
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the player to retrieve.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Fetches a player's details from the database using their ID.
 * - Handles cases where the player does not exist.
 *
 * @example
 * GET /api/v1/players/:id
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Player fetched successfully",
 *   "data": {
 *     "id": "12345",
 *     "player_name": "John Doe",
 *     "department": "Engineering"
 *   }
 * }
 *
 * @throws {404} If the player is not found.
 * @throws {500} For database or other unexpected errors.
 */
export const getPlayer = async (req, res, next) => {
    try {
        // Validate player ID
        const playerId = req.params.id;
        if (!playerId) {
            return httpError(next, new Error("Player ID is required"), req, 400);
        }

        // Fetch the player by ID
        const player = await CricketPlayer.findById(playerId)
            .lean() // Converts the Mongoose document to a plain JS object
            .exec();

        // Handle player not found
        if (!player) {
            return httpError(next, new Error("Player not found"), req, 404);
        }

        // Respond with the player data
        httpResponse(req, res, 200, responseMessage.FETCHED("Player"), player);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Replaces a player's details by ID.
 *
 * @async
 * @function putPlayer
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the player to update.
 * @param {Object} req.body - The new player data to replace the existing data.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Replaces a player's details completely with the new data provided in the request body.
 * - Validates the provided data and handles errors gracefully.
 *
 * @example
 * PUT /api/v1/players/:id
 * {
 *   "player_name": "Updated Name",
 *   "department": "Updated Department"
 * }
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Player updated successfully",
 *   "data": {
 *     "name": "Updated Name",
 *     "department": "Updated Department"
 *   }
 * }
 *
 * @throws {404} If the player is not found.
 * @throws {400} For validation or missing data errors.
 * @throws {500} For database or other unexpected errors.
 */
export const putPlayer = async (req, res, next) => {
    // try {
        // Validate player ID
        const playerId = req.params.id;
        if (!playerId) {
            return httpError(next, new Error("Player ID is required"), req, 400);
        }

        const { player_name, department, skill } = req.body;
        logger.info(`Updating player ${playerId} with data:`,{
            player_name,
            department,
            skill
        });

        // Replace the player's details
        const updatedPlayer = await CricketPlayer.findByIdAndUpdate(
            playerId,
            {
                player_name,
                department,
                skill
            },
            {
                new: true, // Return the updated document
                runValidators: true, // Enforce schema validation
            }
        );

        // Handle player not found
        if (!updatedPlayer) {
            return httpError(next, new Error("Player not found"), req, 404);
        }

        // Respond with the updated player data
        httpResponse(req, res, 200, responseMessage.UPDATED("Player"), {
            name: updatedPlayer.player_name,
            department: updatedPlayer.department,
        });
    // } catch (error) {
    //     httpError(next, error, req, 500);
    // }
};


/**
 * Partially updates a player's details.
 *
 * @async
 * @function patchPlayer
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the player to update.
 * @param {Object} req.body - The partial player data to update.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Allows partial updates to a player's details.
 * - Validates the `id` parameter and applies schema validation during the update.
 * - Returns the updated player data if successful or appropriate error responses if not.
 *
 * @example
 * PATCH /api/v1/players/:id
 * {
 *   "department": "Updated Department"
 * }
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Player updated successfully",
 *   "data": {
 *     "name": "Original Name",
 *     "department": "Updated Department"
 *   }
 * }
 *
 * @throws {404} If the player is not found.
 * @throws {500} For database or other unexpected errors.
 */
export const patchPlayer = async (req, res, next) => {
    try {
        const playerId = req.params.id;

        // Validate player ID
        if (!playerId) {
            return httpError(next, new Error("Player ID is required"), req, 400);
        }

        // Ensure request body is not empty for a partial update
        if (!Object.keys(req.body).length) {
            return httpError(next, new Error("No fields provided for update"), req, 400);
        }

        // Find and partially update the player
        const updatedPlayer = await CricketPlayer.findByIdAndUpdate(
            playerId,
            { $set: req.body }, // Use $set for partial updates
            {
                new: true, // Return the updated document
                runValidators: true, // Enforce schema validation
            }
        );

        // Check if the player exists
        if (!updatedPlayer) {
            return httpError(next, new Error("Player not found"), req, 404);
        }

        // Respond with the updated player details
        httpResponse(req, res, 200, responseMessage.UPDATED("Player"), {
            name: updatedPlayer.player_name,
            department: updatedPlayer.department,
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Deletes a player by ID.
 *
 * @async
 * @function deletePlayer
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the player to delete.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Deletes a player's record from the database by their ID.
 * - Handles scenarios where the player is not found or the ID is missing.
 *
 * @example
 * DELETE /api/v1/players/:id
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Player deleted successfully",
 *   "data": {}
 * }
 *
 * @throws {400} If the player ID is missing.
 * @throws {404} If the player is not found.
 * @throws {500} For database or other unexpected errors.
 */
export const deletePlayer = async (req, res, next) => {
    try {
        const playerId = req.params.id;

        // Validate that the player ID is provided
        if (!playerId) {
            return httpError(next, new Error("Player ID is required"), req, 400);
        }

        // Attempt to find and delete the player
        const deletedPlayer = await CricketPlayer.findByIdAndDelete(playerId);

        // Check if the player exists
        if (!deletedPlayer) {
            return httpError(next, new Error("Player not found"), req, 404);
        }

        // Respond with success message
        httpResponse(req, res, 200, responseMessage.DELETED("Player"), {});
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Transfers a player to a new team.
 *
 * @async
 * @function transferPlayer
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the player to transfer.
 * @param {string} req.params.teamId - The ID of the new team.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Transfers a player to a new team by updating the `team` field of the player's document.
 * - Validates that both `playerId` and `teamId` are provided.
 * - Handles scenarios where the player does not exist or database errors occur.
 *
 * @example
 * PATCH /api/v1/players/:id/transfer/:teamId
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Player updated successfully",
 *   "data": {
 *     "player_name": "John Doe",
 *     "current_team": "New Team ID"
 *   }
 * }
 *
 * @throws {400} If the player ID or team ID is missing.
 * @throws {404} If the player is not found.
 * @throws {500} For database or other unexpected errors.
 */
export const transferPlayer = async (req, res, next) => {
    try {
        const playerId = req.params.id;
        const teamId = req.params.teamId;

        // Validate that the player ID and team ID are provided
        if (!playerId || !teamId) {
            return httpError(
                next,
                new Error("Player ID and team ID are required"),
                req,
                400
            );
        }

        // Find and update the player's team
        const updatedPlayer = await CricketPlayer.findByIdAndUpdate(
            playerId,
            { team: teamId }, // Update the team field
            {
                new: true, // Return the updated document
                runValidators: true, // Ensure validation rules are applied
            }
        );

        // Check if the player exists
        if (!updatedPlayer) {
            return httpError(next, new Error("Player not found"), req, 404);
        }

        // Respond with success message and updated player details
        httpResponse(req, res, 200, responseMessage.UPDATED("Player"), {
            player_name: updatedPlayer.player_name,
            current_team: updatedPlayer.team,
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};
