"use strict";

const UserModel = require('../models/user');
const ClassModel = require('../models/class');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

/**
 * function create: returns the newly created class
 * and adds the submitted students list as members
 * also the teacher who created this class will gain membership
 * @param req
 * @param res
 * @returns {*}
 */
const create = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

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

/**
 * function getAllHomework:
 * returns an array of all classes including their homework
 * @param req
 * @param res
 * @returns {*}
 */
const getAllHomework = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    UserModel.findById(req.userId).populate('classes').select('classes').exec()
        .then((classes) => { // first you search for the classes of the teacher
            if (!classes) throw new Error('User not found');
            return ClassModel.find({_id: classes.classes}).select('homework _id title').populate('homework').exec() // then you search for all homework inside the classes
        })
        .then((homework) => {
            if (!homework) throw new Error('Class not found');
            res.status(200).json(homework); // here you return the all classes with their homework
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

/**
 * function update:
 * update a class
 * return the updated class
 * @param req
 * @param res
 * @returns {*}
 */
const update = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    ClassModel.findById(req.params.id).exec()
    // first you find the to be updated class
        .then((myClass) => {
            if (!myClass) throw new Error("Class not found");
            // then you remove the class from all users who are not members of the updated class
            return UserModel.updateMany({
                _id: {$nin: req.body.students},
                type: 'Student'
            }, {$pull: {classes: myClass._id}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Could not update class");
                return myClass;
            });
        })

        // here you add the class for the members of the class
        .then((myClass) => {
            if (!myClass) throw new Error("Class not found");
            return UserModel.updateMany({
                _id: {$in: req.body.students},
                type: 'Student'
            }, {$addToSet: {classes: myClass}}).exec().then((updatedUsers) => {
                if (updatedUsers.ok !== 1) throw new Error("Could not update class");
                return myClass;
            });
        })

        // here you update the class itself
        .then((myClass) => {
            if (!myClass) throw new Error("Class not found");
            return ClassModel.findOneAndUpdate({_id: myClass}, {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    students: req.body.students
                }
            }, {new: true}).exec()
        })

        .then((updatedClass) => {
            if (!updatedClass) throw new Error("Could not update class");
            // here you return the updated class
            res.status(200).json(updatedClass);
        })

        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

/**
 * function remove:
 * delete the class from the db
 * returns the classes of the teacher without the to be removed class
 * @param req
 * @param res
 * @returns {*}
 */
const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    // first you find the to be removed class
    ClassModel.findById(req.params.id).exec()
        .then((myClass) => {
            if (!myClass) throw new Error("Class not found");
            // here you get the corresponding homework for the class
            return HomeworkModel.find({assignedClass: myClass}).exec().then((homework) => {
                if (!homework) throw new Error("Homework not found");
                return {myClass: myClass, homework: homework};
            });
        })
        // here the submissions for the class get deleted
        .then((classAndHomework) => {
            if (!classAndHomework) throw new Error("Internal Server Error");
            return SubmissionModel.remove({homework: classAndHomework.homework}).exec().then((submission) => {
                if (submission.ok !== 1) throw new Error("Could not delete submission");
                return {myClass: classAndHomework.myClass, homework: classAndHomework.homework};
            });
        })
        // here the homework for the class get deleted
        .then((classAndHomework) => {
            if (!classAndHomework) throw new Error("Internal Server Error");
            return HomeworkModel.remove({assignedClass: classAndHomework.myClass}).exec().then((homework) => {
                if (homework.ok !== 1) throw new Error("Could not delete homework");
                return classAndHomework.myClass;
            })
        })

        // here you get all the users for the class
        .then((myClass) => {
            if (!myClass) throw new Error("Internal Server Error");
            return UserModel.find({classes: myClass}).exec().then((users) => {
                if (!users) throw new Error("User not found");
                return {myClass: myClass, users: users};
            });
        })

        // here you delete the class for all users of the class
        .then((myClassAndUsers) => {
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

        // here you find the updated classes of the user
        .then((c) => {
            if (c.ok !== 1) throw new Error("Could not delete class");
            return UserModel.findOne({_id: req.userId}).populate('classes').exec()
        })

        // here you return the updated class
        .then((user) => {
            if (!user) throw new Error("User not found");
            res.status(200).json(user.classes); // here you return the updated classes
        })

        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

/**
 * function find:
 * returns an array of all classes a user is assigned to
 * @param req
 * @param res
 */
const find = (req, res) => {

    UserModel.findById(req.userId).populate('classes').then(user => {
        if (!user) throw new Error("User not found");
        res.status(200).json(user.classes);

    }).catch(error => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    });

};

/**
 * function findHomeworkOfClass:
 * is invoked when displaying the class details (i.e. the homework of this class)
 * @param req
 * @param res
 */
const findHomeworkOfClass = (req, res) => {
    const classId = req.params.id;
    let mySingleClass;
    // first you find the class
    ClassModel.findById(classId).populate('homework').exec()
        .then((singleClass) => {
            if (!singleClass) throw new Error("Class not found");
            mySingleClass = singleClass;
            // then you search for the submissions of the class
            return SubmissionModel.find({student: req.userId}).exec();
        })
        .then((submissions) => {
            if (!submissions) throw new Error("Submission not found");
            let withSubmissions = {
                singleClass: mySingleClass,
                submissions: submissions,
            };
            // here you return the class with the homework and submissions
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

/**
 * function findOpenHomework checks if there are homework for all classes of a student that are not submitted yet.
 * @param req
 * @param res
 */
const findOpenHomework = (req, res) => {

    let openHw = {};
    let allHw = [];
    UserModel.findById(req.userId).populate('classes').exec()
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
                , visible: 'true'
            }).exec()

        })

        .then(homework => {
            if (!homework) throw new Error("Homework not found");
            if (homework.length === 0) return [];
            allHw = homework;
            return SubmissionModel.find({homework: {$in: homework}, student: req.userId}, 'homework').exec()
        })

        .then(submissions => {
            if (!submissions) throw new Error("Submission not found");
            allHw.map(val => {
                if (!openHw[val.assignedClass]) {
                    openHw[val.assignedClass] = 0;
                }
                openHw[val.assignedClass] += allHw.reduce((sum, currVal) => {
                    return (val._id === currVal._id) ? sum + 1 : sum + 0;
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

/**
 * function getStudentOfClass: returns all students that are assigned to a specific class.
 * @param req
 * @param res
 * @returns {*}
 */
const getStudentsOfClass = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

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