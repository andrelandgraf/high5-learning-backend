"use strict";

const config = require('../config');
const HomeworkModel = require('../models/homework');
const ClassModel = require('../models/class');
const SubmissionModel = require('../models/submission');
const errorHandler = require('../error');

/**
 * function create:
 * insert a new homework to this class
 * returns the newly created homework
 * @param req
 * @param res
 * @returns {*}
 */
const create = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    let classId = req.params.id;

    // here you create the new homework
    HomeworkModel.create(req.body)
        .then((myHomework) => {
            if (!myHomework) throw new Error("Could not create homework");
            // here you add the created homework to the corresponding class
            return ClassModel.updateOne(
                {_id: classId},
                {$addToSet: {homework: myHomework}}).exec().then((updatedClass) => {
                if (updatedClass.ok !== 1) throw new Error("Could not update class");
                // you return the created homework
                res.status(200).json(myHomework);
            })
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

/**
 * function update:
 * update the homework information
 * returns the updated homework
 * @param req
 * @param res
 * @returns {*}
 */
const update = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    HomeworkModel.findById(req.params.id).exec()
    // here you first find the to be updated homework
        .then((homework) => {
            if (!homework) throw new Error("Homework not found");
            // then you update the homework
            return HomeworkModel.findOneAndUpdate({_id: homework}, {
                $set: {
                    title: req.body.title,
                    exercises: req.body.exercises
                }
            }, {new: true}).exec()
        })
        .then((updatedHomework) => {
            if (!updatedHomework) throw new Error("Could not update homework");
            // return the updated homework
            res.status(200).json(updatedHomework);
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })

};

/**
 * function getHomeworkDetail:
 * returns a homework with its details
 * @param req
 * @param res
 */
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

/**
 * function remove:
 * deletes the current homework
 * returns the updated class without the to be deleted homework
 * @param req
 * @param res
 * @returns {*}
 */
const remove = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    HomeworkModel.findById(req.params.id).exec()

    // first you find the to be deleted homework
        .then((homework) => {
            if (!homework) throw new Error("Homework not found");
            return SubmissionModel.remove({homework: homework}).exec().then((submission) => { // then you remove all submissions of it
                if (submission.ok !== 1) throw new Error("Could not delete submission");
                return homework;
            });
        })

        // then you delete the homework from the corresponding class
        .then((homework) => {
            if (!homework) throw new Error("Internal Server Error");
            return ClassModel.findOneAndUpdate({homework: homework}, {$pull: {homework: homework._id}}, {new: true}).populate('homework').exec().then((updatedClass) => {
                if (!updatedClass) throw new Error("Could not delete homework");
                return {updatedClass: updatedClass, homework: homework};
            });
        })

        // then you remove the homework itself
        .then((homeworkAndUpdatedClass) => {
            if (!homeworkAndUpdatedClass) throw new Error("Internal Server Error");
            return HomeworkModel.remove({_id: homeworkAndUpdatedClass.homework}).exec().then((homework) => {
                if (homework.ok !== 1) throw new Error("Could not delete homework");
                res.status(200).json(homeworkAndUpdatedClass.updatedClass); // you return the updated class
            })
        })

        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        })
};

/**
 * function changeVisibility
 * change visibility true <-> false
 * returns the class with the updated homework with changed visibility status
 * @param req
 * @param res
 * @returns {*}
 */
const changeVisibility = (req, res) => {

    if (req.userType !== "Teacher") {
        let err = errorHandler.handle("Not authorized");
        return res.status(err.code).json(err);
    }

    // first you find the homework
    HomeworkModel.findById(req.params.id).exec()
        .then((homework) => {
            if (!homework) throw new Error("Homework not found");
            return HomeworkModel.findOneAndUpdate({_id: homework}, {$set: {visible: req.body.desiredVisibilityStatus}}, {new: true}).exec() // then you change the visibility status
        })

        // then you search for the class of the homework
        .then((updatedHomework) => {
            if (!updatedHomework) throw new Error("Could not update homework");
            return ClassModel.findOne({homework: updatedHomework}).populate('homework').exec()
        })

        // then you return the updated class
        .then((classes) => {
            if (!classes) throw new Error("Class not found");
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