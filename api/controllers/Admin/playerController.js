import { CricketPlayer } from "../../../db/model/index.js";

import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";

import playerValidator from "../../validator/playerValidator.js";

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
        const { error, value } = playerValidator.validate(req.body);
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
        // Log the error and pass it to the error-handling middleware
        logger.error("Error fetching players", { error });
        httpError(next, error, req, 500);
    }
};
