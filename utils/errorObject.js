const responseMessage = require('../constant/responseMessage');
const config = require('../config/config');
const { EApplicationEnvironment } = require('../constant/application');
const logger = require('./logger');

module.exports = (err, req, errorStatusCode = 500) => {
    const errorObj = {
        success: false,
        statusCode: errorStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: err instanceof Error ? err.message || responseMessage.SOMETHING_WENT_WRONG : responseMessage.SOMETHING_WENT_WRONG,
        data: err.data || null,
        trace: err instanceof Error ? { error: err.stack } : null,
    };

    // Log
    logger.error(`CONTROLLER_ERROR`, {
        meta: errorObj,
    });

    // Production Environment Check
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete errorObj.request.ip;
        delete errorObj.trace;
    }

    return errorObj;
};
