const InningsSchema = new mongoose.Schema(
  {
    match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    innings_number: {
      type: Number,
      required: true,
      enum: [1, 2], // Typically, a match has up to 2 innings
    },
    batting_team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    bowling_team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    batting_order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CricketPlayer',
        required: true,
      },
    ],
    current_batsmen: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
        autopopulate: { maxDepth: 1 },
      },
    ],
    current_bowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
      autopopulate: { maxDepth: 1 },
    },
    wicket_keeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
      autopopulate: { maxDepth: 1 },
    },
    score: { type: ScoreSchema, required: true, default: () => ({}) },
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
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    team_Aid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      immutable: true,
      index: true,
    },
    team_Bid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      immutable: true,
      index: true,
    },
    toss: {
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
      },
      elected_to: {
        type: String,
        enum: ['bat', 'bowl'],
        default: null,
      },
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed'],
      default: 'upcoming',
      index: true,
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
      ref: 'CricketPlayer',
      default: null,
    },
  },
  { timestamps: true }
);

MatchSchema.index({ status: 1, startTime: -1 });
InningsSchema.index({ match_id: 1, innings_number: 1 }, { unique: true });

const Innings = mongoose.model('Innings', InningsSchema);
const Match = mongoose.model('Match', MatchSchema);

export { Innings, Match };
