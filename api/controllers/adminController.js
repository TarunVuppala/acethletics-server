import { Admin } from '../../db/model/index.js';

import httpResponse from '../../utils/httpResponse.js';
import httpError from '../../utils/httpError.js';
import responseMessage from '../../constant/responseMessage.js';

import { setToken } from '../../utils/authToken.js';
import { setCookie } from '../../utils/cookieHandler.js';

export const adminLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            httpError(next, new Error(responseMessage.MISSING_FIELDS), req, 400);
            return;
        }

        const admin = await Admin.findOne({ username });
        if (!admin) {
            httpError(next, new Error(responseMessage.NOT_FOUND('admin')), req, 401);
            return;
        }

        if (password !== admin.password) {
            httpError(next, new Error(responseMessage.PASSWORD_INCORRECT), req, 401);
            return;
        }
        const token = setToken({ username: admin.username, role: admin.role });
        setCookie(res, 'token', token);
        httpResponse(req, res, 200, responseMessage.LOGIN_SUCCESS, {
            admin: {
                username: admin.username,
            },
            role: admin.role,
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const adminLogout = async (req, res, next) => {
    try {
        res.clearCookie('token');
        httpResponse(req, res, 200, responseMessage.LOGOUT_SUCCESS);
    } catch (error) {
        httpError(next, error, req, 500);
    }
}

export const adminResgistration = async (req, res, next) => {
    try {
        const { username, password, email, role } = req.body;
        if (!username || !password || !email) {
            httpError(next, new Error(responseMessage.MISSING_FIELDS), req, 400);
            return;
        }

        const exists = await Admin.findOne({ email });
        if (exists) {
            httpError(next, new Error(responseMessage.RESOURCE_ALREADY_EXISTS('admin')), req, 400);
            return;
        }

        const admin = await Admin.create({
            username,
            password,
            email,
            role
        });
        
        httpResponse(req, res, 200, responseMessage.REGISTRATION_SUCCESS, {
            admin: {
                username: admin.username,
            },
            role: admin.role,
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
}