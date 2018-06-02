"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const UserModel = require('../models/user');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');

const findByHomework = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.params, 'id'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a id property for the homework'
        });
    const homeworkId = req.params.id;
    SubmissionModel.find({homework: homeworkId})
        .then(submission => {
            res.status(200).json(submission);
        }).catch((error) => {
        res.status(500).json(error);
    });
};

// body has to contain array of exercises, id student and id of the homework
const create = (req, res) => {
    const addSubmission = req.body;
    SubmissionModel.create(addSubmission)
        .then((submission) => {
            res.status(200).json(submission);
        }).catch(error => {
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        })
    });
};


const findSubmissionOfStudentByHomework = (req, res) => {
    const userId = req.userId;
    const homeworkId = req.params.id;
    SubmissionModel.find({homework: homeworkId, student: userId})
        .exec()
        .then(submission => {
            if (submission.length === 0) return res.status(404).json({
                error: 'Not Found',
                message: `No submission found`
            });

            res.status(200).json(submission);
        })
        .catch(error => {
            res.status(500).json(error);
        })
}


module.exports = {
    findByHomework,
    create,
    findSubmissionOfStudentByHomework
};
