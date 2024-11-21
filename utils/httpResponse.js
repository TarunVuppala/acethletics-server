import config from '../config/config.js';
import EApplicationEnvironment from '../constant/application.js';
import logger from './logger.js';

export default (req, res, responseStatusCode, responseMessage, data = null) => {
    const response = {
        success: true,
        statusCode: responseStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: responseMessage,
        ...data,
    };

    // Log the response
    logger.info(`CONTROLLER_RESPONSE`, {
        meta: response,
    });

    // Remove sensitive information in production
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete response.request.ip;
    }

    // Send the response
    res.status(responseStatusCode).json(response);
};
