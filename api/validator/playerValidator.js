import Joi from 'joi';

// Predefined allowed values for roles and styles
const allowedRoles = ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'];
const allowedBattingStyles = ['right-handed', 'left-handed'];
const allowedBowlingStyles = [
    'right-arm fast',
    'left-arm fast',
    'right-arm medium',
    'left-arm medium',
    'right-arm off-spin',
    'left-arm orthodox',
    'leg break',
    "other"
];

/**
 * Joi validation schema for player data.
 *
 * @property {Array<string>} roles - Array of valid roles the player can perform. Must be one of `allowedRoles`.
 * @property {Object} styles - Object specifying the player's styles.
 * @property {string} styles.batting - Required if the player has a role in `['batsman', 'wicket_keeper', 'all_rounder']`. Must be one of `allowedBattingStyles`.
 * @property {string} styles.bowling - Required if the player has a role in `['bowler', 'all_rounder']`. Must be one of `allowedBowlingStyles`.
 */
const playerValidator = Joi.object({
    // Validate the roles array
    roles: Joi.array()
        .items(Joi.string().valid(...allowedRoles)) // Each role must be in allowedRoles
        .min(1) // At least one role is required
        .required() // The roles array itself is required
        .messages({
            'any.required': 'Roles are required.',
            'array.min': 'At least one role must be specified.',
            'any.only': 'Roles must be one of {{#valids}}.',
        }),

    // Validate the styles object
    styles: Joi.object({
        // Validate batting style
        batting: Joi.string()
            .valid(...allowedBattingStyles) // Batting style must be valid
            .when('...roles', {
                is: Joi.array().items(Joi.string().valid('batsman', 'wicket_keeper', 'all_rounder')),
                then: Joi.required(),
                otherwise: Joi.forbidden(),
            })
            .messages({
                'any.required': 'Batting style is required for the given roles.',
                'any.only': 'Batting style must be one of {{#valids}}.',
                'any.unknown': 'Batting style is not allowed for the given roles.',
            }),

        // Validate bowling style
        bowling: Joi.string()
            .valid(...allowedBowlingStyles) // Bowling style must be valid
            .when('...roles', {
                is: Joi.array().items(Joi.string().valid('bowler', 'all_rounder')),
                then: Joi.required(),
                otherwise: Joi.forbidden(),
            })
            .messages({
                'any.required': 'Bowling style is required for the given roles.',
                'any.only': 'Bowling style must be one of {{#valids}}.',
                'any.unknown': 'Bowling style is not allowed for the given roles.',
            }),
    })
        .required() // The styles object itself is required
        .messages({
            'any.required': 'Styles object is required.',
        }),
});

export default playerValidator;
