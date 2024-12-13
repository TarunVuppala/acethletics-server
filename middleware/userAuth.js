import { getUser } from '../utils/authToken.js';
import httpError from '../utils/httpError.js';
import logger from '../utils/logger.js';

function userAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return httpError(next, new Error('Unauthorized! Token Missing.'), req, 401);
        }
        const token = authHeader.split(' ')[1];
        const user = getUser(token);
        if (!user) {
            return httpError(next, new Error('Unauthorized! Invalid Token.'), req, 401);
        }
        req.user = user;
        next();
    } catch (error) {
        logger.error(`User Authentication Error: ${error.message}`);
        return httpError(next, error, req, 401);
    }
}

export default userAuth;