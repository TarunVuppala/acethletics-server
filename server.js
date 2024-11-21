import http from 'http';

import app from './app.js';
import config from './config/config.js';
import logger from './utils/logger.js';
import { connectToDatabase } from './db/index.js';

const PORT = config.PORT;
const server = http.createServer(app);

server.listen(PORT, async () => {
    connectToDatabase();
    logger.info(`Server has started successfully`, {
        port: PORT,
        url: `http://localhost:${PORT}`
    });
});
