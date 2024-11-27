import { Innings, Match, Tournament } from '../../../db/model/index.js';

import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";
import responseMessage from "../../../constant/responseMessage.js";
import ballOutcomes from '../../../constant/ballOutcomes.js';

export const createMatch = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const { startTime, location, team_Aid, team_Bid, team_Aname, team_Bname } = req.body;

        // Check if the tournament exists before creating the match
        const tournament = await Tournament.findById(tournamentId).exec();
        if (!tournament) {
            httpError(next, new Error('Tournament not found'), req, 400);
            return;
        }

        const match = await Match.create({
            tournament_id: tournamentId,
            startTime,
            location,
            team_Aid,
            team_Bid,
            team_Aname,
            team_Bname
        });

        tournament.matches.push(match._id);
        await tournament.save();
        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const getMatches = async (req, res, next) => {
    try {
        const { tournamentId } = req.params;
        const { page = 1, rows = 10 } = req.query; // Use req.query
        const skip = (parseInt(page) - 1) * parseInt(rows);
        const matches = await Match.find({ tournament_id: tournamentId })
            .skip(skip)
            .limit(parseInt(rows))
            .lean()
            .exec();

        if (!matches || matches.length === 0) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Matches'));
            return;
        }
        httpResponse(req, res, 200, responseMessage.FETCHED('Matches'), matches);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const getMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findById(matchId)
            .populate('team_Aid team_Bid')
            .lean()
            .exec();

        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }
        httpResponse(req, res, 200, responseMessage.FETCHED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const updateMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const updatedDetails = req.body;
        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }
        match.set(updatedDetails);
        await match.save();
        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const deleteMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findByIdAndDelete(matchId).exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }
        httpResponse(req, res, 200, responseMessage.DELETED('Match'));
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const updateMatchStatus = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { started, finished } = req.body;

        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }

        if (typeof started !== 'undefined') {
            match.isActive = started;
        }

        if (typeof finished !== 'undefined') {
            match.isFinished = finished;
        }

        await match.save();

        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

export const updateTossStatus = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { toss_winner, elected_to } = req.body;
        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }
        match.toss_winner = toss_winner;
        match.elected_to = elected_to;
        await match.save();
        httpResponse(req, res, 200, responseMessage.UPDATED('Match'), match);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const startInnings = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const {
            innings_number,
            batting_team_id,
            bowling_team_id,
            batting_order,
            wicket_keeper_id,
        } = req.body;

        if (!batting_order || batting_order.length < 2) {
            httpError(next, new Error('Batting order must include at least two players'), req, 400);
            return;
        }

        if (!wicket_keeper_id) {
            httpError(next, new Error('Wicket-keeper ID must be provided'), req, 400);
            return;
        }

        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }

        // Create Status documents for initial batsmen
        const batsman1Status = await Status.create({
            player_id: batting_order[0],
            match_id: matchId,
            innings_number: innings_number,
            stricking_role: 1, // 1 for striker
        });

        const batsman2Status = await Status.create({
            player_id: batting_order[1],
            match_id: matcmatchIdh_id,
            innings_number: innings_number,
            stricking_role: 2, // 2 for non-striker
        });

        // Create Status document for wicket-keeper
        const wicketKeeperStatus = await Status.create({
            player_id: wicket_keeper_id,
            match_id: matchId,
            innings_number: innings_number,
            // Additional fields if needed
        });

        const innings = await Innings.create({
            matchId,
            innings_number,
            batting_team_id,
            bowling_team_id,
            batting_order,
            current_batsmen: [batsman1Status._id, batsman2Status._id],
            wicket_keeper: wicketKeeperStatus._id,
            score: {},
        });

        match.innings.push(innings._id);
        await match.save();

        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Innings'), innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

