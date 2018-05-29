"use strict";

const mongoose = require('mongoose');

//definition of the submission schema

//submission Schema with an array of indexes of the picked answer of each exercise of an homework and the assigned Homework
const SubmissionSchema = new mongoose.Schema({
    exercises:  {
        type: [String],
        enum: [0, 1, 2, 3],
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
