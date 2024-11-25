/**
 * Tournament Management Module
 *
 * This module provides controllers for managing tournaments, including creation, retrieval, updates, deletion,
 * managing teams, handling points tables, and statistics.
 */

import { Tournament } from '../../../db/model/index.js';
import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";
import validateAndSortPointTable from '../../validator/pointstableValidator.js';

/**
 * Creates a new tournament.
 *
 * @async
 * @function createTournament
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body containing tournament details.
 * @param {string} req.body.name - The name of the tournament.
 * @param {Date} req.body.startDate - The start date of the tournament.
 * @param {Date} req.body.endDate - The end date of the tournament.
 * @param {string} [req.body.location] - The location of the tournament.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function creates a new tournament in the database. It validates required fields, creates a tournament, and
 * responds with the newly created tournament's details. The name and start date fileds are immutable.
 *
 * @example
 * POST /api/v1/tournaments
 * {
 *   "name": "ACE Sports EVE",
 *   "startDate": "02-12-2024",
 *   "endDate": "03-12-2024",
 *   "location": "New York"
 * }
 *
 * @returns {JSON} 201 - Tournament created successfully with details.
 */
export const createTournament = async (req, res, next) => {
    try {
        const { name, startDate, endDate, location } = req.body;

        if (!name || !startDate || !endDate) {
            httpError(next, new Error(responseMessage.BAD_REQUEST), req, 400);
            return;
        }

        const tournament = await Tournament.create({
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            location
        });
        httpResponse(res, 201, responseMessage.RESOURCE_CREATED('Tournament'), tournament);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves all tournaments with optional pagination and filtering.
 *
 * @async
 * @function getTournaments
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.query - Query parameters for pagination and filtering.
 * @param {string} [req.query.name] - Filter by tournament name (case-insensitive).
 * @param {number} [req.query.page=1] - The page number for pagination (default: 1).
 * @param {number} [req.query.rows=10] - The number of rows per page (default: 10).
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function retrieves a paginated list of tournaments from the database. It supports optional name-based filtering.
 *
 * @example
 * GET /api/v1/tournaments?page=1&rows=5&name=Cup
 *
 * @returns {JSON} 200 - List of tournaments matching the criteria.
 */
export const getTournaments = async (req, res, next) => {
    try {
        const { name, page = 1, rows = 10 } = req.query;

        const query = name ? { name: new RegExp(name, 'i') } : {};
        const skip = (page - 1) * rows;

        const tournaments = await Tournament.find(query)
            .skip(skip)
            .limit(rows)
            .lean()
            .exec();

        httpResponse(res, 200, responseMessage.FETCHED('Tournaments'), tournaments);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves a specific tournament by ID.
 *
 * @async
 * @function getTournament
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament to retrieve.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function retrieves a tournament's details by its ID, including associated teams and matches.
 *
 * @example
 * GET /api/v1/tournaments/:tournamentId
 *
 * @returns {JSON} 200 - Details of the specified tournament.
 */
export const getTournament = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId)
            .populate('teams')
            .populate('matches')
            .lean()
            .exec();

        if (!tournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        httpResponse(res, 200, responseMessage.FETCHED('Tournament'), tournament);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates a tournament's details.
 *
 * @async
 * @function updateTournament
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament to update.
 * @param {Object} req.body - The updated tournament details.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function updates the details of an existing tournament. Fields in the request body are used to update
 * the corresponding tournament document in the database.
 *
 * @example
 * PATCH /api/v1/tournaments/:tournamentId
 * {
 *   "location": "Los Angeles"
 * }
 *
 * @returns {JSON} 200 - Updated details of the tournament.
 */
export const updateTournament = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const updateData = req.body;

        const updatedTournament = await Tournament.findByIdAndUpdate(tournamentId, updateData, { new: true, runValidators: true  }).exec();

        if (!updatedTournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        httpResponse(res, 200, responseMessage.RESOURCE_UPDATED('Tournament'), updatedTournament);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Deletes a tournament by ID.
 *
 * @async
 * @function deleteTournament
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament to delete.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function deletes a tournament from the database by its ID.
 *
 * @example
 * DELETE /api/v1/tournaments/:tournamentId
 *
 * @returns {JSON} 200 - Confirmation of successful deletion.
 */
export const deleteTournament = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;

        const deletedTournament = await Tournament.findByIdAndDelete(tournamentId).exec();

        if (!deletedTournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        httpResponse(res, 200, responseMessage.RESOURCE_DELETED('Tournament'), deletedTournament);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Adds teams to a tournament.
 *
 * @async
 * @function addTeamsToTournament
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body containing team IDs.
 * @param {string[]} req.body.team_ids - Array of team IDs to add.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function adds one or more teams to an existing tournament.
 *
 * @example
 * PATCH /api/v1/tournaments/:tournamentId/teams
 * {
 *   "team_ids": ["team1", "team2"]
 * }
 *
 * @returns {JSON} 200 - Updated list of teams in the tournament.
 */
export const addTeamsToTournament = async (req, res, next) => {
    try {
        const { team_ids } = req.body;
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId).exec();
        if (!tournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        const filteredTeams = team_ids.filter((team_id) => !tournament.teams.includes(team_id));
        tournament.teams.push(...filteredTeams);
        await tournament.save();

        httpResponse(res, 200, responseMessage.RESOURCE_UPDATED('Tournament Teams'), tournament.teams);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};


/**
 * Removes a team from a tournament.
 *
 * @async
 * @function removeTeamFromTournament
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {string} req.params.teamId - The ID of the team to remove.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function removes a specific team from a tournament's list of teams. If the team is not found,
 * it returns an appropriate error message.
 *
 * @example
 * DELETE /api/v1/tournaments/:tournamentId/teams/:teamId
 *
 * @returns {JSON} 200 - Confirmation of successful removal.
 */
export const removeTeamFromTournament = async (req, res, next) => {
    try {
        const { teamId, tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId).exec();
        if (!tournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        const teamIndex = tournament.teams.indexOf(teamId);
        if (teamIndex === -1) {
            httpError(next, new Error(`Team not found in Tournament ${tournament.name}`), req, 404);
            return;
        }

        tournament.teams.splice(teamIndex, 1);
        await tournament.save();

        httpResponse(res, 200, responseMessage.RESOURCE_DELETED(`Team in Tournament ${tournament.name}`), tournament.teams);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves the teams in a specific tournament.
 *
 * @async
 * @function getTeamsInTournament
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function fetches and returns all teams participating in a specific tournament.
 *
 * @example
 * GET /api/v1/tournaments/:tournamentId/teams
 *
 * @returns {JSON} 200 - List of teams in the tournament.
 */
export const getTeamsInTournament = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId).populate('teams').lean().exec();
        if (!tournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return
        }

        httpResponse(res, 200, responseMessage.FETCHED('Teams from Tournament'), tournament.teams);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates the points table of a tournament.
 *
 * @async
 * @function updatePointsTable
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {Object} req.body - The updated points table.
 * @param {Array} req.body.point_table - The new points table entries.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function updates the points table of a tournament. It validates and sorts the entries before saving.
 *
 * @example
 * PATCH /api/v1/tournaments/:tournamentId/points-table
 * {
 *   "point_table": [
 *     { "team": "team1", "points": 10, ...others },
 *     { "team": "team2", "points": 5, ...others }
 *   ]
 * }
 *
 * @returns {JSON} 200 - Updated points table for the tournament.
 */
export const updatePointsTable = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const { point_table } = req.body;

        const tournament = await Tournament.findById(tournamentId).exec();
        if (!tournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        const { validTable, invalidEntries } = validateAndSortPointTable(point_table);
        if (invalidEntries.length > 0) {
            httpError(next, new Error(`Validation failed: ${JSON.stringify(invalidEntries)}`),
                req, 400);
            return;
        }

        tournament.point_table = validTable;
        await tournament.save();

        httpResponse(res, 200, responseMessage.RESOURCE_UPDATED('Points Table'), tournament.point_table);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates points for a specific team in a tournament's points table.
 *
 * @async
 * @function updateTeamPoints
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.id - The ID of the tournament.
 * @param {Object} req.body - The request body containing team points details.
 * @param {string} req.body.team_id - The ID of the team whose points are being updated.
 * @param {Object} req.body.points - The points data to update.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function updates the points for an individual team in a tournament's points table. It validates the input,
 * checks if the team exists in the points table, and updates the data accordingly.
 *
 * @example
 * PATCH /api/v1/tournaments/:id/points/team
 * {
 *   "team_id": "team123",
 *   "points": {
 *     "matchesPlayed": 5,
 *     "wins": 3,
 *     "losses": 2,
 *     "points": 6
 *   }
 * }
 *
 * @returns {JSON} 200 - Updated points table of the tournament.
 */
export const updateTeamPoints = async (req, res, next) => {
    try {
        const { id } = req.params; // Tournament ID
        const { points, team_id } = req.body; // Points and team_id from the request body

        // Fetch the tournament and populate the point_table
        const tournament = await Tournament.findById(id).populate('point_table').exec();

        if (!tournament) {
            return httpError(next, new Error('Tournament not found'), req, 404); // Handle case where tournament is not found
        }

        // Validate and sort the provided points data
        const { validTable, invalidEntries } = validateAndSortPointTable([points]);

        // If there are invalid entries, return an error
        if (invalidEntries.length > 0) {
            return httpError(next, new Error(`Validation failed for some entries: ${JSON.stringify(invalidEntries)}`), req, 400);
        }

        // Find the team entry in the point_table array
        const teamIndex = tournament.point_table.findIndex(
            (entry) => entry.team.toString() === team_id.toString()
        );

        if (teamIndex === -1) {
            // If the team is not found in the point_table, return an error
            return httpError(next, new Error('Team not found in the point table'), req, 404);
        }

        // Update the team's points data
        tournament.point_table[teamIndex] = {
            ...tournament.point_table[teamIndex],
            ...validTable[0],
        };

        // Save the updated tournament
        await tournament.save();

        // Send the updated point table in the response
        httpResponse(
            res,
            200,
            responseMessage.RESOURCE_UPDATED('Points Table Updated'),
            tournament.point_table
        );
    } catch (error) {
        // Catch any unexpected errors
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves the points table of a tournament.
 *
 * @async
 * @function getPointsTable
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function retrieves the points table of a tournament. If the points table is empty,
 * it provides a message indicating that the tournament has not started.
 *
 * @example
 * GET /api/v1/tournaments/:tournamentId/points-table
 *
 * @returns {JSON} 200 - The points table for the tournament or an appropriate message.
 */
export const getPointsTable = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId).lean().exec();
        if (!tournament) {
            return httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
        }

        if (!tournament.point_table.length) {
            return httpResponse(res, 200, responseMessage.FETCHED('Points Table'), {
                message: 'Points table will be updated after the tournament starts.',
            });
        }

        httpResponse(res, 200, responseMessage.FETCHED('Points Table'), tournament.point_table);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves statistics for a tournament.
 *
 * @async
 * @function getStats
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function retrieves statistics for a tournament. If no statistics are available,
 * it provides a message indicating that the statistics will be updated after the tournament ends.
 *
 * @example
 * GET /api/v1/tournaments/:tournamentId/stats
 *
 * @returns {JSON} 200 - Statistics for the tournament or an appropriate message.
 */
export const getStats = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId).lean().exec();
        if (!tournament) {
            return httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
        }

        if (!Object.keys(tournament.stats).length) {
            return httpResponse(res, 200, responseMessage.FETCHED('Tournament Statistics'), {
                message: 'Tournament statistics will be updated after the tournament ends.',
            });
        }

        httpResponse(res, 200, responseMessage.FETCHED('Tournament Statistics'), tournament.stats);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates statistics for a tournament.
 *
 * @async
 * @function updateStats
 * @param {Object} req - The HTTP request object.
 * @param {string} req.params.tournamentId - The ID of the tournament.
 * @param {Object} req.body - The updated statistics.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - Middleware function for error handling.
 *
 * @description
 * This function updates the statistics for a tournament. It merges the provided statistics with existing ones.
 *
 * @example
 * PATCH /api/v1/tournaments/:tournamentId/stats
 * {
 *   "stats": { "most_runs": "player1", "most_wickets": "player2" }
 * }
 *
 * @returns {JSON} 200 - Updated statistics for the tournament.
 */
export const updateStats = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const { stats } = req.body;

        if (!stats || typeof stats !== 'object') {
            httpError(next, new Error(responseMessage.BAD_REQUEST), req, 400);
            return;
        }

        const tournament = await Tournament.findById(tournamentId).exec();
        if (!tournament) {
            httpError(next, new Error(responseMessage.RESOURCE_NOT_FOUND('Tournament')), req, 404);
            return;
        }

        tournament.stats = { ...tournament.stats, ...stats };
        await tournament.save();

        httpResponse(res, 200, responseMessage.RESOURCE_UPDATED('Tournament Stats'), tournament.stats);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};
