import config from '../config/config.js';

export const setCookie = (res, name, value) => {
    res.cookie(name, value, {
        httpOnly: true,
        secure: config.ENV === 'production',
        sameSite: 'strict',
        maxAge: 1 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
};

export const getCookie = (req, name) => {
    return req.cookies[name];
};
