"use strict";

const mongoose = require('mongoose');

//definition of the homework schema


/**
 * homework Schema with
 * title of homework,
 * corresponding exercises:
 *      id: index of the exercise within the exercise list !starting at one!
 *      question: String, the question to be answered in this exercise
 *      answers: array of the four possible multiple choice answer possibilities
 *      right solution: index of the answer in the answers array that is the right answer !starting at zero!
 * assignedClass: every homework is child of a class, composition between the two models
 * visible: is this homework visible for the students of the class yet?
 * @type {module:mongoose.Schema}
 */
const HomeworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    exercises: [{
        id: {
            type: String,
            required: true
        },
        question: {
            type: String,
            required: true
        },
        answers: {
            type: [String],
            required: true
        },
        rightSolution: {
            type: Number,
            required: true
        },

    }],
    assignedClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    visible: {
        type: Boolean,
        required: true
    }
},{ collection: 'homework' });

//Setting configurable options to HomeworkSchema
HomeworkSchema.set('timestamps', true);


//Export of the homework model
module.exports = mongoose.model('Homework', HomeworkSchema);
