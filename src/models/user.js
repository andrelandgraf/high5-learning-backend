"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the user schema
// a user has a name and password and a type(set via registration)
// classes is an array of foreign keys to the schema class
// if user is a teacher: classes are the classes the teacher created  -> can access, edit the class
// if user is a student: classes are the classes the student has signed up for -> can access the class
// TODO why is password unquie, aka. we might neeed unique at username && also dropDups = true at username
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