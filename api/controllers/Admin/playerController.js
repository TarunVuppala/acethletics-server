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