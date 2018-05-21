"use strict";

//Configuration variables
const port      = process.env.PORT        || '3000';
const mongoURI  = process.env.MONGODB_URI || 'mongodb://localhost:27017/high-five-db';
const JwtSecret = process.env.JWT_SECRET  ||'very hight five e learning';

module.exports = {
    port,
    mongoURI,
    JwtSecret,
};