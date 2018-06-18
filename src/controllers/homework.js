"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const HomeworkModel = require('../models/homework');
const ClassModel = require('../models/class');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

const create = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    let classId = req.params.id;

    HomeworkModel.create(req.body)
        .then((myHomework) => {
        if (!myHomework) throw new Error("Homework couldn't be created!")
        return ClassModel.updateOne(
            {_id: classId},
            {$addToSet: {homework: myHomework}}).exec().then((updatedClass) => {
                if (updatedClass.ok !== 1) throw new Error("Homework not added to class!");
                res.status(200).json(myHomework);
            })
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

const update = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    };

    HomeworkModel.findById(req.params.id)
        .then((homework) => {  // here you update the homework
            if (!homework) throw new Error("Homework couldn't be found!")
            return HomeworkModel.findOneAndUpdate({_id: homework}, {
                $set: {
                    title: req.body.title,
                    exercises: req.body.exercises
                }
            }, {new: true})
        })
        .then((updatedHomework) => {
            if (!updatedHomework) throw new Error("Homework couldn't be updated!")
            res.status(200).json(updatedHomework);
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })

};

const getHomeworkDetail = (req, res) => {

    let homeworkId = req.params.id;

    HomeworkModel.findById(homeworkId).exec().then((myHomework) => {
        if (!myHomework) throw new Error("Homework not found!")
        res.status(200).json(myHomework);
    }).catch(error => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    })

};

const remove = (req, res) => {
    HomeworkModel.findById(req.params.id)
        .then((homework) => {
            if (!homework) throw new Error("Homework not found!");
            return SubmissionModel.remove({homework: homework}).exec().then((submission) => {
                if (submission.ok !== 1) throw new Error("Submission couldn't be deleted!");
                return homework;
            });
        })
        .then((homework) => {
            if (!homework) throw new Error("Homework not found!");
            return ClassModel.findOneAndUpdate({homework: homework}, {$pull: {homework: homework._id}}, {new: true}).populate('homework').exec().then((updatedClass) => {
                if (!updatedClass) throw new Error("Homework couldn't be deleted from class!");
                return {updatedClass: updatedClass, homework: homework};
            });
        })
        .then((homeworkAndUpdatedClass) => {
            if (!homeworkAndUpdatedClass) throw new Error("Homework and updated class not found");
            return HomeworkModel.remove({_id: homeworkAndUpdatedClass.homework}).exec().then((homework) => {
                if (homework.ok !== 1) throw new Error("Homework couldn't be deleted!");
                res.status(200).json(homeworkAndUpdatedClass.updatedClass);
            })
        }).catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

const changeVisibility = (req, res) => {
    HomeworkModel.findById(req.params.id)
        .then((homework) => {
            if (!homework) throw new Error("Homework not found");
            return HomeworkModel.findOneAndUpdate({_id: homework}, {$set: {visible: req.body.desiredVisibilityStatus}}, {new: true}).exec()
        }).then((updatedHomework) => {
            if (!updatedHomework) throw new Error("Homework couldn't be updated");
            return ClassModel.findOne({homework: updatedHomework}).populate('homework').exec()})
        .then((classes) => {
            if (!classes) throw new Error("Class couldn't be found");
            res.status(200).json(classes);
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};


module.exports = {
    create,
    getHomeworkDetail,
    remove,
    changeVisibility,
    update
};