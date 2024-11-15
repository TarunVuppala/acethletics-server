const mongoose = require('mongoose');

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
        match_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match',
            required: true,
            immutable: true,
            index: true,
        },
        innings_number: {
            type: Number,
            required: true,
            immutable: true
        },
        batting_team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
            immutable: true,
        },
        bowling_team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
            immutable: true,
        },
        runs: { type: Number, default: 0, min: 0 },
        wickets: { type: Number, default: 0, min: 0 },
        overs: { type: Number, default: 0, min: 0 },
        extras: { type: ExtrasSchema, default: {} },
        isDeclared: { type: Boolean, default: false },
        isFollowOn: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Indexes
ScoreSchema.index({ match_id: 1, innings_number: 1 }, { unique: true });

// autopopulate plugin
ScoreSchema.plugin(require('mongoose-autopopulate'));

const Score = mongoose.model('Score', ScoreSchema);

module.exports = Score;
