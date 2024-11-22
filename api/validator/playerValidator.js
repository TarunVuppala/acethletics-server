/**
 * Player validation schema using Joi.
 * 
 * This schema validates player skill data, ensuring the roles and styles adhere to predefined constraints.
 * It enforces role-specific requirements for batting and bowling styles.
 * 
 * @module playerValidator
 */

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
];

/**
 * Joi validation schema for player data.
 *
 * @property {Array<string>} roles - Array of valid roles the player can perform. Must be one of `allowedRoles`.
 * @property {Object} styles - Object specifying the player's styles.
 * @property {string} styles.batting - Required if the player has a role in `['batsman', 'wicket_keeper', 'all_rounder']`. Must be one of `allowedBattingStyles`.
 * @property {string} styles.bowling - Required if the player has a role in `['bowler', 'all_rounder']`. Must be one of `allowedBowlingStyles`.
 *
 * @example
 * const player = {
 *   roles: ['batsman', 'wicket_keeper'],
 *   styles: {
 *     batting: 'left-handed',
 *   },
 * };
 * const { error } = playerValidator.validate(player);
 * if (error) {
 *   logger.error(error.message);
 * }
 */
const playerValidator = Joi.object({
    // Validate the roles array
    roles: Joi.array()
        .items(Joi.string().valid(...allowedRoles)) // Each role must be in allowedRoles
        .min(1) // At least one role is required
        .required() // The roles array itself is required
        .messages({
            'any.required': 'Roles are required.', // Error if roles are missing
            'array.min': 'At least one role must be specified.', // Error if no roles provided
            'any.only': 'Roles must be one of {{#valids}}.', // Error if invalid role provided
        }),

    // Validate the styles object
    styles: Joi.object({
        // Validate batting style
        batting: Joi.string()
            .valid(...allowedBattingStyles) // Batting style must be in allowedBattingStyles
            .when('..roles', {
                // Required if roles include batsman, wicket_keeper, or all_rounder
                is: Joi.array().has(Joi.valid('batsman', 'wicket_keeper', 'all_rounder')),
                then: Joi.required(),
                otherwise: Joi.forbidden(), // Forbidden if the roles don't match
            })
            .messages({
                'any.required': 'Batting style is required for the given roles.', // Error if missing
                'any.only': 'Batting style must be one of {{#valids}}.', // Error if invalid
            }),

        // Validate bowling style
        bowling: Joi.string()
            .valid(...allowedBowlingStyles) // Bowling style must be in allowedBowlingStyles
            .when('..roles', {
                // Required if roles include bowler or all_rounder
                is: Joi.array().has(Joi.valid('bowler', 'all_rounder')),
                then: Joi.required(),
                otherwise: Joi.forbidden(), // Forbidden if the roles don't match
            })
            .messages({
                'any.required': 'Bowling style is required for the given roles.', // Error if missing
                'any.only': 'Bowling style must be one of {{#valids}}.', // Error if invalid
            }),
    })
        .required() // The styles object itself is required
        .messages({
            'any.required': 'Styles object is required.', // Error if styles are missing
        }),
});

export default playerValidator;
