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
    const classId = req.params.id;
    ClassModel.findById(classId).populate('homework').exec()
        .then((singleClass) => {
            console.log(singleClass);
            if(singleClass) {
                res.status(200).json(singleClass);
            } else {
                res.status(200).json([]);
            }
        }
    );

};

/*const getHomeworkOfClass = (req, res) => {

    if (!Object.prototype.hasOwnProperty.call(req.params, 'id'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a id property for the homework'
        });


    ClassModel.findById(req.params.id).exec().then((myClass) => {

        const allHomework = [...myClass.homework];

        HomeworkModel.find().exec().then(homework => {
            const allHw= homework.filter((hw) => {
                return allHomework.includes(hw._id);
            });
            res.status(200).json(allHw);
        })

    });
};*/

module.exports = {
    list,
    create,
    find,
    findSingleClass
};