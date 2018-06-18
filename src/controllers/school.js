"use strict";

const SchoolModel = require('../models/school');
const errorHandler = require('../error');

const getStudentsOfSchool = (req, res) => {
    SchoolModel.findOne({name: req.schoolname}).populate({path: 'users', model: 'User'}).then((school) => {
        if (!school) throw new Error("School not found");
        const students = school.users.filter(user => user.type === 'Student');
        res.status(200).json(students);
    }).catch((error) => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    });


};

// author: Andre Landgraf
// return ALL Schools for Register/Login
const getAll = (req, res) => {
    SchoolModel.find().then((schools) => {
        if (!schools) throw new Error("Schools not found");
        res.status(200).json(schools);
    }).catch((error) => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    });
};

module.exports = {
    getStudentsOfSchool,
    getAll
};