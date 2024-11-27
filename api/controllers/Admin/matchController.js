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
        const { innings_number, batting_team_id, bowling_team_id } = req.body;
        const match = await Match.findById(matchId).exec();
        if (!match) {
            httpResponse(req, res, 200, responseMessage.NOT_FOUND('Match'));
            return;
        }
        const innings = await Innings.create({
            match_id,
            innings_number,
            batting_team_id,
            bowling_team_id,
            score: {}
        });

        match.innings.push(innings._id);
        await match.save();

        httpResponse(req, res, 201, responseMessage.RESOURCE_CREATED('Innings'), innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

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
}

export const updateInnings = async (req, res, next) => {
    try {
        const { inningsId } = req.params;
        const { outcome } = req.body;

        const innings = await Innings.findById(inningsId).exec();
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
                    total: 0
                },
            };
        }

        // Update runs
        innings.score.runs += ballOutcome.runs + (ballOutcome.extras || 0);

        // Update wickets
        if (ballOutcome.is_wicket) {
            innings.score.wickets += 1;
        }

        // Update balls and overs
        if (ballOutcome.ball_counts) {
            innings.score.balls += 1;
            innings.score.overs = Math.floor(innings.score.balls / 6) + ((innings.score.balls % 6) / 10);
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
            }
        }

        await innings.save();

        httpResponse(req, res, 200, responseMessage.UPDATED('Innings'), innings);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}
