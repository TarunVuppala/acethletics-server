import express from 'express';

import { adminLogin } from '../../controllers/adminController.js';
import adminAuth from '../../../middleware/adminAuth.js';
import httpResponse from '../../../utils/httpResponse.js';

const router = express.Router();

router.post('/login', adminLogin);

router.get('/', adminAuth, (req, res) => {
    httpResponse(req, res, 200, 'success', { message: "Welcome!!" });
});

export default router;
