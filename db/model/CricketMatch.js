import mongoose from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';

const CricketMatchSchema = new mongoose.Schema({
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTournament',
        required: true,
        index: true,
        autopopulate: { maxDepth: 1 },
    },
    startTime: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    team_Aid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTeam',
        required: true,
    },
    team_Bid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTeam',
        required: true,
    },
    overs: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
    },
    innings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Innings',
        autopopulate: { maxDepth: 1 },
    }],
    status: {
        type: String,
        enum: ['upcoming', 'in_progress', 'completed', 'cancelled', 'abandoned'],
        default: 'upcoming',
    },
    toss: {
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CricketTeam',
            default: null,
        },
        deferring: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CricketTeam',
            default: null,
        },
        elected_to: {
            type: String,
            enum: ['bat', 'bowl'],
            default: null,
        },
    },
    target_runs: {
        type: Number,
        default: null,
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTeam',
        default: null,
    },
    endTime: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

const InningsSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketMatch',
        required: true,
        index: true,
    },
    innings_number: {
        type: Number,
        required: true,
        enum: [1, 2],
    },
    batting_team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTeam',
        required: true,
    },
    bowling_team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTeam',
        required: true,
    },
    batting_order: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'CricketPlayer',
        required: true,
    },
    current_batsmen: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer',
        required: true,
    }],
    wicket_keeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer',
        required: true,
    },
    current_bowler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer',
        required: true,
    },
    score: {
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        overs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 },
        extras: {
            wides: { type: Number, default: 0 },
            noBalls: { type: Number, default: 0 },
            byes: { type: Number, default: 0 },
            legByes: { type: Number, default: 0 },
            penalty_runs: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        isDeclared: { type: Boolean, default: false },
        isFollowOn: { type: Boolean, default: false },
    },
    commentary: [{
        over: { type: Number, required: true },
        ball: { type: Number, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    }],
    status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing',
    },
    endTime: { type: Date, default: null },
}, { timestamps: true });

InningsSchema.pre('save', function (next) {
    if (this.commentary.length > 20) {
        this.commentary = this.commentary.slice(this.commentary.length - 20);
    }
    next();
});

InningsSchema.plugin(mongooseAutopopulate);
CricketMatchSchema.plugin(mongooseAutopopulate);

const Innings = mongoose.model('Innings', InningsSchema);
const CricketMatch = mongoose.model('CricketMatch', CricketMatchSchema);
export { CricketMatch, Innings };
