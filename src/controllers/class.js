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
    let newClass;

    ClassModel.create(addClass).then((myClass) => {
        newClass = myClass;
        return UserModel.findById(req.userId).exec()
    })
        .then(user => {
            user.classes.push(newClass._id);
            user.save();
            newClass.students.map(student => {
                UserModel.findById(student).then(user => {
                    user.classes.push(newClass._id);
                    user.save();
                })
            });
        })
        .then(() => res.status(200).json(newClass))
        .catch(e => {
            res.status(500).json(e);
        })

};


function updateClass(myClass, req, res) {
    return ClassModel.findOneAndUpdate({_id: myClass}, {
        $set: {
            title: req.body.title,
            description: req.body.description,
            students: req.body.students
        }
    }, {new: true}).then((updatedClass) => {
        res.status(200).json(updatedClass);
    });
}

function deleteClassForNonMember(myClass, req) {
    return UserModel.updateMany({
        _id: {$nin: req.body.students},
        type: 'Student'
    }, {$pull: {classes: myClass._id}}, {new: true}).exec().then(() => {
        return myClass;
    });
}

function addClassForNewMembers(myClass, req) {
    return UserModel.updateMany({
        _id: {$in: req.body.students},
        type: 'Student'
    }, {$addToSet: {classes: myClass}}, {new: true}).exec().then((b) => {
        return myClass;
    });
}

const update = (req, res) => {

    if (req.userType !== "Teacher") {
        return res.status(403).json({
            error: "Access Denied",
            message: "You are not allowed to update a class."
        });
    }

    ClassModel.findById(req.params.id)
        .then((myClass) => deleteClassForNonMember(myClass, req))
        .then((myClass) => addClassForNewMembers(myClass, req))
        .then((myClass) => updateClass(myClass, req, res))
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

    UserModel.findById(req.userId).populate('classes').then(user => {

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
    let mySingleClass;
    ClassModel.findById(classId).populate('homework').exec()
        .then((singleClass) => {
            mySingleClass = singleClass;
            if (singleClass) {
                return SubmissionModel.find({student: req.userId}).exec();
            } else {
                throw new Error("Class could not be found")
            }
        })
        .then((submissions) => {
            let withSubmissions = {
                singleClass: mySingleClass,
                submissions: submissions,
            };
            res.status(200).json(withSubmissions);
        }).catch((e) => {
        if (!mySingleClass) {
            res.status(200).json([]);
        } else {
            res.status(500).json({code: 500, title: "Server error", msg: e});
        }
    })
};


const findOpenHomework = (req, res) => {

    let openHw = {};
    let allHw;
    UserModel.findById(req.userId).populate('classes')
        .then(user => user.classes)
        .then((classes) => {

            return HomeworkModel.find({
                $or: classes.map(val => {
                    return {
                        assignedClass: val._id
                    };
                })
            })
        })
        .then(homework => {
            allHw = homework;
            return SubmissionModel.find({student: req.userId}, 'homework')
        })
        .then(submissions => {

            allHw.map(val => {
                if (!openHw[val.assignedClass]) {
                    openHw[val.assignedClass] = 0;
                }
                openHw[val.assignedClass] += allHw.reduce((sum, currVal) => {
                    return (val._id === currVal._id && currVal.visible) ? sum + 1 : sum + 0;
                }, 0);
            });

            submissions.map(val => {
                let classId = allHw.find(hw => (hw._id.toString() === val.homework.toString())).assignedClass;
                openHw[classId]--;
            });

            res.status(200).json(openHw);
        })
};

const getInfoSingleClass = (req, res) => {
    const classId = req.params.id;
    ClassModel.findById(classId).exec()
        .then((singleClass) => {
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
    ClassModel.findById(classId).select('students').populate('students').exec()
        .then((listOfStudents) => {
            res.status(200).json(listOfStudents.students);
        })
        .catch(error => {
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
    getStudentsOfClass,
    findOpenHomework
};