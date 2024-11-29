import express from 'express';
import { createTeam, deleteTeam, getTeam, getTeams, updateTeam } from '../../../controllers/Admin/teamController.js';
import adminAuth from '../../../../middleware/adminAuth.js';

const router = express.Router({ mergeParams: true });

router.post('/', adminAuth, createTeam);

router.get('/', getTeams);

router.get('/:id', getTeam);

router.patch('/:id', adminAuth, updateTeam);

router.delete('/:id', adminAuth, deleteTeam);

export default router;