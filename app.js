const express = require('express');
const logger = require('./utils/logger');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    console.log('abc')
    logger.info('abv')
    res.status(200).json({ message: 'Welcome to the API!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
