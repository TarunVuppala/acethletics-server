import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema(
    {
        roles: {
            type: [String],
            enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
            required: true,
        },
        batting_style: {
            type: String,
            enum: ['right-handed', 'left-handed'],
            required: true,
        },
        bowling_style: {
            type: String,
            enum: [
                'right-arm fast',
                'left-arm fast',
                'right-arm medium',
                'left-arm medium',
                'right-arm off-spin',
                'left-arm orthodox',
                'leg break',
                'none', 
            ],
            default: 'none',
        },
    },
    { _id: false } 
);

const CricketPlayerSchema = new mongoose.Schema(
    {
        player_name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        department:{
            type: String,
            required: true
        },
        team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
            index: true,
        },
        skill: { type: SkillSchema, required: true },
    },
    { timestamps: true }
);

// PlayerSchema.index({ team_id: 1, player_name: 1 }, { unique: true });

const Player = mongoose.model('CricketPlayer', CricketPlayerSchema);

export default Player;
