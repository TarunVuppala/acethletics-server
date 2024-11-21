import errorObject from './errorObject.js';

export default (next, err, req, errorStatusCode = 500) => {
    const errorObj = errorObject(err, req, errorStatusCode);
    return next(errorObj);
};