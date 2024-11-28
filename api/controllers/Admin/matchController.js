import mongoose from 'mongoose';
import { Innings, Match, Team, Tournament } from '../../../db/model/index.js';
import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";
import ballOutcomes from '../../../constant/ballOutcomes.js';
import { io } from '../../../server.js';
import Status from '../../../db/model/PlayerStatus.js';

/**
 * Creates a new match within a tournament.
 */
export const createMatch = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const { startTime, location, team_Aid, team_Bid } = req.body;

        // Regular expression for validating startTime (Format: "HH:MM AM/PM DD/MM/YYYY")
        const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM) (0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

        // Check if required fields are provided
        if (!startTime || !location || !team_Aid || !team_Bid) {
            httpError(next, new Error(responseMessage.BAD_REQUEST || 'All required fields must be provided'), req, 400);
            return;
        }

        // Validate startTime format
        if (!timeRegex.test(startTime)) {
            httpError(next, new Error(responseMessage.INVALID_INPUT('Start Time') || 'Invalid Start Time format'), req, 400);
            return;
        }

        // Check if the tournament exists before creating the match
        const tournament = await Tournament.findById(tournamentId).exec();
        if (!tournament) {
            httpError(next, new Error('Tournament not found'), req, 404);
            return;
        }

        // Validate if both teams exist
        const [teamA, teamB] = await Promise.all([
            Team.findById(team_Aid).exec(),
            Team.findById(team_Bid).exec(),
        ]);

        if (!teamA || !teamB) {
            httpError(next, new Error('One or both teams not found'), req, 404);
            return;
        }

        // Parse startTime to a standard Date object
        // Assuming the format "HH:MM AM/PM DD/MM/YYYY"
        const [time, period, day, month, year] = startTime.match(/(\d{2}:\d{2}) (AM|PM) (\d{2})\/(\d{2})\/(\d{4})/).slice(1);
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        const parsedStartTime = new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00Z`);

        // Create the match
        const match = await Match.create({
            tournament_id: tournamentId,
            startTime: parsedStartTime,
            location,
            team_Aid: teamA._id,
            team_Bid: teamB._id,
        });

        // Add the match to the tournament's matches array
        tournament.matches.push(match._id);
        await tournament.save();

        // Send response back with the created match data
        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves matches for a specific tournament with pagination.
 */
export const getMatches = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const { page = 1, rows = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(rows);

        const matches = await Match.find({ tournament_id: tournamentId })
            .skip(skip)
            .limit(parseInt(rows))
            .populate('innings')
            .lean()
            .exec();

        if (!matches || matches.length === 0) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Matches'));
            return;
        }

        httpResponse(req, res, 200, responseMessage.FETCHED('Matches'), matches);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves a specific match by its ID.
 */
export const getMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findById(matchId)
            .populate({
                path: 'team_Aid',
                select: 'team_name',
            })
            .populate({
                path: 'team_Bid',
                select: 'team_name',
            })
            .lean()
            .exec();

        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            return;
        }

        httpResponse(req, res, 200, responseMessage.FETCHED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates details of a specific match.
 */
export const updateMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const updatedDetails = req.body;

        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            return;
        }

        match.set(updatedDetails);
        await match.save();

        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Deletes a specific match by its ID.
 */
export const deleteMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findByIdAndDelete(matchId).exec();

        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            return;
        }

        // Optionally, you might want to remove the match from the tournament's matches array
        await Tournament.findByIdAndUpdate(match.tournament_id, { $pull: { matches: match._id } }).exec();

        httpResponse(req, res, 200, responseMessage.DELETED('Match'));
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates the status of a specific match.
 */
export const updateMatchStatus = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { status } = req.body;

        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            return;
        }

        match.status = status;
        await match.save();

        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates the toss details of a specific match.
 */
export const updateTossStatus = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { toss } = req.body;

        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            return;
        }

        match.toss = toss;
        await match.save();

        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};


/**
 * Starts a new innings within a match.
 */
export const startInnings = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const {
            innings_number,
            batting_team_id,
            bowling_team_id,
            batting_order,
            initial_bowler_id, // Initial bowler to start the innings
        } = req.body;

        // Validate required fields
        if (!batting_order || !Array.isArray(batting_order) || batting_order.length < 2) {
            httpError(next, new Error('Batting order must include at least two players'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        if (!initial_bowler_id) {
            httpError(next, new Error('Initial bowler ID must be provided'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch the match
        const match = await Match.findById(matchId).session(session).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch the batting team and verify players
        const battingTeam = await Team.findById(batting_team_id)
            .populate({
                path: 'players',
                select: 'player_id',
            })
            .session(session)
            .exec();

        if (!battingTeam) {
            httpError(next, new Error('Batting team not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Verify that each player in batting_order is part of the batting team
        const battingTeamPlayerIds = battingTeam.players.map(player => player.player_id.toString());
        const invalidBatsmen = batting_order.filter(playerId => !battingTeamPlayerIds.includes(playerId));

        if (invalidBatsmen.length > 0) {
            httpError(next, new Error(`Players ${invalidBatsmen.join(', ')} are not part of the batting team`), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch the bowling team with players
        const bowlingTeam = await Team.findById(bowling_team_id)
            .populate({
                path: 'players',
                select: 'player_id skill',
            })
            .session(session)
            .exec();

        if (!bowlingTeam) {
            httpError(next, new Error('Bowling team not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Verify that initial_bowler_id is part of the bowling team
        const bowlingTeamPlayerIds = bowlingTeam.players.map(player => player.player_id.toString());
        if (!bowlingTeamPlayerIds.includes(initial_bowler_id)) {
            httpError(next, new Error('Initial bowler is not part of the bowling team'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Find the wicket-keeper from the bowling team's players
        const wicketKeeper = bowlingTeam.players.find(player => player.skill.role.includes('wicket_keeper'));

        if (!wicketKeeper) {
            httpError(next, new Error('Wicket-keeper not found in bowling team'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Create Status documents for initial batsmen, wicket-keeper, and initial bowler concurrently
        const [batsman1Status, batsman2Status, wicketKeeperStatus, initialBowlerStatus] = await Promise.all([
            Status.create([{
                player_id: batting_order[0],
                match_id: matchId,
                innings_number: innings_number,
                stricking_role: 1, // 1 for striker
            }], { session }),
            Status.create([{
                player_id: batting_order[1],
                match_id: matchId,
                innings_number: innings_number,
                stricking_role: 2, // 2 for non-striker
            }], { session }),
            Status.create([{
                player_id: wicketKeeper.player_id,
                match_id: matchId,
                innings_number: innings_number,
                // Additional fields if needed
            }], { session }),
            Status.create([{
                player_id: initial_bowler_id,
                match_id: matchId,
                innings_number: innings_number,
                // Additional fields if needed
            }], { session }),
        ]);

        // Extract the created documents
        const [batsman1, batsman2, wicketKeeperDoc, initialBowlerDoc] = [
            batsman1Status[0],
            batsman2Status[0],
            wicketKeeperStatus[0],
            initialBowlerStatus[0],
        ];

        // Create the innings
        const innings = await Innings.create([{
            match_id: matchId,
            innings_number,
            batting_team_id,
            bowling_team_id,
            batting_order,
            current_batsmen: [batsman1._id, batsman2._id],
            wicket_keeper: wicketKeeperDoc._id,
            current_bowler: initialBowlerDoc._id,
            score: {
                runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                extras: {
                    wides: 0,
                    noBalls: 0,
                    byes: 0,
                    legByes: 0,
                    penalty_runs: 0,
                    total: 0,
                },
            },
        }], { session });

        // Extract the created innings
        const [inningsDoc] = innings;

        // Add the innings to the match's innings array
        match.innings.push(inningsDoc._id);
        await match.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Respond with the created innings
        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Innings'), inningsDoc);
    } catch (error) {
        // Abort the transaction in case of error
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves all innings of a specific match.
 */
export const getMatchInnings = async (req, res, next) => {
    try {
        const { matchId } = req.params;

        const match = await Match.findById(matchId)
            .populate({
                path: 'innings',
                select: '-__v', // Exclude unnecessary fields
                populate: [
                    { path: 'current_batsmen', select: '-__v' },
                    { path: 'wicket_keeper', select: '-__v' },
                    { path: 'current_bowler', select: '-__v' },
                ],
            })
            .lean()
            .exec();

        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            return;
        }

        httpResponse(req, res, 200, responseMessage.FETCHED('Innings'), match.innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates an innings based on the outcome of a ball.
 */
export const updateInnings = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { inningsId } = req.params;
        const {
            outcome,
            bowler_id,
            fielder_id,
            dismissal_type,
            next_batsman_id,
            next_batsman_strike_role, // 1 for striker, 2 for non-striker
        } = req.body;

        // Validate required fields
        if (outcome === 'wicket' && (!next_batsman_id || !next_batsman_strike_role)) {
            httpError(next, new Error('Next batsman ID and strike role must be provided when a wicket falls'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        if (next_batsman_strike_role && ![1, 2].includes(next_batsman_strike_role)) {
            httpError(next, new Error('Next batsman strike role must be 1 (striker) or 2 (non-striker)'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch innings document with required references
        const innings = await Innings.findById(inningsId)
            .populate({
                path: 'current_batsmen',
                populate: { path: 'player_id' },
            })
            .populate('current_bowler')
            .populate('wicket_keeper')
            .session(session)
            .exec();

        if (!innings) {
            httpError(next, new Error('Innings not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        const ballOutcome = ballOutcomes[outcome];
        if (!ballOutcome) {
            httpError(next, new Error('Invalid outcome'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Initialize score if undefined
        if (!innings.score) {
            innings.score = {
                runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                extras: {
                    wides: 0,
                    noBalls: 0,
                    byes: 0,
                    legByes: 0,
                    penalty_runs: 0,
                    total: 0,
                },
            };
        }

        // Update innings score
        innings.score.runs += ballOutcome.runs + (ballOutcome.extras || 0);
        innings.score.extras.total += ballOutcome.extras || 0;

        // Update specific extras based on outcome
        switch (outcome) {
            case 'wide':
                innings.score.extras.wides += ballOutcome.extras;
                break;
            case 'noball':
                innings.score.extras.noBalls += ballOutcome.extras;
                break;
            case 'bye':
                innings.score.extras.byes += ballOutcome.extras;
                break;
            case 'leg_bye':
                innings.score.extras.legByes += ballOutcome.extras;
                break;
            // Add other cases if needed
        }

        // Update balls and overs if ball counts
        if (ballOutcome.ball_counts) {
            innings.score.balls += 1;
            innings.score.overs = Math.floor(innings.score.balls / 6) + ((innings.score.balls % 6) / 10);
        }

        // Prepare bulk operations for Status updates
        const bulkOps = [];

        // Update bowler's stats
        if (bowler_id) {
            // If bowler_id has changed, update the current_bowler field
            if (!innings.current_bowler || innings.current_bowler.player_id.toString() !== bowler_id) {
                // Find or create the new bowler's Status document
                let newBowlerStatus = await Status.findOne({
                    player_id: bowler_id,
                    match_id: innings.match_id,
                    innings_number: innings.innings_number,
                }).session(session).exec();

                if (!newBowlerStatus) {
                    newBowlerStatus = await Status.create(
                        {
                            player_id: bowler_id,
                            match_id: innings.match_id,
                            innings_number: innings.innings_number,
                            // Initialize other fields as needed
                        },
                        { session }
                    );
                }

                // Update innings.current_bowler
                innings.current_bowler = newBowlerStatus._id;
            }

            // Update bowler's stats
            bulkOps.push({
                updateOne: {
                    filter: { _id: innings.current_bowler },
                    update: {
                        $inc: {
                            bowlruns: ballOutcome.runs + (ballOutcome.extras || 0),
                            bowled_overs: ballOutcome.ball_counts ? 1 / 6 : 0,
                            wicket: ballOutcome.is_wicket ? 1 : 0,
                            wideball: outcome === 'wide' ? 1 : 0,
                            noball: outcome === 'noball' ? 1 : 0,
                        },
                    },
                },
            });
        }

        // Identify the striker
        const striker = innings.current_batsmen.find((batsman) => batsman.stricking_role === 1);
        if (!striker) {
            httpError(next, new Error('Striker not found'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Update striker's stats
        bulkOps.push({
            updateOne: {
                filter: { _id: striker._id },
                update: {
                    $inc: {
                        bat_run: ballOutcome.runs,
                        played_ball: ballOutcome.ball_counts ? 1 : 0,
                        hitted_fours: ballOutcome.runs === 4 ? 1 : 0,
                        hitted_sixes: ballOutcome.runs === 6 ? 1 : 0,
                    },
                },
            },
        });

        // Handle wicket
        if (ballOutcome.is_wicket) {
            innings.score.wickets += 1;

            // Update striker's out details
            bulkOps.push({
                updateOne: {
                    filter: { _id: striker._id },
                    update: {
                        $set: {
                            out_type: dismissal_type || ballOutcome.dismissal_info || 'Out',
                            bowler_when_out: bowler_id || null,
                            stricking_role: 0, // Indicate out
                        },
                    },
                },
            });

            // Update fielder's stats
            if (fielder_id && dismissal_type) {
                const fielderUpdate = {};
                if (dismissal_type === 'caught') {
                    fielderUpdate.catches = 1;
                } else if (dismissal_type === 'stumped') {
                    fielderUpdate.stumpings = 1;
                }
                // Add more dismissal types as needed

                if (Object.keys(fielderUpdate).length > 0) {
                    bulkOps.push({
                        updateOne: {
                            filter: {
                                player_id: fielder_id,
                                match_id: innings.match_id,
                                innings_number: innings.innings_number,
                            },
                            update: {
                                $inc: fielderUpdate,
                            },
                            upsert: true,
                        },
                    });
                }
            }

            // Remove striker from current_batsmen
            innings.current_batsmen = innings.current_batsmen.filter(
                (batsman) => batsman.stricking_role !== 0
            );

            // Add next batsman from frontend
            if (next_batsman_id) {
                const nextBatsmanStatus = await Status.create(
                    {
                        player_id: next_batsman_id,
                        match_id: innings.match_id,
                        innings_number: innings.innings_number,
                        stricking_role: next_batsman_strike_role,
                        // Initialize other fields as needed
                    },
                    { session }
                );

                innings.current_batsmen.push(nextBatsmanStatus._id);

                // Adjust the existing non-striker's role if needed
                innings.current_batsmen.forEach((batsman) => {
                    if (batsman.toString() !== nextBatsmanStatus._id.toString()) {
                        const newRole = next_batsman_strike_role === 1 ? 2 : 1;
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: batsman },
                                update: { $set: { stricking_role: newRole } },
                            },
                        });
                    }
                });
            } else {
                httpError(next, new Error('Next batsman ID must be provided when a wicket falls'), req, 400);
                await session.abortTransaction();
                session.endSession();
                return;
            }
        } else {
            // Swap strike if runs are odd
            if (ballOutcome.ball_counts && ballOutcome.runs % 2 !== 0) {
                innings.current_batsmen.forEach((batsman) => {
                    batsman.stricking_role = batsman.stricking_role === 1 ? 2 : 1;
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: batsman._id },
                            update: { $set: { stricking_role: batsman.stricking_role } },
                        },
                    });
                });
            }

            // Swap strike at the end of the over
            if (ballOutcome.ball_counts && innings.score.balls % 6 === 0) {
                innings.current_batsmen.forEach((batsman) => {
                    batsman.stricking_role = batsman.stricking_role === 1 ? 2 : 1;
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: batsman._id },
                            update: { $set: { stricking_role: batsman.stricking_role } },
                        },
                    });
                });
            }
        }

        // Perform all bulk operations in a single bulkWrite
        if (bulkOps.length > 0) {
            await Status.bulkWrite(bulkOps, { session });
        }

        // Save the updated innings
        await innings.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        if (typeof io !== 'undefined') {
            io.emit('innings-updated', {
                matchId: innings.match_id,
                inningsId,
                innings,
            });
        }

        // Respond with the updated innings
        httpResponse(req, res, 200, responseMessage.UPDATED('Innings'), innings);
    } catch (error) {
        // Abort the transaction in case of error
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};
