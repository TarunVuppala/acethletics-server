import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const setToken = (payload) => {
    try {
        const token = jwt.sign({ ...payload }, config.JWT_SECRET, { expiresIn: '1d' });
        return token;
    } catch (err) {
        logger.error(err);
        return null;
    }
};

const getUser = (token) => {
    try {
        if (!token) return null;
        return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
        logger.error(error);
        return null;
    }
};

export { setToken, getUser };
