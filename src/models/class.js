"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the class schema
// This schema will be used read-only by the backend
// The only way to insert data is directly into the mongodb
const ClassSchema  = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    homework: [
        { type: Schema.Types.ObjectId, ref: 'Homework'}
    ]
});

module.exports = mongoose.model('Class', ClassSchema);