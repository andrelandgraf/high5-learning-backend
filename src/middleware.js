"use strict";

const jwt    = require('jsonwebtoken');

const config = require ('./config');
const errorHandler = require('./error');

const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
        //res.status(200).send(200);
    }
    else {
        next();
    }
};

const checkAuthentication = (req, res, next) => {
    // if header auth is empty, no token
    if(req.headers === undefined || req.headers['authorization'] === undefined ){
        const err = errorHandler.handle('No token provided in the request');
        return res.status(err.code).json(err);
    }

    // check header or url parameters or post parameters for token
    const token = req.headers['authorization'].substring(4);


    if (!token){
        const err = errorHandler.handle('No token provided in the request');
        return res.status(err.code).json(err);
    }


    // verifies secret and checks exp
    jwt.verify(token, config.JwtSecret, (error, decoded) => {
        if (error){
            const err = errorHandler.handle('No token provided in the request');
            return res.status(err.code).json(err);
        }

        // if everything is good, save to request for use in other routes
        req.userId = decoded.id;
        req.userType = decoded.type;
        req.schoolname = decoded.schoolname;
        next();
    });


};

module.exports = {
    allowCrossDomain,
    checkAuthentication
};