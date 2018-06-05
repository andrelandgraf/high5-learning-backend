"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const UserModel = require('../models/user');
const ClassModel = require('../models/class');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');

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

const update = (req, res) => {

    if (req.userType !== "Teacher") {
        return res.status(403).json({
            error: "Access Denied",
            message: "You are not allowed to update a class."
        });
    }
    const passwd = req.body.title + 2018;

    ClassModel.findById(req.params.id).then((myClass) => {
        ClassModel.findOneAndUpdate({_id: myClass}, {$set: {title: req.body.title, description: req.body.description, password: passwd}}, {new: true}).then((updatedClass) => {
            res.status(200).json(updatedClass); // not quite sure about this, what should we give to the response beside the status code?
        });
    }).catch(error => {
        res.status(404).json({
            error: "Class not found",
            message: "The class could not be found!"
        });
    });
};

const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        return res.status(403).json({
            error: "Access Denied",
            message: "You are not allowed to remove a class."
        });
    }

    const classObjectId = req.params.id;

    let updatedClasses = [];

    ClassModel.findById(req.params.id).then((myClass) => {

        HomeworkModel.find({assignedClass: myClass}).then((homework) => {
            SubmissionModel.remove({homework: homework}).then();
        });
        HomeworkModel.remove({assignedClass: myClass}).then();
        UserModel.find().populate('classes').exec().then(users => {
                users.forEach(function(user) {
                    user.classes.forEach(function (c) {
                        if (String(c._id) === req.params.id) {
                            UserModel.findOneAndUpdate({_id: user}, {$pull: {classes: c}}, {new: true}).populate('classes').exec().then((n) => {
                                if(String(n._id) === req.userId) {
                                    ClassModel.remove({_id: myClass}).then(() => {
                                        res.status(200).json(n.classes);
                                    });
                                }
                            });
                        };
                    });
            });
        });
    });


};

const find = (req, res) => {

    UserModel.findById(req.userId).populate('classes', 'title description password').then(user => {

        res.status(200).json(user.classes);

    }).catch(error => {
        res.status(404).json({
            error: "User not found",
            message: "The user could not be found, so no classes can be displayed."
        });
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

const getStudentsOfClass = (req, res) => {
    const classId = req.params.id;
    console.log(classId);
    UserModel.find({classes: classId, type: "Student"}).exec().then((listOfStudents) => {
        res.status(200).json(listOfStudents);
    })
        .catch(error => {
            console.log(error);
            res.status(404).json({error: "Object not found"});
        })
}

module.exports = {
    create,
    find,
    findSingleClass,
    getInfoSingleClass,
    update,
    remove,
    getStudentsOfClass
};