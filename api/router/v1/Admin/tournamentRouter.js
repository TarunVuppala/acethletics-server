import express from 'express';
import { addTeamsToTournament, createTournament, deleteTournament, getPointsTable, getStats, getTeamsInTournament, getTournament, getTournaments, removeTeamFromTournament, updatePointsTable, updateStats, updateTeamPoints, updateTournament } from '../../../controllers/Admin/tournamentController.js';
import matchRouter from './matchRouter.js';
import teamRouter from '../../../router/v1/Admin/teamRouter.js';
import adminAuth from '../../../../middleware/adminAuth.js';

const router = express.Router();

router.use('/:tournamentId/match', matchRouter);
router.use('/:tournamentId/teams', teamRouter);

router.post('/', adminAuth, createTournament);

router.get('/', getTournaments);

router.get('/:tournamentId', getTournament);

router.patch('/:tournamentId', adminAuth, updateTournament);

router.delete('/:tournamentId', adminAuth, deleteTournament);

router.post('/:tournamentId/teams', adminAuth, addTeamsToTournament);

router.get('/:tournamentId/teams', getTeamsInTournament);

router.delete('/:tournamentId/teams', adminAuth, removeTeamFromTournament);

router.post('/:tournamentId/points-table', adminAuth, updatePointsTable);

router.post('/:tournamentId/points-table/:teamId', adminAuth, updateTeamPoints);

router.get('/:tournamentId/points-table', getPointsTable);

router.get('/:tournamentId/stats', getStats);

router.post('/:tournamentId/stats', adminAuth, updateStats);

export default router;