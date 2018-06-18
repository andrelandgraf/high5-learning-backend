"use strict";

const UserModel = require('../models/user');
const ClassModel = require('../models/class');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

const create = (req, res) => {

    if (req.userType !== "Teacher") throw new Error("Not authorized");

    const addClass = Object.assign(req.body);
    let newClass;

    ClassModel.create(addClass)
        .then((myClass) => {
            newClass = myClass;
            return UserModel.findById(req.userId).exec()
        })
        .then(user => {
            if (!user) throw new Error("User not found");
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
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })

};

// Returns an array of all classes including their homework
const getAllHomework = (req, res) => {

    if (req.userType !== "Teacher") throw new Error("Not authorized");

    UserModel.findById(req.userId).populate('classes').select('classes').exec()
        .then((classes) => {
            if(!classes) throw new Error('Classes not found');
            return ClassModel.find({_id: classes.classes}).select('homework _id title').populate('homework')
        })
        .then((homework) => {
            if(!homework) throw new Error('No homework found');
            res.status(200).json(homework);
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
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

// Returns an array of all classes a user is assigned to.
const find = (req, res) => {

    UserModel.findById(req.userId).populate('classes').then(user => {
        if (!user) throw new Error("User not found");
        res.status(200).json(user.classes);

    }).catch(error => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    });

};

// This method is invoked when displaying the class details (i.e. the homework of this class)
const findHomeworkOfClass = (req, res) => {
    const classId = req.params.id;
    let mySingleClass;
    ClassModel.findById(classId).populate('homework').exec()
        .then((singleClass) => {
            mySingleClass = singleClass;
            if (!singleClass) throw new Error("Class not found");
            return SubmissionModel.find({student: req.userId}).exec();
        })
        .then((submissions) => {
            if (!submissions) throw new Error("No submission found");
            let withSubmissions = {
                singleClass: mySingleClass,
                submissions: submissions,
            };
            res.status(200).json(withSubmissions);
        })
        .catch((e) => {
            if (!mySingleClass) {
                res.status(200).json([]);
            } else {
                const err = errorHandler.handle(e.message);
                res.status(err.code).json(err);
            }
        })
};

// This method checks if there are homework for all classes of a student that are not submitted yet.
const findOpenHomework = (req, res) => {

    let openHw = {};
    let allHw = [];
    UserModel.findById(req.userId).populate('classes')
        .then(user => {
            if (!user) throw new Error("User not found");
            return user.classes;
        })
        .then((classes) => {
            if (!classes) throw new Error("Classes not found");
            if (classes.length === 0) return [];
            return HomeworkModel.find({
                $or: classes.map(val => {
                    return {
                        assignedClass: val._id
                    };
                })
            })

        })
        .then(homework => {
            if (!homework) throw new Error("No homework found");
            if (homework.length === 0) return [];
            allHw = homework;
            return SubmissionModel.find({student: req.userId}, 'homework')
        })
        .then(submissions => {
            if (!submissions) throw new Error("No submission found");
            allHw.map(val => {
                if (!openHw[val.assignedClass]) {
                    openHw[val.assignedClass] = 0;
                }
                openHw[val.assignedClass] += allHw.reduce((sum, currVal) => {
                    return (val._id === currVal._id && currVal.visible) ? sum + 1 : sum + 0;
                }, 0);
            });
            if (submissions.length > 0) {
                submissions.map(val => {
                    let classId = allHw.find(hw => (hw._id.toString() === val.homework.toString())).assignedClass;
                    openHw[classId]--;
                });
            }

            res.status(200).json(openHw);
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

// Returns all students that are assigned to a specific class.
const getStudentsOfClass = (req, res) => {
    if (req.userType === 'Student') throw new Error('Not authorized');
    const classId = req.params.id;
    ClassModel.findById(classId).select('students').populate('students').exec()
        .then((listOfStudents) => {
            res.status(200).json(listOfStudents.students);
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

module.exports = {
    create,
    find,
    findHomeworkOfClass,
    update,
    remove,
    getStudentsOfClass,
    findOpenHomework,
    getAllHomework
};