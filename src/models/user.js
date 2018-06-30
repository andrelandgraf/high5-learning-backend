"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * the user schema
 * a user has a name and password and a type(set via registration)
 * type: either student or teacher
 * classes: an array of foreign keys to the schema class
 * if user is a teacher: classes are the classes the teacher created  -> can access and edit the class
 * if user is a student: classes are the classes the student has signed up for -> can access the class
 * @type {module:mongoose.Schema}
 */
const UserSchema  = new Schema({
    username: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Teacher', 'Student'],
        default: 'Student'
    },
    classes: [
        { type: Schema.Types.ObjectId, ref: 'Class'}
    ]
}, { collection: 'user' });

UserSchema.set('versionKey', false);

// Export the UserSchema model under the name User
module.exports = mongoose.model('User', UserSchema);