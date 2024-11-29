import mongoose from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';

/**
 * Enumerations for various fields to ensure data consistency.
 */
const STRIKING_ROLE_ENUM = [0, 1, 2]; // 0: Out, 1: Striker, 2: Non-striker
const OUT_TYPE_ENUM = [
  'caught',
  'bowled',
  'run_out',
  'stumped',
  'lbw',
  'hit_wicket',
  'other',
];
const DISMISSAL_TYPE_ENUM = [
  'caught',
  'bowled',
  'run_out',
  'stumped',
  'lbw',
  'hit_wicket',
  'other',
];

/**
 * Status Schema:
 * Tracks the status and statistics of a player during a match innings.
 */
const StatusSchema = new mongoose.Schema(
  {
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CricketPlayer', // Reference to 'CricketPlayer' model
      required: true,
      immutable: true,
      index: true,
      autopopulate: { maxDepth: 1 },
    },
    match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      immutable: true,
      index: true,
      autopopulate: { maxDepth: 1 },
    },
    innings_number: {
      type: Number,
      required: true,
      immutable: true,
      enum: [1, 2], // Typically, a match has up to 2 innings
      index: true,
    },
    /**
     * Batting Statistics
     */
    batting: {
      runs: { type: Number, default: 0, min: 0 },
      balls_faced: { type: Number, default: 0, min: 0 },
      fours: { type: Number, default: 0, min: 0 },
      sixes: { type: Number, default: 0, min: 0 },
      strike_rate: { type: Number, default: 0, min: 0 },
      out_type: {
        type: String,
        enum: OUT_TYPE_ENUM,
        trim: true,
        default: null,
      },
      striking_role: {
        type: Number,
        enum: STRIKING_ROLE_ENUM,
        default: null, // 0: Out, 1: Striker, 2: Non-striker
        index: true,
      },
    },
    /**
     * Bowling Statistics
     */
    bowling: {
      runs_conceded: { type: Number, default: 0, min: 0 },
      overs_bowled: { type: Number, default: 0, min: 0 },
      maidens: { type: Number, default: 0, min: 0 },
      wickets: { type: Number, default: 0, min: 0 },
      extras_conceded: { type: Number, default: 0, min: 0 },
      no_balls: { type: Number, default: 0, min: 0 },
      wides: { type: Number, default: 0, min: 0 },
      economy_rate: { type: Number, default: 0, min: 0 },
    },
    /**
     * Fielding Statistics
     */
    fielding: {
      catches: { type: Number, default: 0, min: 0 },
      stumpings: { type: Number, default: 0, min: 0 },
    },
    /**
     * Dismissal Information
     */
    dismissal: {
      bowler_when_out: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer', // Reference to 'CricketPlayer' model
        default: null,
      },
      wicket_taker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer', // Reference to 'CricketPlayer' model
        default: null,
      },
      dismissal_type: {
        type: String,
        enum: DISMISSAL_TYPE_ENUM,
        trim: true,
        default: null,
      },
    },
    /**
     * Extras
     */
    extra_runs: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/**
 * Compound Unique Index:
 * Ensures that each player has only one status per match innings.
 */
StatusSchema.index(
  { match_id: 1, innings_number: 1, player_id: 1 },
  { unique: true }
);

/**
 * Plugins:
 * - mongoose-autopopulate: Automatically populates referenced fields.
 */
StatusSchema.plugin(mongooseAutopopulate);

/**
 * Middleware to Calculate Strike Rate and Economy Rate
 */
StatusSchema.pre('save', function (next) {
  // Calculate Strike Rate
  if (this.batting.balls_faced > 0) {
    this.batting.strike_rate = (this.batting.runs / this.batting.balls_faced) * 100;
  } else {
    this.batting.strike_rate = 0;
  }

  // Calculate Economy Rate
  if (this.bowling.overs_bowled > 0) {
    this.bowling.economy_rate = this.bowling.runs_conceded / this.bowling.overs_bowled;
  } else {
    this.bowling.economy_rate = 0;
  }

  next();
});

/**
 * Model Creation
 */
const Status = mongoose.models.Status || mongoose.model('Status', StatusSchema);

export default Status;
