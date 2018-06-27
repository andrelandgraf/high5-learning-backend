"use strict";

const config = require('../config');
const HomeworkModel = require('../models/homework');
const ClassModel = require('../models/class');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

// returns the newly created homework
const create = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    let classId = req.params.id;

    HomeworkModel.create(req.body) // here you create the new homework
        .then((myHomework) => {
        if (!myHomework) throw new Error("Could not create homework");
        return ClassModel.updateOne( // here you add the created homework to the corresponding class
            {_id: classId},
            {$addToSet: {homework: myHomework}}).exec().then((updatedClass) => {
                if (updatedClass.ok !== 1) throw new Error("Could not update class");
                res.status(200).json(myHomework); // you return the created homework
            })
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

// returns the updated homework
const update = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    HomeworkModel.findById(req.params.id).exec()
        .then((homework) => {  // here you first find the to be updated homework
            if (!homework) throw new Error("Homework not found");
            return HomeworkModel.findOneAndUpdate({_id: homework}, { // then you update the homework
                $set: {
                    title: req.body.title,
                    exercises: req.body.exercises
                }
            }, {new: true}).exec()
        })
        .then((updatedHomework) => {
            if (!updatedHomework) throw new Error("Could not update homework");
            res.status(200).json(updatedHomework); // you return the updated homework
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })

};

// returns a homework with its details
const getHomeworkDetail = (req, res) => {

    let homeworkId = req.params.id;

    HomeworkModel.findById(homeworkId).exec().then((myHomework) => {
        if (!myHomework) throw new Error("Homework not found");
        res.status(200).json(myHomework); // you return the homework
    }).catch(error => {
        const err = errorHandler.handle(error.message);
        res.status(err.code).json(err);
    })

};

// returns the updated class without the to be deleted homework
const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    HomeworkModel.findById(req.params.id).exec() // first you find the to be deleted homework
        .then((homework) => {
            if (!homework) throw new Error("Homework not found");
            return SubmissionModel.remove({homework: homework}).exec().then((submission) => { // then you remove all submissions of it
                if (submission.ok !== 1) throw new Error("Could not delete submission");
                return homework;
            });
        })
        .then((homework) => { // then you delete the homework from the corresponding class
            if (!homework) throw new Error("Internal Server Error");
            return ClassModel.findOneAndUpdate({homework: homework}, {$pull: {homework: homework._id}}, {new: true}).populate('homework').exec().then((updatedClass) => {
                if (!updatedClass) throw new Error("Could not delete homework");
                return {updatedClass: updatedClass, homework: homework};
            });
        })
        .then((homeworkAndUpdatedClass) => { // then you remove the homework itself
            if (!homeworkAndUpdatedClass) throw new Error("Internal Server Error");
            return HomeworkModel.remove({_id: homeworkAndUpdatedClass.homework}).exec().then((homework) => {
                if (homework.ok !== 1) throw new Error("Could not delete homework");
                res.status(200).json(homeworkAndUpdatedClass.updatedClass); // you return the updated class
            })
        }).catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

// returns the class with the updated homework with changed visibility status
const changeVisibility = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    HomeworkModel.findById(req.params.id).exec() // first you find the homework
        .then((homework) => {
            if (!homework) throw new Error("Homework not found");
            return HomeworkModel.findOneAndUpdate({_id: homework}, {$set: {visible: req.body.desiredVisibilityStatus}}, {new: true}).exec() // then you change the visibility status
        }).then((updatedHomework) => { // then you search for the class of the homework
            if (!updatedHomework) throw new Error("Could not update homework");
            return ClassModel.findOne({homework: updatedHomework}).populate('homework').exec()})
        .then((classes) => {
            if (!classes) throw new Error("Class not found");
            res.status(200).json(classes); // then you return the updated class
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