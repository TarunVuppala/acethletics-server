import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema(
  {
    team_name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer',
      },
    ],
  },
  { timestamps: true }
);

// Index
TeamSchema.index({ team_name: 1 });

const Team = mongoose.model('Team', TeamSchema);

export default Team;
