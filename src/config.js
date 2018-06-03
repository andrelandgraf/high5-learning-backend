"use strict";

//Configuration variables
const port      =   '3001';
const mongoURI  = 'mongodb://localhost:27017/high-five-db';
const JwtSecret =  'very high five e learning';

module.exports = {
    port,
    mongoURI,
    JwtSecret,
};