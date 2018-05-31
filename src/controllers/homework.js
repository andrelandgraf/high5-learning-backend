"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const HomeworkModel = require('../models/homework');
const ClassModel = require('../models/class');

const create = (req, res) => {

    let classId = req.params.id;

    HomeworkModel.create(req.body).then((myHomework) => {
        ClassModel.findById(classId).exec().then((myClass) => {

            myClass.homework.push(myHomework);
            myClass.save();
            res.status(200).json(myHomework);
        })

    });
};

const getHomeworkDetail = (req, res) => {

    let homeworkId = req.params.id;

    HomeworkModel.findById(homeworkId).exec().then((myHomework) => {
        res.status(200).json(myHomework);
    }).catch(error => {
        console.log(error);
        res.status(404).json({error: "Object not found"});
    })

};


module.exports = {
    create,
    getHomeworkDetail
};