// Match.js
import mongoose from 'mongoose';

const ExtrasSchema = new mongoose.Schema(
  {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty_runs: { type: Number, default: 0 },
    total: { type: Number, default: 0 }, // Added total field
  },
  { _id: false }
);

const ScoreSchema = new mongoose.Schema(
  {
    runs: { type: Number, default: 0, min: 0 },
    wickets: { type: Number, default: 0, min: 0 },
    overs: { type: Number, default: 0, min: 0 },
    balls: { type: Number, default: 0, min: 0 }, // Added balls field
    extras: { type: ExtrasSchema, default: {} },
    isDeclared: { type: Boolean, default: false },
    isFollowOn: { type: Boolean, default: false },
  },
  { _id: false }
);

// Innings.js
const InningsSchema = new mongoose.Schema(
  {
    match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    innings_number: {
      type: Number,
      required: true,
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
    batting_order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true,
      },
    ],
    current_batsmen: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
        autopopulate: true,
      },
    ],
    current_bowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
      autopopulate: true,
    },
    wicket_keeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
      autopopulate: true,
    },
    score: { type: ScoreSchema, required: true, default: {} },
  },
  { timestamps: true }
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
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
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
      default: false,
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
    innings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Innings',
        validate: {
          validator: function (value) {
            return value.length <= 2;
          },
          message: 'A match can have at most 2 innings.',
        },
      },
    ],
    man_of_the_match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
  },
  { timestamps: true }
);

// Indexes
MatchSchema.index({ tournament_id: 1, isActive: 1 });

// Autopopulate plugin
InningsSchema.plugin(require('mongoose-autopopulate'));

const Innings = mongoose.model('Innings', InningsSchema);
const Match = mongoose.model('Match', MatchSchema);

export { Innings, Match };
