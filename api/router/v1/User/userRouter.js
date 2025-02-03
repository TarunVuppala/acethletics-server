import express from 'express';

import httpResponse from "../../../../utils/httpResponse.js";

import userAuth from "../../../../middleware/userAuth.js";
import { userLogin, userSignup } from "../../../controllers/User/userController.js";

const router = express.Router();

router.get('/verify-token', userAuth, (req, res) => {
    httpResponse(req, res, 200, 'success', { message: "Welcome!!" });
});

router.post('/login', userLogin);

router.post('/signup', userSignup);

export default router;