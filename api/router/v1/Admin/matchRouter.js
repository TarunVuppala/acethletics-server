import express from 'express';
import { createMatch, deleteMatch, getMatch, getMatches, getMatchInnings, startInnings, updateInnings, updateMatch, updateMatchStatus, updateTossStatus } from '../../../controllers/Admin/matchController.js';
import adminAuth from '../../../../middleware/adminAuth.js';

const router = express.Router({ mergeParams: true });

router.post('/', adminAuth, createMatch);

router.get('/', getMatches);

router.get('/:matchId', getMatch);

router.patch('/:matchId', adminAuth, updateMatch);

router.delete('/:matchId', adminAuth, deleteMatch);

router.post('/:matchId/updateStatus', adminAuth, updateMatchStatus);

router.post('/:matchId/toss', adminAuth, updateTossStatus);

router.post('/:matchId/innings', adminAuth, startInnings);

router.get('/:matchId/innings', getMatchInnings);

router.patch('/:matchId/innings/:inningsId', adminAuth, updateInnings);

export default router;