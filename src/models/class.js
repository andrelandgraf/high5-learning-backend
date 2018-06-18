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
    students: [
        { type: Schema.Types.ObjectId, ref: 'User'}
    ],
    homework: [
        { type: Schema.Types.ObjectId, ref: 'Homework'}
    ]
}, { collection: 'class' });

ClassSchema.set('timestamps', true);

module.exports = mongoose.model('Class', ClassSchema);