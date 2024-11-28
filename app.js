import express from 'express';
import cokkieParser from 'cookie-parser';
import cors from 'cors';

import httpResponse from './utils/httpResponse.js';
import responseMessage from './constant/responseMessage.js';
import globalErrorHandler from './middleware/globalErrorHandler.js';
import httpError from './utils/httpError.js';

import router_v1 from './api/router/v1/index.js';

const app = express();
const corsOptions = {
    origin: ['http://localhost:3000','https://acethletics.aceec.ac.in'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cokkieParser());
app.use('/api/v1', router_v1);

app.get('/', (req, res) => {
    httpResponse(req, res, 200, responseMessage.DEFAULT_SUCCESS, { message: "Welcome!!" });
});

app.use((req, res, next) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('route'));
    } catch (err) {
        httpError(next, err, req, 404)
    }
})

app.use(globalErrorHandler);

export default app;
