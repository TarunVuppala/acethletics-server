import mongoose from 'mongoose';
import config from '../config/config';

const mongoURI = config.MONGO_URI;

if (!mongoURI) {
    console.error('Error: MONGO_URI is not defined in environment variables.');
    process.exit(1); 
}

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

function connectToDatabase() {
    mongoose.connect(mongoURI, options);

    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to ' + mongoURI);
    });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected');
    });

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log('Mongoose connection closed due to application termination');
            process.exit(0);
        });
    });
}

export default connectToDatabase();
