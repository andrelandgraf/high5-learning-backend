"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Define the class schema
 * This schema will be used "read-only" by the backend
 * It is possible to add new students to a school
 * But the only way to insert new schools and update school name and license code is directly into the mongodb
 * @type {module:mongoose.Schema}
 */
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
    users: [
        { type: Schema.Types.ObjectId, ref: 'User'}
    ]
},{ collection: 'school' });

// Export the UserSchema model under the name User
module.exports = mongoose.model('School', SchoolSchema);