import mongoose from 'mongoose';

const CricketTeamSchema = new mongoose.Schema(
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
CricketTeamSchema.index({ team_name: 1 });

const CricketTeam = mongoose.model('CricketTeam', CricketTeamSchema);

export default CricketTeam;
