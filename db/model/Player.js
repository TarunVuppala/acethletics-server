import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema(
    {
        roles: {
            type: [String],
            enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
            required: true,
        },
        styles: {
            batting: {
                type: String,
                enum: ['right-handed', 'left-handed'],
                required: function () {
                    return (
                        this.roles.includes('batsman') ||
                        this.roles.includes('wicket_keeper') ||
                        this.roles.includes('all_rounder')
                    );
                },
            },
            bowling: {
                type: String,
                enum: [
                    'right-arm fast',
                    'left-arm fast',
                    'right-arm medium',
                    'left-arm medium',
                    'right-arm off-spin',
                    'left-arm orthodox',
                    'leg break',
                    'other',
                ],
                required: function () {
                    return (
                        this.roles.includes('bowler') || this.roles.includes('all_rounder')
                    );
                },
            },
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
        department: {
            type: String,
            required: true
        },
        team_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
        },
        skill: { type: SkillSchema },
    },
    { timestamps: true }
);

CricketPlayerSchema.index({ team_id: 1, player_name: 1 }, { unique: true });

const CricketPlayer = mongoose.model('CricketPlayer', CricketPlayerSchema);

export default CricketPlayer;
