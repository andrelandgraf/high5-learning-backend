"use strict";

/**
 * require (import)
 * if webstorm marks require as unresolved,
 * check webstorm: settings/languages frameworks/nodejs and npm
 * and activate coding assistance for node.js
 */
const express    = require('express');
const bodyParser = require('body-parser');
const helmet     = require('helmet');

const middleware = require('./middleware');

const auth  = require('./routes/auth');
const classes = require('./routes/classes');
const homework = require('./routes/homework');

const api = express();


// Adding Basic Middleware
api.use(helmet());
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));
api.use(middleware.allowCrossDomain);

/**
 * express get
 * package.json devDependency @types/express to
 * introduce those functions to webstorm
 */
// Basic route
api.get('/', (req, res) => {
    res.json({
        name: 'SEBA Master High 5 Learning Backend'
    });
});

// API routes, adding the router to the middleware handling path
api.use('/auth'  , auth);
api.use('/classes', classes);
api.use('/homework', homework);



module.exports = api;