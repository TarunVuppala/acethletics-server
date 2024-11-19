const util = require('util');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { red, blue, yellow, green, magenta } = require('colorette');
const config = require('../config/config');
const EApplicationEnvironment = require('../constant/application');

const colorizeLevel = (level) => {
    switch (level) {
        case 'ERROR':
            return red(level);
        case 'INFO':
            return blue(level);
        case 'WARN':
            return yellow(level);
        default:
            return level;
    }
};

const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, metadata } = info;
    
    const customLevel = colorizeLevel(level.toUpperCase());
    const customTimestamp = green(timestamp);

    const metaData = metadata && Object.keys(metadata).length
        ? `${JSON.stringify(metadata, null, 2)}\n----`
        : '';

    return `----\n${customLevel} [${customTimestamp}] ${message}\n${magenta('META')} ${metaData}`;
});

const fileLogFormat = format.printf((info) => {
    const { level, message, timestamp, metadata } = info;

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        ...metadata, 
    };

    return JSON.stringify(logData, null, 4);
});

const consoleTransport = () => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(
                    format.timestamp(),
                    format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
                    consoleLogFormat
                ),
            }),
        ];
    }

    return [];
};

const fileTransport = () => {
    return [
        new transports.File({
            filename: path.join(__dirname, '../', 'logs', `${config.ENV}.log`),
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
                fileLogFormat
            ),
        }),
    ];
};

module.exports = createLogger({
    transports: [...fileTransport(), ...consoleTransport()],
});
