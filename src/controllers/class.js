"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const UserModel = require('../models/user');
const ClassModel = require('../models/class');

const create = (req, res) => {

    if (req.userType !== "Teacher") {
        return res.status(403).json({
            error: "Access Denied",
            message: "You are not allowed to create a new class."
        });
    }


    const passwd = req.body.title + 2018;

    const addClass = Object.assign(req.body, {password: passwd});

    ClassModel.create(addClass).then((myClass) => {
        UserModel.findById(req.userId).exec().then(user => {
            user.classes.push(myClass._id);
            user.save();
        });

        res.status(200).json(myClass);
    });
};

const find = (req, res) => {

    UserModel.findById(req.userId).populate('classes', 'title description password').then(user => {

        res.status(200).json(user.classes);

    }).catch(error => {
        console.log("Error in ClassController (find): " + error);
        res.status(404).json({error: "User not found"});
    });

};

const findSingleClass = (req, res) => {
    const classId = req.params.id;
    ClassModel.findById(classId).populate('homework').exec()
        .then((singleClass) => {
                if (singleClass) {
                    res.status(200).json(singleClass);
                } else {
                    res.status(200).json([]);
                }
            }
        );

};

const getInfoSingleClass = (req, res) => {
    const classId = req.params.id;
    ClassModel.findById(classId).exec().then((singleClass) => {
                if (singleClass) {
                    res.status(200).json(singleClass);
                } else {
                    res.status(200).json([]);
                }
            }
        );

};

module.exports = {
    create,
    find,
    findSingleClass,
    getInfoSingleClass
};