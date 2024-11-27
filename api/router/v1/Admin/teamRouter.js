import express from 'express';
import { createTeam, deleteTeam, getTeam, getTeams, updateTeam } from '../../../controllers/Admin/teamController.js';

const router = express.Router();

router.post('/', createTeam);

router.get('/', getTeams);

router.get(':id', getTeam);

router.patch('/:id', updateTeam);

router.delete('/:id', deleteTeam);

export default router;