export const getMatchInnings = async (req, res, next) => {
    try {
        const { matchId } = req.params;

        const match = await Match.findById(matchId).populate('innings').lean().exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }
        httpResponse(req, res, 200, responseMessage.FETCHED('Innings'), match.innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

export const updateInnings = async (req, res, next) => {
    try {
        const { inningsId } = req.params;
        const { outcome, bowler_id, fielder_id, dismissal_type, next_batsman_id } = req.body;

        const innings = await Innings.findById(inningsId)
            .populate({
                path: 'current_batsmen',
                populate: { path: 'player_id' },
            })
            .populate('current_bowler')
            .populate('wicket_keeper')
            .exec();

        if (!innings) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Innings'));
            return;
        }

        const ballOutcome = ballOutcomes[outcome];
        if (!ballOutcome) {
            httpError(next, new Error('Invalid outcome'), req, 400);
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

        // Update runs
        innings.score.runs += ballOutcome.runs + (ballOutcome.extras || 0);

        // Update balls and overs if ball counts
        if (ballOutcome.ball_counts) {
            innings.score.balls += 1;
            innings.score.overs = Math.floor(innings.score.balls / 6) + ((innings.score.balls % 6) / 10);
        }

        // Update current bowler
        if (bowler_id && (!innings.current_bowler || innings.current_bowler.player_id.toString() !== bowler_id)) {
            // Find or create the bowler's Status document
            let bowlerStatus = await Status.findOne({
                player_id: bowler_id,
                match_id: innings.match_id,
                innings_number: innings.innings_number,
            }).exec();

            if (!bowlerStatus) {
                bowlerStatus = await Status.create({
                    player_id: bowler_id,
                    match_id: innings.match_id,
                    innings_number: innings.innings_number,
                });
            }

            innings.current_bowler = bowlerStatus._id;
        }

        // Get the bowler's Status document
        const bowlerStatus = await Status.findById(innings.current_bowler).exec();

        if (!bowlerStatus) {
            httpError(next, new Error('Bowler not found'), req, 400);
            return;
        }

        // Update bowler's stats
        bowlerStatus.bowlruns += ballOutcome.runs + (ballOutcome.extras || 0);
        bowlerStatus.bowled_overs += ballOutcome.ball_counts ? (1 / 6) : 0;
        if (ballOutcome.is_wicket) {
            bowlerStatus.wicket += 1;
        }

        // Update bowler's extras if applicable
        if (outcome === 'wide') {
            bowlerStatus.wideball = (bowlerStatus.wideball || 0) + 1;
        } else if (outcome === 'noball') {
            bowlerStatus.noball = (bowlerStatus.noball || 0) + 1;
        }

        await bowlerStatus.save();

        // Get striker's Status document
        const strikerStatus = innings.current_batsmen.find((batsman) => batsman.stricking_role === 1);
        if (!strikerStatus) {
            httpError(next, new Error('No striker found'), req, 400);
            return;
        }

        // Update striker's stats
        strikerStatus.bat_run += ballOutcome.runs;
        strikerStatus.played_ball += ballOutcome.ball_counts ? 1 : 0;
        strikerStatus.hitted_fours += ballOutcome.runs === 4 ? 1 : 0;
        strikerStatus.hitted_sixes += ballOutcome.runs === 6 ? 1 : 0;

        // Handle wicket
        if (ballOutcome.is_wicket) {
            innings.score.wickets += 1;
            strikerStatus.out_type = dismissal_type || ballOutcome.dismissal_info || 'Out';
            strikerStatus.bowler_when_out = bowlerStatus.player_id;

            // Update striker's stricking_role to indicate he is out
            strikerStatus.stricking_role = 0;

            // Save striker's Status
            await strikerStatus.save();

            // Update fielding stats
            if (fielder_id) {
                let fielderStatus = await Status.findOneAndUpdate(
                    {
                        player_id: fielder_id,
                        match_id: innings.match_id,
                        innings_number: innings.innings_number,
                    },
                    {},
                    { upsert: true, new: true }
                );

                if (dismissal_type === 'caught') {
                    fielderStatus.catches = (fielderStatus.catches || 0) + 1;
                } else if (dismissal_type === 'stumped') {
                    fielderStatus.stumpings = (fielderStatus.stumpings || 0) + 1;
                }

                await fielderStatus.save();
            }

            // Remove the striker from current_batsmen
            innings.current_batsmen = innings.current_batsmen.filter((batsman) => batsman.stricking_role !== 0);

            // Bring in next batsman from frontend
            if (next_batsman_id) {
                const nextBatsmanStatus = await Status.create({
                    player_id: next_batsman_id,
                    match_id: innings.match_id,
                    innings_number: innings.innings_number,
                    stricking_role: 1, // New batsman is on strike
                });

                innings.current_batsmen.push(nextBatsmanStatus._id);
            } else {
                // No next batsman provided; handle end of innings if needed
                httpError(next, new Error('Next batsman ID must be provided when a wicket falls'), req, 400);
                return;
            }
        } else {
            // Save striker's Status
            await strikerStatus.save();
        }

        // Handle strike rotation
        if (ballOutcome.ball_counts) {
            if (ballOutcome.runs % 2 !== 0) {
                // Swap the strike
                innings.current_batsmen.forEach((batsman) => {
                    batsman.stricking_role = batsman.stricking_role === 1 ? 2 : 1;
                });
            }
            // Swap strike at the end of the over
            if (innings.score.balls % 6 === 0) {
                innings.current_batsmen.forEach((batsman) => {
                    batsman.stricking_role = batsman.stricking_role === 1 ? 2 : 1;
                });
            }
        }

        // Update extras
        if (ballOutcome.extras) {
            const extras = innings.score.extras;
            extras.total = (extras.total || 0) + ballOutcome.extras;

            switch (outcome) {
                case 'wide':
                    extras.wides = (extras.wides || 0) + ballOutcome.extras;
                    break;
                case 'noball':
                    extras.noBalls = (extras.noBalls || 0) + ballOutcome.extras;
                    break;
                case 'bye':
                    extras.byes = (extras.byes || 0) + ballOutcome.extras;
                    break;
                case 'leg_bye':
                    extras.legByes = (extras.legByes || 0) + ballOutcome.extras;
                    break;
                // Add other cases if needed
            }
        }

        await innings.save();

        httpResponse(req, res, 200, responseMessage.UPDATED('Innings'), innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
};