const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../utils/logger');

const mongoURI = config.MONGO_URI;

if (!mongoURI) {
    logger.error('Error: MONGO_URI is not defined in environment variables.');
    process.exit(1);
}

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

function connectToDatabase() {
    mongoose.connect(mongoURI, options);

    mongoose.connection.on('connected', () => {
        logger.info('Mongoose connected to ', { mongoURI });
    });

    mongoose.connection.on('error', (err) => {
        logger.error('Mongoose connection error: ', {
            error: err
        });
    });

    mongoose.connection.on('disconnected', () => {
        logger.info('Mongoose disconnected');
    });

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            logger.info('Mongoose connection closed due to application termination');
            process.exit(0);
        });
    });
}

module.exports = connectToDatabase;
