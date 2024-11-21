import { getUser } from '../utils/authToken.js';
import { getCookie } from '../utils/cookieHandler.js';
import httpError from '../utils/httpError.js';
import logger from '../utils/logger.js';

function auth(req, res, next) {
    const token = getCookie(req, 'token'); // Specify the cookie name explicitly

    if (token) {
        const payload = getUser(token);
        logger.info('Payload', { payload });
        if (payload) {
            req.user = payload;
            next();
        } else {
            httpError(next, new Error('Unauthorized'), req, 401);
        }
    } else {
        httpError(next, new Error('Unauthorized'), req, 401);
    }
}

export default auth;
