const mongoose = require('mongoose');

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
        score_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Score',
            required: true,
        },
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
        startTime:{
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

// autopopulate plugin
MatchSchema.plugin(require('mongoose-autopopulate'));

const Match = mongoose.model('Match', MatchSchema);

module.exports = Match;
