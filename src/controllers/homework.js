"use strict";

const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');

const config     = require('../config');
const HomeworkModel  = require('../models/homework');



const list = (req, res) => {

    const sampleHomework = [
        {
            id: 127,
            title: "Math",
            description: "Veeeeeery long description of the specific contents of this class.",
            URL: "www.high5learning.com/classes/127",
            password: "very very secret password"
        },
        {
            id: 128,
            title: "Biology",
            description: "Veeeeeery long description of the specific contents of this class.",
            URL: "www.high5learning.com/classes/128",
            password: "very very secret password"
        },
        {
            id: 129,
            title: "Chemistry",
            description: "Veeeeeery long description of the specific contents of this class.",
            URL: "www.high5learning.com/classes/129",
            password: "very very secret password"
        },
        {
            id: 130,
            title: "Physics",
            description: "Veeeeeery long description of the specific contents of this class.",
            URL: "www.high5learning.com/classes/130",
            password: "very very secret password"
        }
    ];

    res.status(200).json(sampleHomework);

};

/*const create = (req,res) => {

    console.log(req.body);

    HomeworkModel.create(req.body).then((myHomework) =>
    {
        console.log(myHomework);
        res.status(200).json(myHomework);
    });
}*/

const find = (req,res) => {
    HomeworkModel.findOne({_id: req.body.id}).exec()
        .then(myHomework => myHomework);
}

module.exports = {
    //list,
    //create
    find
};