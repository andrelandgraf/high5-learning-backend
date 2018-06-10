"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const HomeworkModel = require('../models/homework');
const ClassModel = require('../models/class');
const SubmissionModel = require('../models/submission');

const create = (req, res) => {

    if(req.userType !== "Teacher") return res.status(403).json({
        error: "Access denied",
        message: "You have to be a teacher in order to create new homework."
    });

    let classId = req.params.id;

    HomeworkModel.create(req.body).then((myHomework) => {
        ClassModel.findById(classId).exec().then((myClass) => {

            myClass.homework.push(myHomework);
            myClass.save();
            res.status(200).json(myHomework);
        })

    });
};

function updateHomework(homework, infoToUpdate, res) {
    console.log(homework);
    HomeworkModel.findOneAndUpdate({_id: homework}, {$set: {title: infoToUpdate.title, exercises: infoToUpdate.exercises}}, {new: true})
        .then((updatedHomework) => {
            res.status(200).json(updatedHomework);
        });
};

const update = (req, res) => {

    if(req.userType !== "Teacher") return res.status(403).json({
        error: "Access denied",
        message: "You have to be a teacher in order to update a homework."
    });

    HomeworkModel.findById(req.params.id)
        .then((homework) => updateHomework(homework, req.body, res));

};

const getHomeworkDetail = (req, res) => {

    let homeworkId = req.params.id;

    HomeworkModel.findById(homeworkId).exec().then((myHomework) => {
        res.status(200).json(myHomework);
    }).catch(error => {
        console.log(error);
        res.status(404).json({error: "Object not found"});
    })

};

function removeSubmissions(homework) {
    return SubmissionModel.remove({homework: homework}).exec().then(() => {
        return homework;
    });
}
function removeHomeworkFromClass(homework) {
    return ClassModel.findOneAndUpdate({homework: homework}, {$pull: {homework: homework._id}}, {new: true}).populate('homework').exec().then((updatedClass) => {
        return {updatedClass: updatedClass, homework: homework};
    });
}
function removeHomework(homeworkAndUpdatedClass, res) {
    return HomeworkModel.remove({_id: homeworkAndUpdatedClass.homework}).exec().then(() => {
        res.status(200).json(homeworkAndUpdatedClass.updatedClass);
    })
}
const remove = (req, res) => {
    HomeworkModel.findById(req.params.id)
        .then((homework) => removeSubmissions(homework))
        .then((homework) => removeHomeworkFromClass(homework))
        .then((homeworkAndUpdatedClass) => removeHomework(homeworkAndUpdatedClass, res));

};

function changeVisible(homework, statusToChange) {
    return HomeworkModel.findOneAndUpdate({_id: homework}, {$set: {visible: statusToChange}}).exec().then(() => {
        return homework;
    })
}

function returnAllHomeworksOfClass(homework, res) {
    return ClassModel.findOne({homework: homework}).populate('homework').exec().then((classes) => {
        res.status(200).json(classes);
    })
}

const changeVisibility = (req, res) => {
    HomeworkModel.findById(req.params.id)
        .then((homework) => changeVisible(homework, req.body.desiredVisibilityStatus))
        .then((homework) => returnAllHomeworksOfClass(homework, res))
        .catch(() => {
            res.status(404).json({
                error: "Class not found",
                message: "The class could not be found!"
            });
        })
};


module.exports = {
    create,
    getHomeworkDetail,
    remove,
    changeVisibility,
    update
};