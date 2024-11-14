import http from 'http';
import app from './app.js';
import config from './config/config.js';

const PORT = config.PORT;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
