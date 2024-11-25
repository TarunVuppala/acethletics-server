import express from 'express';
import { addTeamsToTournament, createTournament, deleteTournament, getPointsTable, getStats, getTeamsInTournament, getTournament, getTournaments, removeTeamFromTournament, updatePointsTable, updateStats, updateTournament } from '../../../controllers/Admin/tournamentController';

const router = express.Router();

router.post('/', createTournament);

router.get('/', getTournaments);

router.get('/:tournamentId', getTournament);

router.patch('/:tournamentId', updateTournament);

router.delete('/:tournamentId', deleteTournament);

router.post('/:tournamentId/teams', addTeamsToTournament);

router.get('/:tournamentId/teams', getTeamsInTournament);

router.delete('/:tournamentId/teams/:teamId', removeTeamFromTournament);

router.post('/:tournamentId/points-table', updatePointsTable);

router.get('/:tournamentId/points-table', getPointsTable);

router.get('/:tournamentId/stats', getStats);

router.post('/:tournamentId/stats', updateStats);

export default router;