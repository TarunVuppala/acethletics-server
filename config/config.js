const dotenv = require('dotenv-flow');

dotenv.config();

module.exports = {
    ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    MONGO_URI: process.env.MONGO_URI,
}
