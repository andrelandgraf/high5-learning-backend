"use strict";

const mongoose = require('mongoose');

//definition of the homework schema

//ExerciseSchema is a subdocument for the HomeworkSchema
const ExerciseSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answers: {
        type: [String],
        required: true
    }
})

//homework Schema with title of homework, corresponding exercises and assignedClass
const HomeworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    exercises: {
        question: {
            type: String,
            required: true
        },
        answers: {
            type: [String],
            required: true
        },
        required: true
    },
    assignedClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
    }
},{ collection: 'homework' });

//Setting configurable options to HomeworkSchema
HomeworkSchema.set('timestamps', true);


//Export of the homework model
module.exports = mongoose.model('Homework', HomeworkSchema);