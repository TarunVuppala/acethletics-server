import express from express;

import httpResponse from "../../../../utils/httpResponse";

import userAuth from "../../../../middleware/userAuth";
import { userLogin, userSignup } from "../../../controllers/User/userController";

const router = express.Router();

router.get('/verify-token', userAuth, (req, res) => {
    httpResponse(req, res, 200, 'success', { message: "Welcome!!" });
});

router.post('/login', userLogin);

router.post('/signup', userSignup);

export default router;