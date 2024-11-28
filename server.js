import http from 'http';

import app from './app.js';
import config from './config/config.js';
import logger from './utils/logger.js';
import { connectToDatabase } from './db/index.js';
import { Server } from 'socket.io';

const PORT = config.PORT;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://acetheletics.aceec.ac.in'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    },
});

io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

server.listen(PORT, async () => {
    connectToDatabase();
    logger.info(`Server has started successfully`, {
        port: PORT,
        url: `http://localhost:${PORT}`,
    });
});

export { io };
