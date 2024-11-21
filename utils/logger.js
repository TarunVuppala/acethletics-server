import { fileURLToPath } from 'url';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { red, blue, yellow, green, magenta } from 'colorette';
import config from '../config/config.js';
import EApplicationEnvironment from '../constant/application.js';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to colorize log levels
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

// Console log format
const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, metadata } = info;

    const customLevel = colorizeLevel(level.toUpperCase());
    const customTimestamp = green(timestamp);

    const metaData = metadata && Object.keys(metadata).length
        ? `${JSON.stringify(metadata, null, 2)}\n----`
        : '';

    return `----\n${customLevel} [${customTimestamp}] ${message}\n${magenta('META')} ${metaData}`;
});

// File log format
const fileLogFormat = format.printf((info) => {
    const { level, message, timestamp, metadata } = info;

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        metadata,
    };

    return JSON.stringify(logData, null, 4);
});

// Console transport for development
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

// File transport for logging to files
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

// Combine transports and export logger
export default createLogger({
    transports: [...fileTransport(), ...consoleTransport()],
});
