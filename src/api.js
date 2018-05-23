"use strict";

const express    = require('express');
const bodyParser = require('body-parser');
const helmet     = require('helmet');

const middlewares = require('./middleware');

const auth  = require('./routes/auth');
const movie = require('./routes/teacher');
const homework = require('./routes/homework');

const api = express();


// Adding Basic Middleware
api.use(helmet());
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));
api.use(middlewares.allowCrossDomain);


// Basic route
api.get('/', (req, res) => {
    res.json({
        name: 'SEBA Master High 5 Learning Backend'
    });
});

// API routes, adding the router to the middleware handling path
api.use('/auth'  , auth);
api.use('/teacher', teacher);
api.use('/homework', homework);



module.exports = api;