import mongoose from 'mongoose';

const StatsSchema = new mongoose.Schema(
    {
        highest_runs: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CricketPlayer',
            },
            score: { type: Number, default: 0, min: 0 },
        },
        highest_wickets: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CricketPlayer',
            },
            wickets: { type: Number, default: 0, min: 0 },
        },
        highest_individual_score: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CricketPlayer',
            },
            runs: { type: Number, default: 0, min: 0 },
        },
        best_bowling_figures: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CricketPlayer',
            },
            wickets: { type: Number, default: 0, min: 0 },
            runs_conceded: { type: Number, default: 0, min: 0 },
        },
        most_catches: {
            player: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CricketPlayer',
            },
            catches: { type: Number, default: 0, min: 0 },
        },
    },
    { _id: false }
);

const PointTableSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketTeam',
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

const CricketTournamentSchema = new mongoose.Schema({
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
    location: {
        type: String,
        required: true
    },
    point_table: {
        type: [PointTableSchema],
        default: []
    },
    teams: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CricketTeam',
        },
    ],
    matches: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CricketMatch',
        },
    ],
},
    { timestamps: true }
);

// Indexes
CricketTournamentSchema.index({ name: 1 });

const CricketTournament = mongoose.model('CricketTournament', CricketTournamentSchema);

export default CricketTournament;
