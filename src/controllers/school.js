"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const SchoolModel = require('../models/school');

const find = (req, res) => {
    return res.status(200).json('hallo');
};


const getStudentsOfSchool = (req, res) => {

    let schoolId = req.params.id;
    if (schoolId === "no") {
        schoolId = '5b0c2d6a8440fc2744866726';
    }

    SchoolModel.findById(schoolId).populate('users').then((school) => {
        const students = school.users.filter(user => user.type === 'Student');
        res.status(200).json(students);
    }).catch(() => res.status(500).json({error: "Students not found"}));


};

const getAll = (req, res) => {
    SchoolModel.find({}).then((schools) => {
            res.status(200).json(schools);
        }).catch(() => res.status(500).json({error: "No Schools Found"}));
};

module.exports = {
    find,
    getStudentsOfSchool,
    getAll
};