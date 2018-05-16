"use strict";

// this is the hello world nodejs "app"
// to make it an rest api server -> https://www.codementor.io/olatundegaruba/nodejs-restful-apis-in-10-minutes-q0sgsfhbd
// further: see code at the bottom of the sepa backend repo for their index.js / server.js

/**
 * require (import)
 * if webstorm marks require as unresolved,
 * check webstorm: settings/languages frameworks/nodejs and npm
 * and activate coding assistance for node.js
 */
const express = require('express');
const app = express();

/**
 * express get
 * package.json devDependency @types/express to
 * introduce those functions to webstorm
 */
app.get('/', function (req, res) {
    res.send('Hello World!');
});


app.get('/test/:id', function (req, res) {
    res.send({title: 'Hello World', id:req.params.id});
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// const http       = require('http');
// const mongoose   = require('mongoose');

// const api        = require('./src/api');
// const config     = require('./src/config');


// Set the port to the API.
// api.set('port', config.port);

//Create a http server based on Express
// const server = http.createServer(api);


//Connect to the MongoDB database; then start the server
// mongoose
//     .connect(config.mongoURI)
//     .then(() => server.listen(config.port))
//     .catch(err => {
//         console.log('Error connecting to the database', err.message);
//         process.exit(err.statusCode);
//     });


// server.on('listening', () => {
//     console.log(`API is running in port ${config.port}`);
// });
//
// server.on('error', (err) => {
//     console.log('Error in the server', err.message);
//     process.exit(err.statusCode);
// });