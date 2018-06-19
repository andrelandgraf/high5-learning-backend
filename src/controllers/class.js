"use strict";

const UserModel = require('../models/user');
const ClassModel = require('../models/class');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

// returns the newly created class
const create = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    const addClass = Object.assign(req.body);
    let newClass;

    ClassModel.create(addClass)
        .then((myClass) => { // first you create the class
            if (!myClass) throw new Error("Could not create class");
            newClass = myClass;
            return UserModel.findById(req.userId).exec()
        })
        .then(user => { // then you search for the teacher who created the class
            if (!user) throw new Error("User not found!");
            return UserModel.updateOne({ // the teacher gets the created class assigned
                _id: user,
                type: 'Teacher'
            }, {$addToSet: {classes: newClass}}).exec()
        })
        .then((updatedUser) => {
            if (updatedUser.ok !== 1) throw new Error("Could not create class");
            return UserModel.updateMany({ // the students of the created class get the class assigned
                _id: {$in: newClass.students},
                type: 'Student'
            }, {$addToSet: {classes: newClass}}).exec()
        })
        .then((updatedUsers) => {
            if (updatedUsers.ok !== 1) throw new Error("Could not create class");
            res.status(200).json(newClass) // here you return the newly created class
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })

};

// returns an array of all classes including their homework
const getAllHomework = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    UserModel.findById(req.userId).populate('classes').select('classes').exec()
        .then((classes) => { // first you search for the classes of the teacher
            if(!classes) throw new Error('User not found');
            return ClassModel.find({_id: classes.classes}).select('homework _id title').populate('homework') // then you search for all homework inside the classes
        })
        .then((homework) => {
            if(!homework) throw new Error('Class not found');
            res.status(200).json(homework); // here you return the all classes with their homework
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};
// return the updated class
const update = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    ClassModel.findById(req.params.id)
        .then((myClass) => { // first you find the to be updated class
            if (!myClass) throw new Error("Class not found");
            return UserModel.updateMany({ // then you remove the class from all users who are not members of the updated class
                _id: {$nin: req.body.students},
                type: 'Student'
            }, {$pull: {classes: myClass._id}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Could not update class");
                return myClass;
            });
        })
        .then((myClass) => { // here you add the class for the members of the class
            if (!myClass) throw new Error("Class not found");
            return UserModel.updateMany({
                _id: {$in: req.body.students},
                type: 'Student'
            }, {$addToSet: {classes: myClass}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Could not update class");
                return myClass;
            });
        })
        .then((myClass) => { // here you update the class itelf
            if (!myClass) throw new Error("Class not found");
            return ClassModel.findOneAndUpdate({_id: myClass}, {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    students: req.body.students
                }
            }, {new: true}).exec()})
        .then((updatedClass) => {
                if (!updatedClass) throw new Error("Could not update class");
                res.status(200).json(updatedClass); // here you return the updated class
            })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

// returns the classes of the teacher without the to be removed class
const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    ClassModel.findById(req.params.id) // first you find the to be removed class
        .then((myClass) => {
            if (!myClass) throw new Error("Class not found");
            return HomeworkModel.find({assignedClass: myClass}).exec().then((homework) => { // here you get the corresponding homework for the class
                if (!homework) throw new Error("Homework not found");
                return {myClass: myClass, homework: homework};
            });
        })
        .then((classAndHomework) => { // here the submissions for the class get deleted
            if (!classAndHomework) throw new Error("Internal Server Error");
            return SubmissionModel.remove({homework: classAndHomework.homework}).exec().then((submission) => {
                if (submission.ok !== 1) throw new Error("Could not delete submission");
                return {myClass: classAndHomework.myClass, homework: classAndHomework.homework};
            });
        })
        .then((classAndHomework) => { // here the homework for the class get deleted
            if (!classAndHomework) throw new Error("Internal Server Error");
            return HomeworkModel.remove({assignedClass: classAndHomework.myClass}).exec().then((homework) => {
                if (homework.ok !== 1) throw new Error("Could not delete homework");
                return classAndHomework.myClass;
            })
        })
        .then((myClass) => { // here you get all the users for the class
            if (!myClass) throw new Error("Internal Server Error");
            return UserModel.find({classes: myClass}).exec().then((users) => {
                if (!users) throw new Error("User not found");
                return {myClass: myClass, users: users};
            });
        })
        .then((myClassAndUsers) => { // here you delete the class for all users of the class
            if (!myClassAndUsers) throw new Error("Internal Server Error");
            return UserModel.updateMany({_id: {$in: myClassAndUsers.users}}, {$pull: {classes: myClassAndUsers.myClass._id}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Could not delete homework");
                return myClassAndUsers.myClass;
            });
        })
        .then((myClass) => { // here you delete the class
            if (!myClass) throw new Error("Internal Server Error");
            return ClassModel.remove({_id: myClass}).exec()
        })
        .then((c) => { // here you find the updated classes of the user
            if (c.ok !== 1) throw new Error("Could not delete class");
            return UserModel.findOne({_id: req.userId}).populate('classes').exec()
        })
        .then((user) => { // here you return the updated class
                if (!user) throw new Error("User not found");
                res.status(200).json(user.classes); // here you return the updated classes
        }).catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

// returns an array of all classes a user is assigned to
const find = (req, res) => {

    UserModel.findById(req.userId).populate('classes').then(user => {
        if (!user) throw new Error("User not found");
        res.status(200).json(user.classes);

    }).catch(error => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    });

};

// this method is invoked when displaying the class details (i.e. the homework of this class)
const findHomeworkOfClass = (req, res) => {
    const classId = req.params.id;
    let mySingleClass;
    ClassModel.findById(classId).populate('homework').exec() // first you find the class
        .then((singleClass) => {
            if (!singleClass) throw new Error("Class not found");
            mySingleClass = singleClass;
            return SubmissionModel.find({student: req.userId}).exec(); // then you search for the submissions of the class
        })
        .then((submissions) => {
            if (!submissions) throw new Error("Submission not found");
            let withSubmissions = {
                singleClass: mySingleClass,
                submissions: submissions,
            };
            res.status(200).json(withSubmissions); // here you return the class with the homework and submissions
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

// this method checks if there are homework for all classes of a student that are not submitted yet.
const findOpenHomework = (req, res) => {

    let openHw = {};
    let allHw = [];
    UserModel.findById(req.userId).populate('classes')
        .then(user => {
            if (!user) throw new Error("User not found");
            return user.classes;
        })
        .then((classes) => {
            if (!classes) throw new Error("Class not found");
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
            if (!homework) throw new Error("Homework not found");
            if (homework.length === 0) return [];
            allHw = homework;
            return SubmissionModel.find({student: req.userId}, 'homework')
        })
        .then(submissions => {
            if (!submissions) throw new Error("Submission not found");
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

// returns all students that are assigned to a specific class.
const getStudentsOfClass = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    const classId = req.params.id;
    ClassModel.findById(classId).select('students').populate('students').exec()
        .then((listOfStudents) => {
            if (!listOfStudents) throw new Error("Class not found");
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