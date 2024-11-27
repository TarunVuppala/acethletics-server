import express from 'express';
import { createMatch, getMatch, getMatches, startInnings, updateInnings, updateMatch, updateMatchStatus, updateTossStatus } from '../../../controllers/Admin/matchController';

const router = express.Router();

router.post('/', createMatch);

router.get('/', getMatches);

router.get('/:matchId', getMatch);

router.patch('/', updateMatch);

router.delete('/:matchId', updateMatch);

router.post('/:matchId/updateStatus', updateMatchStatus);

router.post('/:matchId/toss', updateTossStatus);

router.post('/:matchId/innings', startInnings);

router.get('/:matchId/innings', getMatchInnings);

router.patch('/:matchId/innings/:inningsId', updateInnings);

export default router;