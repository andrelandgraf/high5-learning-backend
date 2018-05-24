"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the school schema
// This schema will be used read-only by the backend
// The only way to insert data is directly into the mongodb
// We have to store the licence codes of the schools to check it against registrations of teachers
const SchoolSchema  = new Schema({
    name: {
        type: String,
        required: true
    },
    license: {
        type: String,
        required: true,
        unique: true
    },
    teachers: [
        { type: Schema.Types.ObjectId, ref: 'User'}
    ]
});

// Export the UserSchema model under the name User
module.exports = mongoose.model('School', SchoolSchema);