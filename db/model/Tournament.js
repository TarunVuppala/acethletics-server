import mongoose from 'mongoose';

const StatsSchema = new mongoose.Schema(
    {
        highest_runs: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
            },
            score: { type: Number, default: 0, min: 0 },
        },
        highest_wickets: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
            },
            wickets: { type: Number, default: 0, min: 0 },
        },
        highest_individual_score: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
            },
            runs: { type: Number, default: 0, min: 0 },
        },
        best_bowling_figures: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
            },
            wickets: { type: Number, default: 0, min: 0 },
            runs_conceded: { type: Number, default: 0, min: 0 },
        },
        most_catches: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
            },
            catches: { type: Number, default: 0, min: 0 },
        },
    },
    { _id: false }
);

const PointTableSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    points: { type: Number, default: 0, min: 0 },
    matches_played: { type: Number, default: 0, min: 0 },
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    ties: { type: Number, default: 0, min: 0 },
    net_run_rate: { type: Number, default: 0, min: 0 },
},
    { _id: false }
);

const TournamentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            immutable: true,
            index: true,
        },
        startDate: {
            type: Date,
            required: true,
            immutable: true
        },
        endDate: {
            type: Date,
            required: true
        },
        stats: {
            type: StatsSchema,
            default: {}
        },
        point_table: {
            type: [PointTableSchema],
            default: []
        },
        teams: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Team',
            },
        ],
        matches: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Match',
            },
        ],
    },
    { timestamps: true }
);

// Indexes
TournamentSchema.index({ name: 1 });

const Tournament = mongoose.model('Tournament', TournamentSchema);

export default Tournament;
