const http = require('http');
const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

const PORT = config.PORT;
const server = http.createServer(app);

server.listen(PORT, () => {
    logger.info(`Server has started successfully`, {
        port: PORT,
        url: `http://localhost:${PORT}`
    });
});
