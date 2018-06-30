"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * the class schema containing
 * title: the title of the class (class name)
 * description: a description of this class (aims, learning horizon, etc.)
 * students: a list of user ids (students) that are members of this class
 * homework: a list of homework, all homeworks that have been inserted for this class by the teacher
 * @type {module:mongoose.Schema}
 */
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