import { User } from '../../../db/model/index.js';

import httpResponse from "../../../utils/httpResponse.js";
import httpError from "../../../utils/httpError.js";

import responseMessage from "../../../constant/responseMessage.js";
import { setToken } from '../../../utils/authToken.js';

export const userLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            httpError(next, new Error(responseMessage.MISSING_REQUIRED_FIELDS), req, 400);
            return;
        }

        const user = await User.findOne({ email }).lean().exec();
        if (!user) {
            httpError(next, new Error(responseMessage.USER_NOT_FOUND), req, 404);
            return;
        }

        if (user.password !== password) {
            httpError(next, new Error(responseMessage.PASSWORD_INCORRECT), req, 401);
            return;
        }

        const token = setToken({ username: user.username, role: 'user' });
        httpResponse(req, res, 200, responseMessage.LOGGED_IN, {
            username: user.username,
            role: 'user',
            token
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const userSignup = async (req, res, next) => {
    try {
        const { username, email, password, rollNumber } = req.body;
        if (!username || !email || !password || !rollNumber) {
            httpError(next, new Error(responseMessage.MISSING_REQUIRED_FIELDS), req, 400);
            return;            
        }

        const exists = await User.findOne({ email }).lean().exec();
        if (exists) {
            httpError(next, new Error(responseMessage.USER_ALREADY_EXISTS), req, 409);
            return;
        }

        const user = await User.create({ username, email, password, rollNumber });

        httpResponse(req, res, 201, responseMessage.SIGNED_UP, {
            username: user.username,
            role: 'user',
            token
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
}