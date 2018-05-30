"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const UserModel = require('../models/user');
const ClassModel = require('../models/class');
const HomeworkModel = require('../models/homework');


const list = (req, res) => {

    ClassModel.find().exec()
        .then(classes => {
            res.status(200).json(classes);
        }).catch((error) => {
        res.status(500).json(error);
    });

};

const create = (req, res) => {

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

    }).catch(error => console.log("Error in ClassController (find): " + error));

};

const findSingleClass = (req, res) => {
    console.log(req.body);
    const classId = req.body.id;
    HomeworkModel.find({id: classId}).then(
        (homeworkList) => {
            res.status(200).json(homeworkList);
        }
    );

};

module.exports = {
    list,
    create,
    find,
    findSingleClass
};