"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const SchoolModel = require('../models/school');


const find = (req, res) => {
    return res.status(200).json('hallo');
};

const getStudentsOfSchool = (req, res) => {
    SchoolModel.findOne({name: req.schoolname}).populate({path:'users', model:'User'}).then((school) => {
        const students = school.users.filter(user => user.type === 'Student');
        res.status(200).json(students);
    }).catch(() => res.status(500).json({error: "Students not found"}));


};

// author: Andre Landgraf
// return ALL Schools for Register/Login
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