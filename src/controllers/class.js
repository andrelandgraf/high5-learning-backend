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


    const addClass = Object.assign(req.body);

    ClassModel.create(addClass).then((myClass) => {
        UserModel.findById(req.userId).exec().then(user => {
            user.classes.push(myClass._id);
            user.save();
        });

        myClass.students.map(student => {
            UserModel.findById(student).then(user => {
                user.classes.push(myClass._id);
                user.save();
            })
        });

        res.status(200).json(myClass);
    });
};

function updateClass(myClass, req, res, passwd) {
    return ClassModel.findOneAndUpdate({_id: myClass}, {$set: {title: req.body.title, description: req.body.description, password: passwd}}, {new: true}).then((updatedClass) => {
        res.status(200).json(updatedClass); // not quite sure about this, what should we give to the response beside the status code?

    });
}

const update = (req, res) => {

    if (req.userType !== "Teacher") {
        return res.status(403).json({
            error: "Access Denied",
            message: "You are not allowed to update a class."
        });
    }
    const passwd = req.body.title + 2018;

    ClassModel.findById(req.params.id)
        .then((myClass) => updateClass(myClass, req, res, passwd))
        .catch(error => {
            res.status(404).json({
                error: "Class not found",
                message: "The class could not be found!"
            });
        });
};

function getHomework(myClass) {
    return HomeworkModel.find({assignedClass: myClass}).exec().then((homework) => {
        return {myClass: myClass, homework: homework};
    });
}
function removeSubmission(classAndHomework) {
    return SubmissionModel.remove({homework: classAndHomework.homework}).exec().then(() => {
        return {myClass: classAndHomework.myClass, homework: classAndHomework.homework};
    });
}
function removeHomework(classAndHomework) {
    return HomeworkModel.remove({assignedClass: classAndHomework.myClass}).exec().then(() => {
        return classAndHomework.myClass;
    })
}

function getAllUsers(myClass) {
    return UserModel.find({classes: myClass}).exec().then((users) => {
        return {myClass: myClass, users: users};
    });
}

function deleteClassOfUsers(myClassAndUsers) {
    return UserModel.updateMany({_id: {$in: myClassAndUsers.users}}, {$pull: {classes: myClassAndUsers.myClass._id}}, {new: true}).exec().then(() => {
        return myClassAndUsers.myClass;
    });
}

function deleteClass(myClass) {
    return ClassModel.remove({_id: myClass}).exec();
}

function getUpdatedClass(req, res) {
    return UserModel.findOne({_id: req.userId}).populate('classes').exec().then((user) => {
        res.status(200).json(user.classes);
    })
}

const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        return res.status(403).json({
            error: "Access Denied",
            message: "You are not allowed to remove a class."
        });
    }

    ClassModel.findById(req.params.id)
        .then((myClass) => getHomework(myClass))
        .then((classAndHomework) => removeSubmission(classAndHomework))
        .then((classAndHomework) => removeHomework(classAndHomework))
        .then((myClass) => getAllUsers(myClass))
        .then((myClassAndUsers) => deleteClassOfUsers(myClassAndUsers))
        .then((myClass) => deleteClass(myClass))
        .then(() => getUpdatedClass(req, res));

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
};

module.exports = {
    create,
    find,
    findSingleClass,
    getInfoSingleClass,
    update,
    remove,
    getStudentsOfClass
};