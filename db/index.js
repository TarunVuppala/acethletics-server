/**
 * MongoDB Connection Module.
 *
 * This module establishes a connection to the MongoDB database using Mongoose.
 * It handles connection events like `connected`, `error`, and `disconnected`.
 * Additionally, it ensures graceful termination of the database connection on application exit.
 *
 * @module DatabaseConnection
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../utils/logger.js';

// MongoDB URI from environment variables
const mongoURI = config.MONGO_URI;

// Validate MongoDB URI
if (!mongoURI) {
    logger.error('Error: MONGO_URI is not defined in environment variables.');
    process.exit(1); // Exit the application if URI is missing
}

// Mongoose connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

/**
 * Establishes a connection to the MongoDB database.
 *
 * This function connects to MongoDB using the URI and options defined above.
 * It sets up event listeners to handle connection events and ensures the connection
 * is closed gracefully on application termination.
 *
 * @function
 * @returns {void}
 *
 * @events
 * - `connected`: Logs a success message when the connection is established.
 * - `error`: Logs an error message if there's a connection error.
 * - `disconnected`: Logs a message when the connection is disconnected.
 * - `SIGINT`: Handles application termination and closes the connection gracefully.
 *
 * @example
 * import { connectToDatabase } from './db/mongoConnection.js';
 * connectToDatabase();
 */
export const connectToDatabase = () => {
    // Attempt to connect to MongoDB
    mongoose.connect(mongoURI, options);

    // Handle successful connection
    mongoose.connection.on('connected', () => {
        logger.info(`MongoDB connected`);
    });

    // Handle connection errors
    mongoose.connection.on('error', (err) => {
        logger.error('Mongoose connection error: ', {
            error: err
        });
    });

    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
        logger.info('Mongoose disconnected');
    });

    // Handle application termination (e.g., CTRL+C)
    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            logger.info('Mongoose connection closed due to application termination');
            process.exit(0);
        });
    });
};
