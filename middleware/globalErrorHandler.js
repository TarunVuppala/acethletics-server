import logger from '../utils/logger.js';

export default (err, req, res, next) => {
    logger.error(err.message, { ...err });
    res.status(err.statusCode || 500).json({ error: err.message, success: false });
};
