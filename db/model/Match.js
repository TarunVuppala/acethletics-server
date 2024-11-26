import mongoose from 'mongoose';

const ExtrasSchema = new mongoose.Schema(
    {
        wides: {
            type: Number,
            default: 0
        },
        noBalls: {
            type: Number,
            default: 0
        },
        byes: {
            type: Number,
            default: 0
        },
        legByes: {
            type: Number,
            default: 0
        },
        penalty_runs: {
            type: Number,
            default: 0
        },
    },
    { _id: false }
);

const ScoreSchema = new mongoose.Schema(
    {
        runs: { type: Number, default: 0, min: 0 },
        wickets: { type: Number, default: 0, min: 0 },
        overs: { type: Number, default: 0, min: 0 },
        extras: { type: ExtrasSchema, default: {} },
        isDeclared: { type: Boolean, default: false },
        isFollowOn: { type: Boolean, default: false },
    },
    { _id: false }
);

const InningsSchema = new mongoose.Schema(
    {
        innings_number: {
            type: Number,
            required: true
        },
        batting_team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
        },
        bowling_team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
        },
        score: { type: ScoreSchema, required: true },
    },
    { _id: false }
);

const MatchSchema = new mongoose.Schema(
    {
        tournament_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            required: true,
            immutable: true,
            index: true,
        },
        startTime: {
            type: Date,
            required: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        team_Aid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
            immutable: true,
        },
        team_Bid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
            immutable: true,
        },
        team_Aname: {
            type: String,
            required: true,
            trim: true,
            immutable: true,
        },
        team_Bname: {
            type: String,
            required: true,
            trim: true,
            immutable: true,
        },
        toss_winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
        },
        elected_to: {
            type: String,
            enum: ['bat', 'bowl'],
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isFinished: {
            type: Boolean,
            default: false
        },
        innings: [InningsSchema],
        man_of_the_match: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player',
        },
    },
    { timestamps: true }
);

// Indexes
MatchSchema.index({ tournament_id: 1, isActive: 1 });

const Match = mongoose.model('Match', MatchSchema);

export default Match;
