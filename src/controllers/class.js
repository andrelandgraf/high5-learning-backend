"use strict";

const UserModel = require('../models/user');
const ClassModel = require('../models/class');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

// here you create a new class
const create = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    const addClass = Object.assign(req.body);
    let newClass;

    ClassModel.create(addClass)
        .then((myClass) => {
            if (!myClass) throw new Error("Class not created!"); // this error is impossible to trigger I guess
            newClass = myClass;
            return UserModel.findById(req.userId).exec()
        })
        .then(user => {
            if (!user) throw new Error("User not found!");
            return UserModel.updateOne({ // the teacher gets the created class assigned
                _id: user,
                type: 'Teacher'
            }, {$addToSet: {classes: newClass}}).exec()
        })
        .then((updatedUser) => {
            if (updatedUser.ok !== 1) throw new Error("Class not added to teacher!");
            return UserModel.updateMany({ // the students of the created class get the class assigned
                _id: {$in: newClass.students},
                type: 'Student'
            }, {$addToSet: {classes: newClass}}).exec()
        })
        .then((updatedUsers) => {
            if (updatedUsers.ok !== 1) throw new Error("Class not added to students!");
            res.status(200).json(newClass)
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })

};

// Returns an array of all classes including their homework
const getAllHomework = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

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
// here you update a class
const update = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    ClassModel.findById(req.params.id)
        .then((myClass) => { // here you delete the class for non members of the class
            if (!myClass) throw new Error("Class not found!");
            return UserModel.updateMany({
                _id: {$nin: req.body.students},
                type: 'Student'
            }, {$pull: {classes: myClass._id}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Class not deleted from non members!");
                return myClass;
            });
        })
        .then((myClass) => { // here you add the class for the members of the class
            if (!myClass) throw new Error("Class not found!");
            return UserModel.updateMany({
                _id: {$in: req.body.students},
                type: 'Student'
            }, {$addToSet: {classes: myClass}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Class not added to new members!");
                return myClass;
            });
        })
        .then((myClass) => { // here you update the class itelf
            if (!myClass) throw new Error("Class not found!");
            return ClassModel.findOneAndUpdate({_id: myClass}, {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    students: req.body.students
                }
            }, {new: true}).then((updatedClass) => {
                if (!updatedClass) throw new Error("Class not updated!");
                res.status(200).json(updatedClass);
            });
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};
// here you remove a class
const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    ClassModel.findById(req.params.id)
        .then((myClass) => { // here you get the corresponding homework for the class
            if (!myClass) throw new Error("Class not found!");
            return HomeworkModel.find({assignedClass: myClass}).exec().then((homework) => {
                if (!homework) throw new Error("Homework not found!");
                return {myClass: myClass, homework: homework};
            });
        })
        .then((classAndHomework) => { // here the submissions for the class get deleted
            if (!classAndHomework) throw new Error("Internal Server Error"); // rethink...
            return SubmissionModel.remove({homework: classAndHomework.homework}).exec().then((submission) => {
                if (submission.ok !== 1) throw new Error("Submissions couldn't be deleted!");
                return {myClass: classAndHomework.myClass, homework: classAndHomework.homework};
            });
        })
        .then((classAndHomework) => { // here the homework for the class get deleted
            if (!classAndHomework) throw new Error("Internal Server Error"); // rethink...
            return HomeworkModel.remove({assignedClass: classAndHomework.myClass}).exec().then((homework) => {
                if (homework.ok !== 1) throw new Error("Homework couldn't be deleted!");
                return classAndHomework.myClass;
            })
        })
        .then((myClass) => { // here you get all the users for the class
            if (!myClass) throw new Error("Class not found!");
            return UserModel.find({classes: myClass}).exec().then((users) => {
                if (!users) throw new Error("Users not found!");
                return {myClass: myClass, users: users};
            });
        })
        .then((myClassAndUsers) => { // here you delete the class for all users of the class
            if (!myClassAndUsers) throw new Error("Internal Server Error"); // rethink...
            return UserModel.updateMany({_id: {$in: myClassAndUsers.users}}, {$pull: {classes: myClassAndUsers.myClass._id}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Classes of users couldn't be deleted!");
                return myClassAndUsers.myClass;
            });
        })
        .then((myClass) => { // here you delete the class
            if (!myClass) throw new Error("Class not found!");
            return ClassModel.remove({_id: myClass}).exec()
        })
        .then((c) => { // here you find the updated classes of the user
            if (c.ok !== 1) throw new Error("Class couldn't be deleted!");
            return UserModel.findOne({_id: req.userId}).populate('classes').exec()
        })
        .then((user) => { // here you return the updated class
                if (!user) throw new Error("User not found!");
                res.status(200).json(user.classes);
            })
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
            if (!singleClass) throw new Error("Class not found");
            mySingleClass = singleClass;
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

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

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