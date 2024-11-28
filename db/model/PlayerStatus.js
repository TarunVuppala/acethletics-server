// Status.js
import mongoose from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';

const StatusSchema = new mongoose.Schema(
  {
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CricketPlayer',
      required: true,
      immutable: true,
      index: true,
    },
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
      immutable: true,
      index: true,
    },
    // Batting stats
    bat_run: { type: Number, default: 0, min: 0 },
    played_ball: { type: Number, default: 0, min: 0 },
    hitted_fours: { type: Number, default: 0, min: 0 },
    hitted_sixes: { type: Number, default: 0, min: 0 },
    out_type: { type: String, trim: true },
    stricking_role: { type: Number }, // 1 for striker, 2 for non-striker, 0 for out

    // Bowling stats
    bowlruns: { type: Number, default: 0, min: 0 },
    bowled_overs: { type: Number, default: 0, min: 0 },
    maiden_overs: { type: Number, default: 0, min: 0 },
    wicket: { type: Number, default: 0, min: 0 },
    extra_wicket: { type: Number, default: 0, min: 0 },
    noball: { type: Number, default: 0, min: 0 },
    wideball: { type: Number, default: 0, min: 0 },

    // Fielding stats
    catches: { type: Number, default: 0, min: 0 },
    stumpings: { type: Number, default: 0, min: 0 },

    // Dismissal info
    bowler_when_out: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CricketPlayer',
    },
    wicket_taker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CricketPlayer',
    },

    // Extras
    extra: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Indexes
StatusSchema.index(
  { match_id: 1, innings_number: 1, player_id: 1 },
  { unique: true }
);

// Autopopulate plugin
StatusSchema.plugin(mongooseAutopopulate);

const Status = mongoose.model('Status', StatusSchema);

export default Status;
