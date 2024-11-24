import { Team } from '../../../db/model/index.js';

import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";

/**
 * Creates a new team.
 *
 * @async
 * @function createTeam
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body containing team details.
 * @param {string} req.body.team_name - The name of the team to create.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Creates a new team if it does not already exist.
 * - Validates input and handles specific database errors.
 *
 * @example
 * POST /api/v1/teams
 * {
 *   "team_name": "New Team"
 * }
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Team created successfully",
 *   "data": {
 *     "team_name": "New Team"
 *   }
 * }
 */
export const createTeam = async (req, res, next) => {
    try {
        const { team_name, players } = req.body;

        // Check if team_name is provided
        if (!team_name) {
            return httpError(next, new Error("Team name is required"), req, 400);
        }

        // Check if the team already exists
        const exists = await Team.findOne({ team_name }).lean().exec();
        if (exists) {
            return httpError(next, new Error(responseMessage.RESOURCE_ALREADY_EXISTS('Team')), req, 400);
        }

        // Create the new team
        const team = await Team.create({
            team_name,
            players: [
                ...players
            ]
        });
        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Team'), {
            team_name: team.team_name,
        });
    } catch (error) {
        // Handle database-specific errors
        if (error instanceof mongoose.Error.ValidationError) {
            const errorMessage = `Validation Error: ${Object.values(error.errors)
                .map((err) => err.message)
                .join('; ')}`;
            return httpError(next, new Error(errorMessage), req, 400);
        }
        if (error.code === 11000) {
            return httpError(next, new Error('Duplicate key detected: Team name already exists.'), req, 400);
        }
        httpError(next, error, req, 500);
    }
};


/**
 * Retrieves a paginated list of teams.
 *
 * @async
 * @function getTeams
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} [req.query.page=1] - The page number for pagination.
 * @param {string} [req.query.rows=10] - The number of rows per page.
 * @param {string} [req.query.name] - The name filter for teams.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Fetches a list of teams with optional pagination and name filtering.
 *
 * @example
 * GET /api/v1/teams?page=1&rows=10&name=team
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Teams fetched successfully",
 *   "data": [
 *     { "team_name": "Team A" },
 *     { "team_name": "Team B" }
 *   ]
 * }
 */
export const getTeams = async (req, res, next) => {
    try {
        const { page = 1, rows = 10, name = '' } = req.query;

        const pageNumber = Number(page);
        const rowsPerPage = Number(rows);
        const skip = (pageNumber - 1) * rowsPerPage;

        const teams = await Team.find({
            team_name: { $regex: name, $options: 'i' }
        })
            .sort({ team_name: 1 })
            .skip(skip)
            .limit(rowsPerPage)
            .lean()
            .exec();

        httpResponse(req, res, 200, responseMessage.FETCHED('Teams'), teams);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves a specific team by ID.
 *
 * @async
 * @function getTeam
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the team to retrieve.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Fetches a team's details, including associated players.
 *
 * @example
 * GET /api/v1/teams/:id
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Team fetched successfully",
 *   "data": {
 *     "team_name": "Team A",
 *     "players": [ ... ]
 *   }
 * }
 */
export const getTeam = async (req, res, next) => {
    try {
        const { id } = req.params;

        const team = await Team.findById(id).
            populate('players')
            .lean()
            .exec();
        if (!team) {
            return httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Team')), req, 404);
        }

        httpResponse(req, res, 200, responseMessage.FETCHED('Team'), team);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates a team's details.
 *
 * @async
 * @function updateTeam
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the team to update.
 * @param {Object} req.body - The updated team data.
 * @param {string} [req.body.team_name] - The updated team name.
 * @param {Array<string>} [req.body.playersId] - Array of player IDs to add to the team.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Updates a team's name and/or adds players to the team.
 *
 * @example
 * PUT /api/v1/teams/:id
 * {
 *   "team_name": "Updated Team",
 *   "playersId": ["player1", "player2"]
 * }
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Team updated successfully",
 *   "data": { ... }
 * }
 */
export const updateTeam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { team_name, playersId } = req.body;

        const team = await Team.findById(id).lean().exec();
        if (!team) {
            return httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Team')), req, 404);
        }

        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            {
                team_name: team_name || team.team_name,
                players: [...team.players, ...(playersId || [])],
            },
            { new: true, runValidators: true }
        ).lean().exec();

        httpResponse(req, res, 200, responseMessage.RESOURCE_UPDATED('Team'), updatedTeam);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};


/**
 * Deletes a team by ID.
 *
 * @async
 * @function deleteTeam
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the team to delete.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * - Deletes a team from the database.
 *
 * @example
 * DELETE /api/v1/teams/:id
 *
 * @response {JSON} Success Response
 * {
 *   "message": "Team deleted successfully"
 * }
 */
export const deleteTeam = async (req, res, next) => {
    try {
        const { id } = req.params;

        const team = await Team.findByIdAndDelete(id).lean().exec();
        if (!team) {
            return httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Team')), req, 404);
        }

        httpResponse(req, res, 200, responseMessage.RESOURCE_DELETED('Team'));
    } catch (error) {
        httpError(next, error, req, 500);
    }
};
