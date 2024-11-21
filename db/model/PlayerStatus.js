import mongoose from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';

const StatusSchema = new mongoose.Schema(
  {
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
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
    bat_run: { type: Number, default: 0, min: 0 },
    played_ball: { type: Number, default: 0, min: 0 },
    hitted_fours: { type: Number, default: 0, min: 0 },
    hitted_sixes: { type: Number, default: 0, min: 0 },
    bowlruns: { type: Number, default: 0, min: 0 },
    bowled_overs: { type: Number, default: 0, min: 0 },
    maiden_overs: { type: Number, default: 0, min: 0 },
    wicket: { type: Number, default: 0, min: 0 },
    wicket_taker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
    bowler_when_out: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
    extra: { type: Number, default: 0, min: 0 },
    out_type: { type: String, trim: true },
    stricking_role: { type: Number },
    extra_wicket: { type: Number, default: 0, min: 0 },
    noball: { type: Number, default: 0, min: 0 },
    wideball: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Indexes
StatusSchema.index(
  { match_id: 1, innings_number: 1, player_id: 1 },
  { unique: true }
);

// autopopulate plugin
StatusSchema.plugin(mongooseAutopopulate);

const Status = mongoose.model('Status', StatusSchema);

export default Status;
