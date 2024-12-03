import mongoose from 'mongoose';
import { Match, Innings, Status, Team, Tournament } from '../../../db/model/index.js';
import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";
import ballOutcomes from '../../../constant/ballOutcomes.js';

/**
 * Create a new match within a tournament.
 * POST /api/admin/tournaments/:tournamentId/matches
 */
export const createMatch = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentId } = req.params;
        const { startTime, location, team_Aid, team_Bid, overs } = req.body;

        // Regular expression for validating startTime (Format: "HH:MM AM/PM DD/MM/YYYY")
        const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM) (0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

        // Check if required fields are provided
        if (!startTime || !location || !team_Aid || !team_Bid) {
            httpError(next, new Error('All required fields must be provided'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Validate startTime format
        if (!timeRegex.test(startTime)) {
            httpError(next, new Error('Invalid Start Time format'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Check if the tournament exists before creating the match
        const tournament = await Tournament.findById(tournamentId).session(session).exec();
        if (!tournament) {
            httpError(next, new Error('Tournament not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Validate if both teams exist
        const [teamA, teamB] = await Promise.all([
            Team.findById(team_Aid).session(session).exec(),
            Team.findById(team_Bid).session(session).exec(),
        ]);

        if (!teamA || !teamB) {
            httpError(next, new Error('One or both teams not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
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
        const match = await Match.create([{
            tournament_id: tournamentId,
            startTime: parsedStartTime,
            location,
            team_Aid: teamA._id,
            team_Bid: teamB._id,
            overs
        }], { session });

        // Add the match to the tournament's matches array
        tournament.matches.push(match[0]._id);
        await tournament.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        const io = req.app.get('io');
        if (io) {
            io.emit('match-created', match[0]);
        }

        // Send response back with the created match data
        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Match'), match[0]);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves matches for a specific tournament with pagination.
 * GET /api/admin/tournaments/:tournamentId/matches
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
            .populate({
                path: 'innings',
                select: 'innings_number batting_team_id bowling_team_id score status '
            })
            .populate('team_Aid', 'team_name')
            .populate('team_Bid', 'team_name')
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
 * GET /api/admin/matches/:matchId
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
            .populate({
                path: 'innings'
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
 * PUT /api/admin/matches/:matchId
 */
export const updateMatch = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const updatedDetails = req.body;

        const match = await Match.findById(matchId).session(session).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Prevent updating immutable fields
        const immutableFields = ['tournament_id', 'team_Aid', 'team_Bid'];
        for (const field of immutableFields) {
            if (updatedDetails.hasOwnProperty(field)) {
                httpError(next, new Error(`${field} cannot be updated.`), req, 400);
                await session.abortTransaction();
                session.endSession();
                return;
            }
        }

        // Update allowed fields
        Object.keys(updatedDetails).forEach(key => {
            match[key] = updatedDetails[key];
        });

        await match.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        const io = req.app.get('io');
        if (io) {
            io.emit('match-updated', match);
        }

        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};

/**
 * Deletes a specific match by its ID.
 * DELETE /api/admin/matches/:matchId
 */
export const deleteMatch = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            httpError(next, new Error('Invalid Match ID.'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        const match = await Match.findByIdAndDelete(matchId).session(session).exec();

        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Remove the match from the tournament's matches array
        await Tournament.findByIdAndUpdate(match.tournament_id, { $pull: { matches: match._id } }).session(session).exec();

        // Delete related innings and status documents
        await Innings.deleteMany({ match_id: matchId }).session(session).exec();
        await Status.deleteMany({ match_id: matchId }).session(session).exec();

        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        const io = req.app.get('io');
        if (io) {
            io.emit('match-deleted', { matchId });
        }

        httpResponse(req, res, 200, responseMessage.DELETED('Match'));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};

/**
 * Updates the status of a specific match.
 * PUT /api/admin/matches/:matchId/status
 */
export const updateMatchStatus = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const { status } = req.body;

        const validStatuses = ['upcoming', 'in_progress', 'completed', 'cancelled', 'abandoned'];

        if (!validStatuses.includes(status)) {
            httpError(next, new Error(`Status must be one of ${validStatuses.join(', ')}.`), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        const match = await Match.findById(matchId).session(session).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            await session.abortTransaction();
            session.endSession();
            return;
        }

        match.status = status;
        await match.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        const io = req.app.get('io');
        if (io) {
            io.emit('match-status-updated', match);
        }

        httpResponse(req, res, 200, responseMessage.UPDATED('Match Status'), match);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};

/**
 * Updates the toss details of a specific match.
 * PUT /api/admin/matches/:matchId/toss
 */
export const updateTossStatus = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const { toss_election, tossWinnerId } = req.body;

        if (!toss_election || !['bat', 'bowl'].includes(toss_election)) {
            httpError(next, new Error('Toss election must be either "bat" or "bowl".'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        const match = await Match.findById(matchId).session(session).exec();
        if (!match) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Match'));
            await session.abortTransaction();
            session.endSession();
            return;
        }
        const randomDecision = Math.random() < 0.5;

        if (!tossWinnerId) {
            // Automatically determine the toss winner (for example purposes, randomly choose)
            tossWinnerId = Math.random() < 0.5 ? match.team_Aid : match.team_Bid;
        }

        match.toss = {
            winner: tossWinnerId || randomDecision,
            elected_to: toss_election,
            deferring: match.team_Aid === tossWinnerId ? match.team_Bid : match.team_Aid,
        };
        match.status = 'in_progress';

        await match.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        const io = req.app.get('io');
        if (io) {
            io.emit('toss-updated', match);
        }

        httpResponse(req, res, 200, responseMessage.UPDATED('Toss Status'), match);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        httpError(next, error, req, 500);
    }
};

/**
 * Starts a new innings within a match.
 * POST /api/admin/matches/:matchId/innings
 */
export const startInnings = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const {
            innings_number,
            initial_bowler_id, // Initial bowler to start the innings
        } = req.body;

        // Fetch the match
        const match = await Match.findById(matchId).session(session).exec();
        if (!match) {
            httpError(next, new Error('Match not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        let batting_team_id;
        let bowling_team_id;
        if (innings_number === 1) {
            batting_team_id = match.toss.elected_to === 'bat' ? match.toss.winner : match.toss.deferring;
            bowling_team_id = match.toss.elected_to === 'bat' ? match.toss.deferring : match.toss.winner;
        } else {
            batting_team_id = match.toss.elected_to === 'bat' ? match.toss.deferring : match.toss.winner;
            bowling_team_id = match.toss.elected_to === 'bat' ? match.toss.winner : match.toss.deferring;
        }
        // Validate required fields
        if (!innings_number || !batting_team_id || !bowling_team_id || !initial_bowler_id) {
            httpError(next, new Error('All required fields must be provided'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Ensure innings_number is either 1 or 2
        if (![1, 2].includes(innings_number)) {
            httpError(next, new Error('Innings number must be 1 or 2'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Check if innings_number already exists
        const existingInnings = await Innings.findOne({ match_id: matchId, innings_number }).session(session).exec();
        if (existingInnings) {
            httpError(next, new Error(`Innings ${innings_number} already exists for this match`), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch batting and bowling teams
        const [battingTeam, bowlingTeam] = await Promise.all([
            Team.findById(batting_team_id).populate('players').session(session).exec(),
            Team.findById(bowling_team_id).populate('players').session(session).exec(),
        ]);

        if (!battingTeam || !bowlingTeam) {
            httpError(next, new Error('Batting or Bowling team not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Check if the initial bowler is part of the bowling team
        const isInitialBowlerValid = bowlingTeam.players.find(
            player => {
                player._id === initial_bowler_id
                return player
            }
        );

        if (!isInitialBowlerValid) {
            httpError(next, new Error('Initial bowler is not part of the bowling team'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Find the wicket-keeper from the bowling team
        const wicketKeeper = bowlingTeam.players.find(player => player.skill.roles.includes('wicket_keeper'));

        if (!wicketKeeper) {
            httpError(next, new Error('Wicket-keeper not found in bowling team'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Assume current_batsmen is only striker and non-striker
        const current_batsmen = req.body.batting_order;
        if (!current_batsmen || !Array.isArray(current_batsmen) || current_batsmen.length !== 2) {
            httpError(next, new Error('Batting order must include exactly two players: striker and non-striker'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Validate that the batting players are part of the batting team
        const battingTeamPlayerIds = battingTeam.players.map(player => player._id.toString());
        const invalidBatsmen = current_batsmen.filter(playerId => !battingTeamPlayerIds.includes(playerId.toString()));
        if (invalidBatsmen.length > 0) {
            httpError(next, new Error(`Players ${invalidBatsmen.join(', ')} are not part of the batting team`), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Create Status documents for striker and non-striker
        const [strikerStatus, nonStrikerStatus] = await Promise.all([
            Status.create([{
                player_id: current_batsmen[0],
                match_id: matchId,
                innings_number: innings_number,
                batting: {
                    stricking_role: 1, // 1 for striker
                },
                fielding: {},
            }], { session }),
            Status.create([{
                player_id: current_batsmen[1],
                match_id: matchId,
                innings_number: innings_number,
                batting: {
                    stricking_role: 2, // 2 for non-striker
                },
                fielding: {},
            }], { session }),
        ]);

        // Create Status document for wicket-keeper
        const wicketKeeperStatus = await Status.create([{
            player_id: wicketKeeper._id,
            match_id: matchId,
            innings_number: innings_number,
            // Additional fields if needed
        }], { session });

        // Create Status document for initial bowler
        const initialBowlerStatus = await Status.create([{
            player_id: initial_bowler_id,
            match_id: matchId,
            innings_number: innings_number,
            // Additional fields if needed
        }], { session });

        // Create the innings
        //batting oerder is the oder of players played
        const innings = await Innings.create([{
            match_id: matchId,
            innings_number,
            batting_team_id: batting_team_id,
            bowling_team_id: bowling_team_id,
            batting_order: [],
            current_batsmen: [...current_batsmen],
            wicket_keeper: wicketKeeper._id,
            current_bowler: initial_bowler_id,
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
                isDeclared: false,
                isFollowOn: false,
            },
            commentary: [],
            status: 'ongoing',
        }], { session });

        const inningsDoc = innings[0];

        // Add the innings to the match's innings array
        match.innings.push(inningsDoc._id);
        match.status = 'in_progress';
        await match.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit socket event if using sockets (optional)
        const io = req.app.get('io');
        if (io) {
            io.emit('innings-started', inningsDoc);
        }

        // Respond with the created innings
        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Innings'), inningsDoc);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Retrieves all innings of a specific match.
 * GET /api/admin/matches/:matchId/innings
 */
export const getMatchInnings = async (req, res, next) => {
    try {
        const { matchId } = req.params;

        const innings = await Match.findById(matchId)
            .populate({
                path: 'innings',
                populate: [
                    { path: 'current_batsmen', populate: { path: 'player_id', select: 'name skill' } },
                    { path: 'current_bowler', populate: { path: 'player_id', select: 'name skill' } },
                ]
            })
            .session(session)
            .exec();

        if (!innings || innings.length === 0) {
            httpResponse(req, res, 404, responseMessage.NOT_FOUND('Innings'));
            return;
        }

        httpResponse(req, res, 200, responseMessage.FETCHED('Innings'), innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

/**
 * Updates an innings based on the outcome of a ball.
 * PATCH /api/admin/matches/:matchId/innings/:inningsId/ball
 */
export const updateInnings = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { inningsId, matchId } = req.params;
        const {
            outcome,
            bowler_id,
            fielder_id,
            dismissal_type,
            next_batsman_id,
            next_batsman_strike_role,
            customOutcome,
        } = req.body;

        // Validate required fields
        if (outcome === 'wicket' && !next_batsman_id) {
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

        if (!outcome || customOutcome) {
            httpError(next, new Error('Outcome is required and must be a string.'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        const ballOutcome = ballOutcomes[outcome] || customOutcome;

        if (!ballOutcome) {
            httpError(next, new Error('Invalid or undefined outcome value.'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch innings document with required references
        const innings = await Innings.findById(inningsId)
            .session(session)
            .exec();

        if (!innings) {
            httpError(next, new Error('Innings not found'), req, 404);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        if (innings.status === 'completed') {
            httpError(next, new Error('Cannot update a completed innings'), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Fetch the match
        const match = await Match.findById(matchId).session(session).exec();
        if (!match) {
            httpError(next, new Error('Match not found'), req, 404);
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
                isDeclared: false,
                isFollowOn: false,
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

        // Generate commentary based on outcome
        let description = '';

        if (ballOutcome.description) {
            description += ballOutcome.description;
        } else {
            switch (outcome) {
                case 'run':
                    description += `${strikerStatus.player_id.name} scored ${ballOutcome.runs} run(s).`;
                    break;
                case 'four':
                    description += `${strikerStatus.player_id.name} hit a four!`;
                    break;
                case 'six':
                    description += `${strikerStatus.player_id.name} hit a six!`;
                    break;
                case 'wide':
                    description += `Wide ball bowled by ${bowlerStatus.player_id.name}.`;
                    break;
                case 'noball':
                    description += `No ball bowled by ${bowlerStatus.player_id.name}.`;
                    break;
                case 'wicket':
                    description += `${strikerStatus.player_id.name} is out (${dismissal_type}) bowled by ${bowlerStatus.player_id.name}.`;
                    break;
                case 'custom':
                    description += ballOutcome.customDescription || 'Custom outcome occurred.';
                    break;
                default:
                    description += `Ball outcome: ${outcome}.`;
            }
        }
        // Add commentary to innings
        innings.commentary.push({
            over: Math.floor(innings.score.balls / 6) + 1,
            ball: innings.score.balls % 6 || 6,
            description,
            timestamp: new Date(),
        });

        // Update balls and overs if ball counts
        if (ballOutcome.ball_counts) {
            innings.score.balls += 1;
            innings.score.overs = Math.floor(innings.score.balls / 6) + ((innings.score.balls % 6) / 10);
        }

        // Prepare bulk operations for Status updates
        let bulkOps = [];

        // Update bowler's stats
        const bowlerId = bowler_id || innings.current_bowler;

        const bowlerStatus = await Status.findOne({
            player_id: bowlerId,
            match_id: matchId,
            innings_number: innings.innings_number,
        }).session(session).exec();

        if (!bowlerStatus) {
            // Create a new bowler status if not exists
            const newBowlerStatus = await Status.create([{
                player_id: bowlerId,
                match_id: matchId,
                innings_number: innings.innings_number,
                bowling: {
                    runs_conceded: ballOutcome.runs + (ballOutcome.extras || 0),
                    overs_bowled: ballOutcome.ball_counts ? 1 / 6 : 0,
                    wickets: ballOutcome.is_wicket ? 1 : 0,
                    wides: outcome === 'wide' ? 1 : 0,
                    no_balls: outcome === 'noball' ? 1 : 0,
                    extras_conceded: ballOutcome.extras || 0,
                }
            }], { session });
            innings.current_bowler = newBowlerStatus[0].player_id;

        } else {
            // Prepare updates for existing bowler status
            const bowlerUpdates = {
                'bowling.runs_conceded': ballOutcome.runs + (ballOutcome.extras || 0),
                'bowling.overs_bowled': ballOutcome.ball_counts ? 1 / 6 : 0,
                'bowling.wickets': ballOutcome.is_wicket ? 1 : 0,
                'bowling.wides': outcome === 'wide' ? 1 : 0,
                'bowling.no_balls': outcome === 'noball' ? 1 : 0,
                'bowling.extras_conceded': ballOutcome.extras || 0,
            };

            if (ballOutcome.maidens) {
                bowlerUpdates['bowling.maidens'] = 1;
            }

            bulkOps.push({
                updateOne: {
                    filter: { _id: bowlerStatus._id },
                    update: { $inc: bowlerUpdates },
                },
            });
        }

        const batsmenStatuses = await Status.find({
            player_id: { $in: innings.current_batsmen },
            match_id: matchId,
            innings_number: innings.innings_number,
        }).session(session);

        // Check if the striker and non-striker statuses exist
        const strikerStatus = batsmenStatuses.find(
            (batsman) => batsman.batting.stricking_role === 1
        );

        const nonStrikerStatus = batsmenStatuses.find(
            (batsman) => batsman.batting.stricking_role === 2
        );

        // Handle case where striker or non-striker is not found
        if (!strikerStatus || !nonStrikerStatus) {
            const missingPlayers = [];

            if (!strikerStatus) missingPlayers.push("Striker");
            if (!nonStrikerStatus) missingPlayers.push("Non-striker");

            httpError(next, new Error(`${missingPlayers.join(" and ")} not found`), req, 400);
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Update striker's stats
        const strikerUpdates = {
            'batting.runs': ballOutcome.runs,
            'batting.balls_faced': ballOutcome.ball_counts ? 1 : 0,
        };

        if (ballOutcome.runs === 4) {
            strikerUpdates['batting.fours'] = 1;
        }
        if (ballOutcome.runs === 6) {
            strikerUpdates['batting.sixes'] = 1;
        }

        // Update the striker status
        bulkOps.push({
            updateOne: {
                filter: { _id: strikerStatus._id },
                update: { $inc: strikerUpdates },
            },
        });
        let fielderStatus;
        let nextBatsmanStatus;

        // Handle wicket
        if (ballOutcome.is_wicket) {
            innings.score.wickets += 1;

            // Update striker's out details
            bulkOps.push({
                updateOne: {
                    filter: { _id: strikerStatus._id },
                    update: {
                        $set: {
                            'batting.out_type': dismissal_type || 'Out',
                            'batting.bowler_when_out': bowler_id || null,
                            'batting.stricking_role': 0, // Indicate out
                        },
                    },
                },
            });

            // Update fielder's stats if applicable
            if (fielder_id && dismissal_type) {
                // Validate dismissal_type
                const validTypes = ['caught', 'stumped'];
                if (!validTypes.includes(dismissal_type)) {
                    httpError(next, new Error(`Invalid dismissal_type: ${dismissal_type}`), req, 400);
                    await session.abortTransaction();
                    session.endSession();
                    return;
                }

                // Check if fielderStatus exists
                fielderStatus = await Status.findOne({
                    player_id: fielder_id,
                    match_id: matchId,
                    innings_number: innings.innings_number,
                }).session(session).exec();

                if (!fielderStatus) {
                    // Create a new status for the fielder
                    const newFielderStatus = new Status({
                        player_id: fielder_id,
                        match_id: matchId,
                        innings_number: innings.innings_number,
                        fielding: {
                            catches: dismissal_type === 'caught' ? 1 : 0,
                            stumpings: dismissal_type === 'stumped' ? 1 : 0,
                        },
                    });
                    await newFielderStatus.save({ session });
                } else {
                    // Prepare updates for existing fielderStatus
                    const fielderUpdates = {};
                    if (dismissal_type === 'caught') {
                        fielderUpdates['fielding.catches'] = 1;
                    } else if (dismissal_type === 'stumped') {
                        fielderUpdates['fielding.stumpings'] = 1;
                    }

                    if (Object.keys(fielderUpdates).length > 0) {
                        bulkOps = bulkOps || [];
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: fielderStatus._id },
                                update: { $inc: fielderUpdates },
                            },
                        });
                    }
                }
            }

            // Remove striker from current_batsmen
            innings.current_batsmen = innings.current_batsmen.filter(
                (batsman) => batsman !== strikerStatus.player_id.toString()
            );

            const a = innings.current_batsmen.filter(
                (batsman) => batsman !== strikerStatus.player_id.toString()
            );

            // Add next batsman
            if (next_batsman_id) {
                // Find or create the next batsman's Status document
                nextBatsmanStatus = await Status.findOne({
                    player_id: next_batsman_id,
                    match_id: matchId,
                    innings_number: innings.innings_number,
                }).session(session).exec();

                if (!nextBatsmanStatus) {
                    // Create a new Status document for the next batsman
                    nextBatsmanStatus = await Status.create([{
                        player_id: next_batsman_id,
                        match_id: matchId,
                        innings_number: innings.innings_number,
                        batting: {
                            stricking_role: next_batsman_strike_role || strikerStatus.batting.stricking_role,
                        },
                        fielding: {
                            catches: 0,
                            stumpings: 0,
                        },
                    }], { session });
                }

                // Add the next batsman to current_batsmen
                innings.current_batsmen.push(next_batsman_id);
                innings.batting_order.push(strikerStatus.player_id);

                // Adjust the existing non-striker's role if needed
                if (nonStrikerStatus) {
                    const desiredRole = next_batsman_strike_role || strikerStatus.batting.stricking_role === 1 ? 2 : 1;
                    if (nonStrikerStatus.batting.stricking_role !== desiredRole) {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: nonStrikerStatus._id },
                                update: { 'batting.stricking_role': desiredRole },
                            },
                        });
                    }
                }
            } else {
                httpError(next, new Error('Next batsman ID must be provided when a wicket falls'), req, 400);
                await session.abortTransaction();
                session.endSession();
                return;
            }
        } else {
            // Handle strike rotation based on runs
            if (ballOutcome.ball_counts && ballOutcome.runs % 2 !== 0) {
                // Swap roles if odd runs (strike change)
                const temp = strikerStatus.batting.stricking_role;
                strikerStatus.batting.stricking_role = nonStrikerStatus.batting.stricking_role;
                nonStrikerStatus.batting.stricking_role = temp;

                bulkOps.push({
                    updateOne: {
                        filter: { _id: strikerStatus._id },
                        update: { 'batting.stricking_role': strikerStatus.batting.stricking_role },
                    },
                });

                bulkOps.push({
                    updateOne: {
                        filter: { _id: nonStrikerStatus._id },
                        update: { 'batting.stricking_role': nonStrikerStatus.batting.stricking_role },
                    },
                });
            }

            // Handle strike rotation at the end of the over
            if (ballOutcome.ball_counts && innings.score.balls % 6 === 0) {
                const temp = strikerStatus.batting.stricking_role;
                strikerStatus.batting.stricking_role = nonStrikerStatus.batting.stricking_role;
                nonStrikerStatus.batting.stricking_role = temp;
                bulkOps.push({
                    updateOne: {
                        filter: { _id: strikerStatus._id },
                        update: { 'batting.stricking_role': strikerStatus.batting.stricking_role },
                    },
                });

                bulkOps.push({
                    updateOne: {
                        filter: { _id: nonStrikerStatus._id },
                        update: { 'batting.stricking_role': nonStrikerStatus.batting.stricking_role },
                    },
                });
            }

        }

        // Check for match completion conditions
        if (ballOutcome.ball_counts) {
            const totalBalls = innings.score.balls;
            const maxBalls = match.overs * 6;

            // If overs are completed
            if (totalBalls >= maxBalls) {
                innings.status = 'completed';
                innings.endTime = new Date();

                if (innings.innings_number === 1) {
                    match.target_runs = innings.score.runs + 1;
                    await match.save({ session });

                    innings.commentary.push({
                        over: Math.floor(totalBalls / 6) + 1,
                        ball: totalBalls % 6 || 6,
                        description: `Innings 1 completed. Target for Innings 2 is ${match.target_runs} runs.`,
                        timestamp: new Date(),
                    });
                } else if (innings.innings_number === 2) {
                    if (innings.score.runs > match.target_runs) {
                        match.winner = match.batting_team_id;
                    } else if (innings.score.runs < match.target_runs) {
                        match.winner = match.bowling_team_id;
                    } else {
                        match.winner = 'Tie';
                    }

                    match.status = 'completed';
                    match.endTime = new Date();

                    await match.save({ session });

                    if (match.winner === 'Tie') {
                        innings.commentary.push({
                            over: Math.floor(totalBalls / 6) + 1,
                            ball: totalBalls % 6 || 6,
                            description: `The match is tied! Both teams have scored ${innings.score.runs} runs.`,
                            timestamp: new Date(),
                        });
                    } else {
                        innings.commentary.push({
                            over: Math.floor(totalBalls / 6) + 1,
                            ball: totalBalls % 6 || 6,
                            description: `${match.winner} wins the match!`,
                            timestamp: new Date(),
                        });
                    }
                }
            }

            // If all wickets have fallen
            if (innings.score.wickets >= 10) {
                innings.status = 'completed';
                innings.endTime = new Date();

                if (innings.innings_number === 1) {
                    match.target_runs = innings.score.runs + 1;
                    await match.save({ session });

                    innings.commentary.push({
                        over: Math.floor(totalBalls / 6) + 1,
                        ball: totalBalls % 6 || 6,
                        description: `Innings 1 completed. Target for Innings 2 is ${match.target_runs} runs.`,
                        timestamp: new Date(),
                    });
                } else if (innings.innings_number === 2) {
                    if (innings.score.runs > match.target_runs) {
                        match.winner = match.batting_team_id;
                    } else if (innings.score.runs < match.target_runs) {
                        match.winner = match.bowling_team_id;
                    } else {
                        match.winner = 'Tie';
                    }

                    match.status = 'completed';
                    match.endTime = new Date();

                    await match.save({ session });

                    if (match.winner === 'Tie') {
                        innings.commentary.push({
                            over: Math.floor(totalBalls / 6) + 1,
                            ball: totalBalls % 6 || 6,
                            description: `The match is tied! Both teams have scored ${innings.score.runs} runs.`,
                            timestamp: new Date(),
                        });
                    } else {
                        innings.commentary.push({
                            over: Math.floor(totalBalls / 6) + 1,
                            ball: totalBalls % 6 || 6,
                            description: `${match.winner} wins the match!`,
                            timestamp: new Date(),
                        });
                    }
                }
            }

            // If target is achieved before overs or wickets are up
            if (innings.innings_number === 2 && match.target_runs) {
                if (innings.score.runs >= match.target_runs) {
                    innings.status = 'completed';
                    match.winner = match.batting_team_id;

                    innings.endTime = new Date();
                    match.status = 'completed';
                    match.endTime = new Date();

                    await match.save({ session });

                    innings.commentary.push({
                        over: Math.floor(totalBalls / 6) + 1,
                        ball: totalBalls % 6 || 6,
                        description: `${match.batting_team_id} has reached the target and wins the match!`,
                        timestamp: new Date(),
                    });
                }
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

        // Get the current striker and non-striker statuses
        const currentStrikerStatus = batsmenStatuses.find(
            (batsman) => batsman.batting.stricking_role === 1
        );

        const currentNonStrikerStatus = batsmenStatuses.find(
            (batsman) => batsman.batting.stricking_role === 2
        );

        // Get the next batsman's status if available
        let upcomingBatsmanStatus;
        if (next_batsman_id) {
            upcomingBatsmanStatus = await Status.findOne({
                player_id: next_batsman_id,
                match_id: matchId,
                innings_number: innings.innings_number,
            }).session(session);
        }

        // Get the bowler status
        const currentBowlerStatus = await Status.findOne({
            player_id: bowler_id,
            match_id: matchId,
            innings_number: innings.innings_number,
        }).session(session);

        // Get the fielder's status if available
        let currentFielderStatus;
        if (fielder_id) {
            currentFielderStatus = await Status.findOne({
                player_id: fielder_id,
                match_id: matchId,
                innings_number: innings.innings_number,
            }).session(session);
        }

        // Get the players who are out and their statuses
        const playersOut = innings.batting_order;
        let playersOutStatus = [];
        for (let i = 0; i < playersOut.length; i++) {
            const playerStatus = await Status.findOne({
                player_id: playersOut[i],
                match_id: matchId,
                innings_number: innings.innings_number,
            }).session(session);
            playersOutStatus.push(playerStatus);
        }

        // Emit the socket event with all player statuses
        const io = req.app.get('io');
        if (io) {
            io.emit('innings-updated', {
                matchId: innings.match_id,
                inningsId,
                innings,
                currentStrikerStatus,
                currentNonStrikerStatus,
                upcomingBatsmanStatus,
                currentBowlerStatus,
                currentFielderStatus,
                playersOutStatus
            });
        }

        // Respond with the updated innings
        httpResponse(req, res, 200, responseMessage.UPDATED('Innings'), {
            innings,
            currentStrikerStatus,
            currentNonStrikerStatus,
            upcomingBatsmanStatus,
            currentBowlerStatus,
            currentFielderStatus,
            playersOutStatus
        });

    } catch (error) {
        await session.abortTransaction();
        httpError(next, error, req, 500);
    } finally {
        session.endSession();
    }
};
