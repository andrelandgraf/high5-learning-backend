"use strict";

const mongoose = require('mongoose');

//definition of the homework schema

//homework Schema with title of homework, corresponding exercises and assignedClass
const HomeworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    exercises: [{
        question: {
            type: String,
            required: true
        },
        answers: {
            type: [String],
            required: true
        },

    }],
    assignedClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
    }
},{ collection: 'homework' });

//Setting configurable options to HomeworkSchema
HomeworkSchema.set('timestamps', true);


//Export of the homework model
module.exports = mongoose.model('Homework', HomeworkSchema);


// sample homework json
/*
{
    title: "Algebra 1",
        exercises:
    [{question: "What is 1+1 ?",
        answers: ["2", "4", "6", "19"]},

    {question: "What is 4*4 ?",
        answers: ["56", "16", "56", "88"]},

    {question: "What is 4*4 ?",
        answers: ["56", "16", "56", "88"]},

        {question: "What is 2/4 ?",
            answers: ["0.5", "122", "0.5", "856"]},

        {question: "What is 400*333 ?",
            answers: ["3434", "343", "33", "85"]}
],
    assignedClass: 5b0abf6cfda2f811b0dda0ef
}

*/
