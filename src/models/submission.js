"use strict";

const mongoose = require('mongoose');

/**
 * Submission Schema
 * exercises: array of picked answers for each exercise of the homework, picked answer is the index of the answers array
 * homework: composition, homework (parent) for the submission (child)
 * student: the student who has submitted this Submission
 * @type {module:mongoose.Schema}
 */
const SubmissionSchema = new mongoose.Schema({
    exercises:  {
        type: [Number],
        required: true
    },
    homework: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{ collection: 'submission' });

//Setting configurable options to HomeworkSchema
SubmissionSchema.set('timestamps', true);


//Export of the homework model
module.exports = mongoose.model('Submission', SubmissionSchema);
