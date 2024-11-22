/**
 * Custom Logger Module.
 *
 * This module creates a logger using Winston for both console and file logging.
 * The logger's behavior adapts based on the application's environment (e.g., development or production).
 * Console logs are colorized for better readability in the terminal.
 * File logs are stored in JSON format for structured analysis.
 *
 * @module Logger
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { red, blue, yellow, green, magenta } from 'colorette';
import config from '../config/config.js';
import EApplicationEnvironment from '../constant/application.js';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to colorize log levels for console output.
 *
 * @param {string} level - The log level (e.g., 'INFO', 'ERROR', 'WARN').
 * @returns {string} Colorized log level.
 */
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

/**
 * Console log format for development.
 *
 * - Includes a colorized timestamp and log level.
 * - Metadata is prettified and displayed in magenta.
 *
 * @type {import('winston').Format}
 */
const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, metadata } = info;

    const customLevel = colorizeLevel(level.toUpperCase());
    const customTimestamp = green(timestamp);

    const metaData = metadata && Object.keys(metadata).length
        ? `${JSON.stringify(metadata, null, 2)}`
        : '';

    return `----\n${customLevel} [${customTimestamp}] ${message}\n${magenta('META')} ${metaData}\n----`;
});

/**
 * File log format for structured JSON logs.
 *
 * - Logs are serialized as JSON for structured analysis.
 * - Metadata is included in the JSON output.
 *
 * @type {import('winston').Format}
 */
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

/**
 * Console transport for logging in the development environment.
 *
 * - Uses colorized and formatted console logs.
 * - Active only when the environment is `development`.
 *
 * @returns {Array<import('winston').transport>} Array of Winston transports for console logging.
 */
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

/**
 * File transport for logging to disk.
 *
 * - Logs are written to a file named after the current environment (e.g., `development.log`).
 * - Logs include structured JSON with metadata and timestamps.
 *
 * @returns {Array<import('winston').transport>} Array of Winston transports for file logging.
 */
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

/**
 * Custom Winston logger.
 *
 * Combines file and console transports based on the environment configuration.
 *
 * @exports logger
 * @type {import('winston').Logger}
 */
export default createLogger({
    transports: [...fileTransport(), ...consoleTransport()],
});
