/**
 * Main Router for the application.
 * 
 * This router combines the routes for admin-related operations and player-related operations.
 * It acts as a central point for routing API requests to their respective modules.
 *
 * @module MainRouter
 */

import express from 'express';

import adminRouter from './Admin/adminRouter.js';
import playerRouter from './Admin/playerRouter.js';

const router = express.Router();

/**
 * Admin Router.
 *
 * Routes starting with `/admin` are handled by `adminRouter`.
 * 
 * @see module:AdminRouter
 * @example
 * - POST /api/admin/login: Log in as an admin.
 * - POST /api/admin/logout: Log out as an admin.
 * - POST /api/admin/register: Register a new admin.
 */
router.use('/admin', adminRouter);

/**
 * Player Router.
 *
 * Routes starting with `/player` are handled by `playerRouter`.
 * 
 * @see module:PlayerRouter
 * @example
 * - POST /api/player: Add a new player.
 */
router.use('/player', playerRouter);

export default router;
