"use strict";

const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');

const config     = require('../config');
const ClassModel  = require('../models/class');



const list = (req, res) => {

    const classes = [
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

    res.status(200).json(classes);

};

const create = (req,res) => {

    console.log(req.body);

    const addClass = Object.assign(req.body, {password: "veryveryverysecret"});

    ClassModel.create(addClass).then((myClass) =>
    {
        console.log(myClass);
        res.status(200).json(myClass);
    });
}

const find = (req,res) => {
    ClassModel.findOne({_id: req.body.id}).exec()
        .then(myClass => myClass);
}

module.exports = {
    list,
    create,
    find
};